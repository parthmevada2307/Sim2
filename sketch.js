let items = [];
let beakerContents = [];
let popUpMessage = '';
let popUpTimer = 0;
let lockedLiquidName = null;

let popUpDuration = 60;
let liquidImages = {};
let litmus = {
  x: 0,
  y: 0,
  w: 25,
  h: 100,
  dragging: false,
  offsetX: 0,
  offsetY: 0
};

let draggingItem = null;
let dragOffsetX = 0;
let dragOffsetY = 0;

let litmusPH = null;
let isLitmusInLiquid = false;
let liquidTopY = 0;
let liquidBottomY = 0;

const maxLayers = 12;
const liquidHeight = 15;
const maxLiquidHeight = maxLayers * liquidHeight;

let pouringSound;
let pourQueue = [];
let currentPour = null;
let pourProgress = 0;
let isPouring = false;

let resetButton;
let dropSize = 8;
let dropSpeed = 4;

// Layout variables
let layout = {};

function preload() {
  pouringSound = loadSound('water-pouring-98795.mp3');

  let imagePaths = {
    "Coffee": "coffee.jpg",
    "Apple Juice": "apple juice.jpg",
    "Lemon Juice": "lemonjuice.jpg",
    "Milk": "milk1.jpg",
    "Mouthwash": "mouthwash.jpg",
    "Pickle": "pickle11.jpg",
    "Soap": "soap.jpg",
    "CocaCola": "soda.jpg",
    "Tomato Juice": "tomatojuice1.jpg",
    "Vinegar": "vinegar.jpg",
    "Water": "water1.jpg"
  };

  for (let key in imagePaths) {
    liquidImages[key] = loadImage(imagePaths[key]);
  }
}

class Drop {
  constructor(x, y, liquid) {
    this.x = x;
    this.y = y;
    this.liquid = liquid;
    this.size = dropSize;
    this.speed = dropSpeed;
    this.active = true;
  }

  update() {
    if (this.y < liquidTopY) {
      this.y += this.speed;
    } else {
      if (beakerContents.length < maxLayers) {
        beakerContents.push(this.liquid);
      }
      this.active = false;
      if (pouringSound && !pouringSound.isPlaying()) pouringSound.play();
    }
  }

  display() {
    noStroke();
    fill(this.liquid.color);
    ellipse(this.x, this.y, this.size, this.size);
  }
}

function buildLayout() {
  let isPortrait = height > width;

  let leftMargin, topMargin, itemSize, itemSpacing, fontSize;
  let beakerCx, beakerTopY, beakerW, beakerH;
  let litmusInitX, litmusInitY, litmusW, litmusH;
  let meterX, meterY, meterRadius;

  if (isPortrait) {
    let sw = width / 400;
    let sh = height / 800;

    leftMargin = 10;
    topMargin = 120 * sh;
    itemSize = 25 * sw;
    itemSpacing = ((height - topMargin - 80) / 11);
    fontSize = 14 * sw;

    beakerCx = width * 0.65;
    beakerTopY = topMargin + 80 * sh;
    beakerW = 100 * sw;
    beakerH = 200 * sh;

    litmusInitX = beakerCx + beakerW / 2 + 25 * sw;
    litmusInitY = beakerTopY;
    litmusW = 20 * sw;
    litmusH = 80 * sh;

    meterX = beakerCx;
    meterY = beakerTopY + beakerH + 110 * sh;
    meterRadius = 70 * sw;
  } else {
    let s = min(width, height) / 800;
    s = max(s, 0.45);

    leftMargin = max(width * 0.03, 10);
    itemSize = max(30 * s, 22);
    itemSpacing = max(45 * s, 32);
    topMargin = max(130 * s, 100);
    fontSize = max(14 * s, 9);

    beakerCx = max(width * 0.42, leftMargin + 150 * s);
    beakerTopY = topMargin + 120 * s;
    beakerW = max(120 * s, 70);
    beakerH = max(200 * s, 120);

    litmusInitX = beakerCx + beakerW / 2 + 40 * s;
    litmusInitY = beakerTopY;
    litmusW = max(25 * s, 15);
    litmusH = max(100 * s, 60);

    meterX = min(width * 0.78, width - 150 * s);
    meterY = beakerTopY + beakerH + 80 * s;
    meterRadius = max(100 * s, 60);
  }

  layout = {
    scale: isPortrait ? width / 800 : max(min(width, height) / 800, 0.45),
    leftMargin: leftMargin,
    topMargin: topMargin,
    itemSize: itemSize,
    itemSpacing: itemSpacing,
    fontSize: fontSize,
    beakerCx: beakerCx,
    beakerTopY: beakerTopY,
    beakerW: beakerW,
    beakerH: beakerH,
    litmusInitX: litmusInitX,
    litmusInitY: litmusInitY,
    litmusW: litmusW,
    litmusH: litmusH,
    meterX: meterX,
    meterY: meterY,
    meterRadius: meterRadius
  };

  let liquids = [
    { name: "Coffee", pH: 4.89, color: 'brown' },
    { name: "Apple Juice", pH: 3.5, color: 'red' },
    { name: "Lemon Juice", pH: 2.2, color: 'yellow' },
    { name: "Milk", pH: 6.5, color: '#fffdd0' },
    { name: "Mouthwash", pH: 9.0, color: '#80dfff' },
    { name: "Pickle", pH: 3.0, color: 'darkred' },
    { name: "Soap", pH: 9.5, color: '#b0e0e6' },
    { name: "CocaCola", pH: 2.5, color: 'black' },
    { name: "Tomato Juice", pH: 4.2, color: '#ff6347' },
    { name: "Vinegar", pH: 2.8, color: '#ffb6c1' },
    { name: "Water", pH: 7, color: 'blue' }
  ];

  items = [];
  liquids.forEach(function(item, index) {
    items.push({
      name: item.name,
      pH: item.pH,
      color: item.color,
      x: leftMargin,
      y: topMargin + index * itemSpacing,
      w: itemSize,
      h: itemSize
    });
  });

  litmus.w = litmusW;
  litmus.h = litmusH;

  if (resetButton) {
    resetButton.position(width / 2 - 30, max(90 * s, 70));
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  textFont('Times New Roman');

  buildLayout();

  litmus.x = layout.litmusInitX;
  litmus.y = layout.litmusInitY;

  resetButton = createButton("Reset");
  resetButton.position(width / 2 - 30, max(90 * layout.scale, 70));
  resetButton.mousePressed(resetSimulation);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  buildLayout();
}

function resetSimulation() {
  beakerContents = [];
  pourQueue = [];
  currentPour = null;
  pourProgress = 0;
  isPouring = false;
  litmus.x = layout.litmusInitX;
  litmus.y = layout.litmusInitY;
  litmus.dragging = false;
  draggingItem = null;
  litmusPH = null;
  isLitmusInLiquid = false;
  lockedLiquidName = null;
}

function draw() {
  background(255);
  let s = layout.scale;

  textAlign(CENTER, TOP);
  textSize(max(32 * s, 18));
  fill(0);
  textStyle(BOLD);
  text("Stage - 2", width / 2, max(20 * s, 10));

  textSize(max(25 * s, 14));
  fill(0);
  text("How is it acidic or basic?", width / 2, max(55 * s, 38));

  textStyle(NORMAL);
  items.forEach(function(item) {
    if (liquidImages[item.name]) {
      image(liquidImages[item.name], item.x, item.y, item.w, item.h);
    } else {
      fill(item.color);
      noStroke();
      ellipse(item.x + item.w / 2, item.y + item.h / 2, item.w, item.h);
    }

    fill(0);
    textAlign(LEFT, CENTER);
    textSize(layout.fontSize);
    text(item.name, item.x + item.w + 5, item.y + item.h / 2);
  });

  let cx = layout.beakerCx;
  let topY = layout.beakerTopY;
  let w = layout.beakerW;
  let h = layout.beakerH;
  let ellipseHeight = 30 * s;
  let bottomY = topY + h;

  drawBeaker(cx, topY, w, h);

  liquidTopY = bottomY;
  liquidBottomY = bottomY;

  let scaledLiquidHeight = liquidHeight * max(s, 0.6);

  if (beakerContents.length > 0) {
    let mixColor = averageColor(beakerContents.map(function(i) { return i.color; }));
    fill(mixColor);
    noStroke();
    let totalHeight = beakerContents.length * scaledLiquidHeight;
    liquidTopY = bottomY - totalHeight - ellipseHeight / 2;
    liquidBottomY = bottomY - ellipseHeight / 2;
    rect(cx - w / 2 + 5, liquidTopY, w - 10, totalHeight);
  }

  drawBeakerMarks(cx, topY, w, h);

  let currentHeight = beakerContents.length * scaledLiquidHeight;
  let scaledMaxHeight = maxLayers * scaledLiquidHeight;

  // Pouring logic
  if (!isPouring && pourQueue.length > 0 && currentHeight < scaledMaxHeight) {
    currentPour = pourQueue.shift();
    isPouring = true;
    pourProgress = 0;
    if (!pouringSound.isPlaying()) pouringSound.loop();
  }

  if (isPouring && currentPour) {
    pourProgress += 2;
    if (pourProgress >= 15) {
      beakerContents.push(currentPour);
      isPouring = false;
      currentPour = null;
      if (pouringSound.isPlaying()) pouringSound.stop();
    } else {
      drawPouringGlass(currentPour, pourProgress);
    }
  }

  if (!isPouring && pouringSound.isPlaying()) {
    pouringSound.stop();
  }

  // Litmus logic
  isLitmusInLiquid = false;
  litmusPH = null;

  if (beakerContents.length > 0) {
    let litmusTop = litmus.y;
    let litmusBottom = litmus.y + litmus.h;
    let litmusRight = litmus.x + litmus.w;
    let litmusLeft = litmus.x;

    if (
      litmusBottom > liquidTopY &&
      litmusTop < liquidBottomY &&
      litmusRight > cx - w / 2 &&
      litmusLeft < cx + w / 2
    ) {
      litmusPH = averagePH(beakerContents);
      isLitmusInLiquid = true;
    }
  }

  drawLitmusPaper(litmus.x, litmus.y, litmus.w, litmus.h, litmusPH, isLitmusInLiquid);
  fill(0);
  textSize(max(12 * s, 8));
  textAlign(CENTER, BOTTOM);
  text("Litmus Paper", litmus.x + litmus.w / 2, litmus.y - 3);

  // pH Meter
  let meterX = layout.meterX;
  let meterY = layout.meterY;
  let meterRadius = layout.meterRadius;
  let phForMeter = (isLitmusInLiquid && beakerContents.length > 0) ? averagePH(beakerContents) : null;
  drawPHMeter(meterX, meterY, meterRadius, phForMeter);

  // pH info box
  let staticBoxX = min(meterX, width - 130 * s);
  let staticBoxY = layout.beakerTopY + 40 * s;

  let staticMessage = 'Dip paper in liquid';
  let boxColor = 'white';

  if (isLitmusInLiquid && litmusPH !== null) {
    staticMessage = 'pH = ' + litmusPH.toFixed(2);

    if (litmusPH < 3.5) {
      boxColor = '#ff0000';
      staticMessage = 'Strong Acid (' + staticMessage + ')';
    } else if (litmusPH < 7) {
      boxColor = '#ffa500';
      staticMessage = 'Weak Acid (' + staticMessage + ')';
    } else if (litmusPH === 7) {
      boxColor = '#00ff00';
      staticMessage = 'Neutral (' + staticMessage + ')';
    } else if (litmusPH <= 10) {
      boxColor = '#1e90ff';
      staticMessage = 'Weak Base (' + staticMessage + ')';
    } else {
      boxColor = '#4b0082';
      staticMessage = 'Strong Base (' + staticMessage + ')';
    }
  }

  push();
  rectMode(CENTER);
  textAlign(CENTER, CENTER);
  textSize(max(14 * s, 10));
  noStroke();
  fill(boxColor);
  rect(staticBoxX, staticBoxY, max(220 * s, 140), max(50 * s, 35), 12);
  fill('white');
  text(staticMessage, staticBoxX, staticBoxY);
  pop();
}

function drawBeaker(cx, topY, w, h) {
  let s = layout.scale;
  let bottomY = topY + h;
  let ellipseHeight = 30 * s;
  stroke(0);
  strokeWeight(2);
  fill(240, 240, 255, 80);

  beginShape();
  vertex(cx - w / 2, topY);
  vertex(cx - w / 2, bottomY - ellipseHeight / 2);
  vertex(cx + w / 2, bottomY - ellipseHeight / 2);
  vertex(cx + w / 2, topY);
  endShape(CLOSE);

  fill(255);
  ellipse(cx, topY, w, ellipseHeight);
  fill(240, 240, 255, 80);
  ellipse(cx, topY + 3, w * 0.9, ellipseHeight * 0.6);

  noStroke();
  fill(0);
  textSize(max(16 * s, 10));
  textAlign(CENTER, TOP);
  text("Glass", cx, bottomY + 5);
}

function drawBeakerMarks(cx, topY, w, h) {
  let s = layout.scale;
  let bottomY = topY + h;
  let ellipseHeight = 30 * s;
  stroke(0);
  strokeWeight(1);
  let marks = 10;
  for (let i = 1; i < marks; i++) {
    let y = map(i, 0, marks, topY + ellipseHeight / 2, bottomY - ellipseHeight / 2);
    line(cx - w / 2 + 5, y, cx - w / 2 + 15, y);
  }
}

function drawLitmusPaper(x, y, w, h, ph, inLiquid) {
  noStroke();
  fill('yellow');
  rect(x, y, w, h);

  if (inLiquid && ph !== null) {
    let intersectTop = max(y, liquidTopY);
    let intersectBottom = min(y + h, liquidBottomY);
    let intersectHeight = max(0, intersectBottom - intersectTop);

    if (intersectHeight > 0) {
      let litmusColor = 'yellow';

      if (ph >= 0 && ph < 1) litmusColor = '#ff0000';
      else if (ph >= 1 && ph < 2) litmusColor = '#ff4000';
      else if (ph >= 2 && ph < 3) litmusColor = '#ff8000';
      else if (ph >= 3 && ph < 4) litmusColor = '#ffbf00';
      else if (ph >= 4 && ph < 5) litmusColor = '#ffff00';
      else if (ph >= 5 && ph < 6) litmusColor = '#bfff00';
      else if (ph >= 6 && ph < 7) litmusColor = '#80ff00';
      else if (ph === 7) litmusColor = '#00ff00';
      else if (ph > 7 && ph <= 8) litmusColor = '#00ff80';
      else if (ph > 8 && ph <= 9) litmusColor = '#00ffff';
      else if (ph > 9 && ph <= 10) litmusColor = '#0080ff';
      else if (ph > 10 && ph <= 11) litmusColor = '#0000ff';
      else if (ph > 11 && ph <= 12) litmusColor = '#8000ff';
      else if (ph > 12 && ph <= 14) litmusColor = '#bf00ff';

      fill(litmusColor);
      rect(x, intersectTop, w, intersectHeight);
    }
  }
}

function drawPouringGlass(liquid, progress) {
  let s = layout.scale;
  let glassX = layout.beakerCx;
  let glassY = layout.beakerTopY - 40 * s - progress;
  push();
  translate(glassX, glassY);
  rotate(radians(-45));
  stroke(100);
  strokeWeight(1.5);
  fill(255, 255, 255, 80);
  let gw = 15 * max(s, 0.6);
  let gh = 30 * max(s, 0.6);
  beginShape();
  vertex(-gw, -gh);
  vertex(-gw - 5, gh);
  vertex(gw + 5, gh);
  vertex(gw, -gh);
  bezierVertex(gw - 5, -gh - 5, -gw + 5, -gh - 5, -gw, -gh);
  endShape(CLOSE);

  fill(liquid.color);
  noStroke();
  quad(-gw + 2, 5, -gw - 2, gh - 2, gw + 2, gh - 2, gw - 2, 5);
  pop();

  if (progress > 10) {
    stroke(liquid.color);
    strokeWeight(max(6 * s, 3));
    line(glassX, glassY + gh, layout.beakerCx, layout.beakerTopY);
  }
}

function drawPHMeter(cx, cy, radius, phValue) {
  let s = layout.scale;
  let colors = ['#ff0000', '#ff4000', '#ff8000', '#ffbf00', '#ffff00', '#bfff00', '#80ff00',
    '#40ff00', '#00ff00', '#00ffff', '#00bfff', '#0080ff', '#0040ff', '#0000ff', '#4000ff'];

  for (let i = 0; i < 14; i++) {
    let startAngle = map(i, 0, 14, PI, TWO_PI);
    let endAngle = map(i + 1, 0, 14, PI, TWO_PI);
    fill(colors[i]);
    noStroke();
    arc(cx, cy, radius * 2, radius * 2, startAngle, endAngle, PIE);
  }

  noFill();
  stroke(0);
  strokeWeight(max(4 * s, 2));
  arc(cx, cy, radius * 2, radius * 2, PI, TWO_PI);

  strokeWeight(max(2 * s, 1));
  fill(0);
  textSize(max(12 * s, 7));
  for (let i = 0; i <= 14; i++) {
    let angle = map(i, 0, 14, PI, TWO_PI);
    let inner = radius - 15 * s;
    let outer = radius;
    let x1 = cx + cos(angle) * inner;
    let y1 = cy + sin(angle) * inner;
    let x2 = cx + cos(angle) * outer;
    let y2 = cy + sin(angle) * outer;
    stroke(0);
    line(x1, y1, x2, y2);

    let tx = cx + cos(angle) * (radius + 20 * s);
    let ty = cy + sin(angle) * (radius + 20 * s);
    noStroke();
    fill(0);
    textAlign(CENTER, CENTER);
    text(i, tx, ty);

    if (i === 0) text("Acidic", tx, ty + 12 * s);
    if (i === 7) text("Neutral", tx, ty + 12 * s);
    if (i === 14) text("Basic", tx, ty + 12 * s);
  }

  if (phValue !== null) {
    let needleAngle = map(phValue, 0, 14, PI, TWO_PI);
    let nx = cx + cos(needleAngle) * (radius - 30 * s);
    let ny = cy + sin(needleAngle) * (radius - 30 * s);

    stroke(255, 0, 0);
    strokeWeight(max(4 * s, 2));
    line(cx, cy, nx, ny);

    fill(0);
    noStroke();
    ellipse(cx, cy, max(10 * s, 6), max(10 * s, 6));
  }
}

// Mouse events
function mousePressed() {
  handlePress(mouseX, mouseY);
}

function mouseDragged() {
  handleDrag(mouseX, mouseY);
}

function mouseReleased() {
  handleRelease();
}

// Touch events
function touchStarted() {
  if (touches.length > 0) {
    handlePress(touches[0].x, touches[0].y);
  }
  return false;
}

function touchMoved() {
  if (touches.length > 0) {
    handleDrag(touches[0].x, touches[0].y);
  }
  return false;
}

function touchEnded() {
  handleRelease();
  return false;
}

function handlePress(px, py) {
  // Check if tapped on a liquid item
  for (let i = 0; i < items.length; i++) {
    let item = items[i];
    if (
      px > item.x - 5 && px < item.x + item.w + 80 &&
      py > item.y - 5 && py < item.y + item.h + 5
    ) {
      // Only allow if beaker not full AND matches locked liquid or no lock
      if (lockedLiquidName === null || lockedLiquidName === item.name) {
        lockedLiquidName = item.name;
        pourQueue.push(item);
      } else {
        popUpMessage = 'Only continue with ' + lockedLiquidName;
        popUpTimer = popUpDuration;
      }
      return;
    }
  }

  // Litmus dragging
  if (
    px > litmus.x - 10 && px < litmus.x + litmus.w + 10 &&
    py > litmus.y - 10 && py < litmus.y + litmus.h + 10
  ) {
    litmus.dragging = true;
    litmus.offsetX = px - litmus.x;
    litmus.offsetY = py - litmus.y;
  }
}

function handleDrag(px, py) {
  if (litmus.dragging) {
    litmus.x = px - litmus.offsetX;
    litmus.y = py - litmus.offsetY;
  }
}

function handleRelease() {
  litmus.dragging = false;
  draggingItem = null;
}

function averageColor(colors) {
  let r = 0, g = 0, b = 0;
  colors.forEach(function(c) {
    let col = color(c);
    r += red(col);
    g += green(col);
    b += blue(col);
  });
  r /= colors.length;
  g /= colors.length;
  b /= colors.length;
  return color(r, g, b);
}

function averagePH(contents) {
  let sum = 0;
  contents.forEach(function(c) { sum += c.pH; });
  return sum / contents.length;
}
