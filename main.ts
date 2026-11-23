// GTA VI countdown meme — painted from scratch with Node 22 stdlib only.
// No canvas, no npm deps: a raw RGBA buffer, a 5x7 bitmap font, and a
// hand-rolled PNG encoder (CRC32 + zlib deflate, filter 0).
//
// Usage: node main.ts   (writes meme.png to $MAKEFUN_OUTPUT_DIR or /output)

import { mkdirSync, writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";
import { createHash } from "node:crypto";

const W = 1024;
const H = 1024;
const px = Buffer.alloc(W * H * 4);

// ---------------------------------------------------------------- palette
const INK = [10, 8, 18];
const MAGENTA = [232, 28, 138];
const GOLD = [255, 200, 45];
const WHITE = [255, 255, 255];
const GREY = [155, 155, 165];
const LIGHT_GREY = [205, 205, 215];
const PINK = [255, 130, 192];
const RED = [235, 35, 45];
const ROAD = [40, 26, 75];
const PALM = [55, 22, 105];

// ---------------------------------------------------------------- pixels
function setPixel(x, y, c) {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 4;
  px[i] = c[0];
  px[i + 1] = c[1];
  px[i + 2] = c[2];
  px[i + 3] = 255;
}

function fillRect(x, y, w, h, c) {
  const x0 = Math.max(0, Math.round(x));
  const y0 = Math.max(0, Math.round(y));
  const x1 = Math.min(W, Math.round(x + w));
  const y1 = Math.min(H, Math.round(y + h));
  for (let yy = y0; yy < y1; yy++) {
    for (let xx = x0; xx < x1; xx++) setPixel(xx, yy, c);
  }
}

function fillEllipse(cx, cy, rx, ry, c) {
  const y0 = Math.max(0, Math.round(cy - ry));
  const y1 = Math.min(H - 1, Math.round(cy + ry));
  for (let y = y0; y <= y1; y++) {
    const t = (y - cy) / ry;
    if (t < -1 || t > 1) continue;
    const dx = rx * Math.sqrt(1 - t * t);
    const x0 = Math.max(0, Math.round(cx - dx));
    const x1 = Math.min(W - 1, Math.round(cx + dx));
    for (let x = x0; x <= x1; x++) setPixel(x, y, c);
  }
}

function fillCircle(cx, cy, r, c) {
  fillEllipse(cx, cy, r, r, c);
}

function fillPolygon(points, c) {
  // Even-odd scanline fill.
  let minY = H;
  let maxY = 0;
  for (const p of points) {
    minY = Math.min(minY, p[1]);
    maxY = Math.max(maxY, p[1]);
  }
  minY = Math.max(0, Math.floor(minY));
  maxY = Math.min(H - 1, Math.ceil(maxY));
  for (let y = minY; y <= maxY; y++) {
    const xs = [];
    for (let i = 0; i < points.length; i++) {
      const a = points[i];
      const b = points[(i + 1) % points.length];
      if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y)) {
        const t = (y - a[1]) / (b[1] - a[1]);
        xs.push(a[0] + t * (b[0] - a[0]));
      }
    }
    xs.sort((m, n) => m - n);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const x0 = Math.max(0, Math.ceil(xs[k]));
      const x1 = Math.min(W - 1, Math.floor(xs[k + 1]));
      for (let x = x0; x <= x1; x++) setPixel(x, y, c);
    }
  }
}

function thickLine(x0, y0, x1, y1, r, c) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const steps = Math.max(Math.abs(dx), Math.abs(dy), 1);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    fillCircle(x0 + dx * t, y0 + dy * t, r, c);
  }
}

function roundRect(x, y, w, h, r, c) {
  fillRect(x + r, y, w - 2 * r, h, c);
  fillRect(x, y + r, w, h - 2 * r, c);
  fillCircle(x + r, y + r, r, c);
  fillCircle(x + w - r, y + r, r, c);
  fillCircle(x + r, y + h - r, r, c);
  fillCircle(x + w - r, y + h - r, r, c);
}

// ---------------------------------------------------------------- 5x7 font
// Each glyph: 7 rows, 5 bits each (bit 4 = leftmost pixel).
const FONT = {
  A: [0x0e, 0x11, 0x11, 0x1f, 0x11, 0x11, 0x11],
  B: [0x1e, 0x11, 0x11, 0x1e, 0x11, 0x11, 0x1e],
  C: [0x0e, 0x11, 0x10, 0x10, 0x10, 0x11, 0x0e],
  D: [0x1e, 0x11, 0x11, 0x11, 0x11, 0x11, 0x1e],
  E: [0x1f, 0x10, 0x10, 0x1e, 0x10, 0x10, 0x1f],
  F: [0x1f, 0x10, 0x10, 0x1e, 0x10, 0x10, 0x10],
  G: [0x0e, 0x11, 0x10, 0x17, 0x11, 0x11, 0x0f],
  H: [0x11, 0x11, 0x11, 0x1f, 0x11, 0x11, 0x11],
  I: [0x0e, 0x04, 0x04, 0x04, 0x04, 0x04, 0x0e],
  K: [0x11, 0x12, 0x14, 0x18, 0x14, 0x12, 0x11],
  L: [0x10, 0x10, 0x10, 0x10, 0x10, 0x10, 0x1f],
  M: [0x11, 0x1b, 0x15, 0x15, 0x11, 0x11, 0x11],
  N: [0x11, 0x19, 0x15, 0x13, 0x11, 0x11, 0x11],
  O: [0x0e, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0e],
  P: [0x1e, 0x11, 0x11, 0x1e, 0x10, 0x10, 0x10],
  R: [0x1e, 0x11, 0x11, 0x1e, 0x14, 0x12, 0x11],
  S: [0x0f, 0x10, 0x10, 0x0e, 0x01, 0x01, 0x1e],
  T: [0x1f, 0x04, 0x04, 0x04, 0x04, 0x04, 0x04],
  U: [0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0e],
  V: [0x11, 0x11, 0x11, 0x11, 0x11, 0x0a, 0x04],
  W: [0x11, 0x11, 0x11, 0x15, 0x15, 0x1b, 0x11],
  Y: [0x11, 0x11, 0x0a, 0x04, 0x04, 0x04, 0x04],
  "0": [0x0e, 0x11, 0x13, 0x15, 0x19, 0x11, 0x0e],
  "1": [0x04, 0x0c, 0x04, 0x04, 0x04, 0x04, 0x0e],
  "2": [0x0e, 0x11, 0x01, 0x02, 0x04, 0x08, 0x1f],
  "3": [0x1f, 0x02, 0x04, 0x02, 0x01, 0x11, 0x0e],
  "7": [0x1f, 0x01, 0x02, 0x04, 0x08, 0x08, 0x08],
  a: [0x00, 0x00, 0x0e, 0x01, 0x0f, 0x11, 0x0f],
  e: [0x00, 0x00, 0x0e, 0x11, 0x1f, 0x10, 0x0e],
  f: [0x06, 0x08, 0x08, 0x1e, 0x08, 0x08, 0x08],
  k: [0x10, 0x10, 0x12, 0x14, 0x18, 0x14, 0x12],
  m: [0x00, 0x00, 0x1a, 0x15, 0x15, 0x15, 0x15],
  n: [0x00, 0x00, 0x16, 0x19, 0x11, 0x11, 0x11],
  u: [0x00, 0x00, 0x11, 0x11, 0x11, 0x13, 0x0d],
  ".": [0x00, 0x00, 0x00, 0x00, 0x00, 0x0c, 0x0c],
  ",": [0x00, 0x00, 0x00, 0x00, 0x0c, 0x04, 0x08],
  " ": [0, 0, 0, 0, 0, 0, 0],
};

function textWidth(str, scale) {
  return str.length * 6 * scale - scale;
}

function drawText(str, x, y, scale, c) {
  let cx = x;
  for (const ch of str) {
    const g = FONT[ch] || FONT[" "];
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 5; col++) {
        if (g[row] & (1 << (4 - col))) {
          fillRect(cx + col * scale, y + row * scale, scale, scale, c);
        }
      }
    }
    cx += 6 * scale;
  }
}

function drawTextCentered(str, cx, y, scale, c) {
  drawText(str, cx - textWidth(str, scale) / 2, y, scale, c);
}

// ---------------------------------------------------------------- shapes
function star(cx, cy, R, c) {
  const pts = [];
  const inner = R * 0.42;
  for (let i = 0; i < 10; i++) {
    const ang = -Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 === 0 ? R : inner;
    pts.push([cx + r * Math.cos(ang), cy + r * Math.sin(ang)]);
  }
  fillPolygon(pts, c);
}

function ghost(cx, cy, s) {
  // s = body width. White ghost with a wavy hem, two eyes, small mouth.
  const half = s / 2;
  fillCircle(cx, cy - s * 0.08, s * 0.32, WHITE); // dome
  fillRect(cx - half, cy - s * 0.08, s, s * 0.40, WHITE); // body
  const bump = s * 0.107;
  fillCircle(cx - half + bump, cy + s * 0.30, bump, WHITE);
  fillCircle(cx, cy + s * 0.30, bump, WHITE);
  fillCircle(cx + half - bump, cy + s * 0.30, bump, WHITE);
  // eyes + mouth
  fillCircle(cx - s * 0.13, cy + s * 0.02, s * 0.06, INK);
  fillCircle(cx + s * 0.13, cy + s * 0.02, s * 0.06, INK);
  fillEllipse(cx, cy + s * 0.17, s * 0.05, s * 0.035, INK);
  // tiny magenta spark on the ghost's right
  fillCircle(cx + s * 0.26, cy + s * 0.08, s * 0.05, MAGENTA);
}

function ghostMark(cx, cy, r) {
  fillCircle(cx, cy, r, MAGENTA);
  ghost(cx, cy, r * 1.35);
}

function cloud(cx, cy, w, h) {
  const dark = [110, 48, 178];
  const light = [145, 78, 212];
  fillEllipse(cx - w * 0.28, cy + h * 0.10, w * 0.30, h * 0.42, dark);
  fillEllipse(cx + w * 0.05, cy - h * 0.05, w * 0.34, h * 0.52, dark);
  fillEllipse(cx + w * 0.32, cy + h * 0.12, w * 0.26, h * 0.38, dark);
  fillEllipse(cx - w * 0.05, cy - h * 0.22, w * 0.30, h * 0.40, light);
  fillEllipse(cx + w * 0.25, cy - h * 0.12, w * 0.22, h * 0.34, light);
}

function palm(bx, by, hgt, lean) {
  const topX = bx + lean;
  const topY = by - hgt;
  // curved trunk: filled circles along a quadratic arc
  const steps = 24;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = bx + (topX - bx) * t + Math.sin(t * Math.PI) * lean * 0.3;
    const y = by - hgt * t;
    fillCircle(x, y, 6 - t * 2, PALM);
  }
  // fronds: fan of drooping two-segment arcs
  const fronds = [-175, -155, -130, -105, -80, -55, -30, -5];
  for (const deg of fronds) {
    const a = (deg * Math.PI) / 180;
    const len = hgt * 0.52;
    const mx = topX + Math.cos(a) * len * 0.6;
    const my = topY + Math.sin(a) * len * 0.6 + len * 0.12;
    const ex = topX + Math.cos(a) * len;
    const ey = topY + Math.sin(a) * len + len * 0.40;
    thickLine(topX, topY, mx, my, 4.5, PALM);
    thickLine(mx, my, ex, ey, 4.5, PALM);
  }
  fillCircle(topX, topY, 5, PALM);
}

// ---------------------------------------------------------------- sky
function lerp(a, b, t) {
  return a + (b - a) * t;
}
for (let y = 0; y < 852; y++) {
  let c;
  if (y < 340) {
    const t = y / 340;
    c = [lerp(244, 200, t), lerp(42, 60, t), lerp(128, 175, t)];
  } else {
    const t = (y - 340) / 512;
    c = [lerp(200, 105, t), lerp(60, 45, t), lerp(175, 180, t)];
  }
  for (let x = 0; x < W; x++) setPixel(x, y, c);
}

// clouds (behind everything else)
cloud(150, 130, 280, 90);
cloud(860, 95, 320, 95);
cloud(60, 265, 240, 80);
cloud(890, 235, 280, 85);
cloud(340, 295, 300, 80);
cloud(640, 300, 260, 75);
cloud(500, 175, 240, 70);
cloud(1010, 330, 200, 70);
cloud(20, 340, 180, 65);

// ---------------------------------------------------------------- skyline + street
// distant low skyline silhouette along the horizon
fillRect(0, 688, W, 34, [70, 30, 120]);
fillRect(380, 668, 60, 54, [70, 30, 120]);
fillRect(600, 672, 70, 50, [70, 30, 120]);
fillRect(450, 680, 40, 42, [70, 30, 120]);

// buildings
// left: peach art-deco
fillRect(0, 430, 175, 422, [244, 176, 148]);
fillRect(0, 430, 175, 12, [255, 200, 175]);
fillRect(18, 470, 8, 382, [228, 140, 125]);
fillRect(150, 470, 8, 382, [228, 140, 125]);
// deco panel on the facade
fillRect(60, 560, 56, 120, [228, 140, 125]);
// windows, left building
for (let r = 0; r < 3; r++) {
  for (let col = 0; col < 2; col++) {
    const wx = 30 + col * 62;
    const wy = 470 + r * 105;
    fillRect(wx, wy, 42, 62, [110, 120, 195]);
    fillRect(wx + 4, wy + 4, 34, 54, [140, 150, 215]);
  }
}
// neon strips, left
fillRect(0, 690, 175, 5, [255, 80, 180]);
fillRect(0, 758, 175, 5, [255, 80, 180]);
fillRect(0, 812, 175, 5, [255, 80, 180]);

// right: lavender art-deco
fillRect(849, 430, 175, 422, [178, 168, 248]);
fillRect(849, 430, 175, 12, [205, 195, 255]);
fillRect(866, 470, 8, 382, [140, 130, 220]);
fillRect(998, 470, 8, 382, [140, 130, 220]);
for (let r = 0; r < 3; r++) {
  for (let col = 0; col < 2; col++) {
    const wx = 880 + col * 62;
    const wy = 470 + r * 105;
    fillRect(wx, wy, 42, 62, [95, 100, 185]);
    fillRect(wx + 4, wy + 4, 34, 54, [125, 130, 205]);
  }
}
fillRect(849, 690, 175, 5, [255, 90, 200]);
fillRect(849, 758, 175, 5, [255, 90, 200]);
fillRect(849, 812, 175, 5, [255, 90, 200]);

// palms: two big ones framing the street
palm(52, 480, 110, -18);
palm(972, 480, 110, 18);

// road with perspective (narrower at the bottom than the full width,
// so the buildings read as street-side)
fillPolygon([[120, 852], [440, 700], [584, 700], [904, 852]], ROAD);
// edge lines
thickLine(120, 852, 440, 700, 2, [120, 110, 160]);
thickLine(904, 852, 584, 700, 2, [120, 110, 160]);
// centre dashes, shrinking toward the vanishing point
for (let i = 0; i < 7; i++) {
  const t = i / 7;
  const y0 = 852 - t * 140;
  const y1 = y0 - 16 + t * 8;
  const wdt = 5 - t * 3;
  fillRect(512 - wdt / 2, y1, wdt, y0 - y1, [200, 200, 220]);
}
// two small cars in the distance, on the road below the billboard
function car(cx, cy, s, body) {
  fillRect(cx - 26 * s, cy - 8 * s, 52 * s, 12 * s, body);
  fillRect(cx - 16 * s, cy - 15 * s, 30 * s, 9 * s, [200, 210, 235]);
  fillCircle(cx - 15 * s, cy + 5 * s, 4 * s, INK);
  fillCircle(cx + 15 * s, cy + 5 * s, 4 * s, INK);
}
car(545, 724, 0.85, [240, 235, 245]);
car(600, 728, 0.95, [250, 160, 190]);
// small palms flanking the road in the distance, just below the billboard
palm(408, 730, 28, -4);
palm(616, 730, 28, 4);

// ---------------------------------------------------------------- wanted bar
roundRect(250, 32, 524, 126, 28, INK);
drawTextCentered("WANTED", 512, 48, 4, GOLD);
for (let i = 0; i < 5; i++) star(330 + i * 75, 112, 34, GOLD);
ghostMark(712, 112, 38);

// ---------------------------------------------------------------- billboard
fillRect(165, 340, 694, 365, MAGENTA);
fillRect(171, 346, 682, 353, INK);
// poles
fillRect(300, 705, 30, 80, [30, 22, 55]);
fillRect(694, 705, 30, 80, [30, 22, 55]);
// billboard copy
drawTextCentered("GTA VI", 512, 372, 9, WHITE);
drawTextCentered("172 DAYS", 512, 452, 8, GREY);
thickLine(302, 470, 722, 486, 4, RED);
drawTextCentered("173 DAYS", 512, 522, 8, PINK);
drawTextCentered("CHECKED AGAIN. IT MOVED.", 512, 610, 3, LIGHT_GREY);

// ---------------------------------------------------------------- bottom bar
fillRect(0, 852, W, 172, [8, 6, 14]);
fillRect(0, 852, W, 5, MAGENTA);
drawTextCentered("WHILE YOU WAIT, GET PAID TO BUILD.", 512, 886, 4, WHITE);
ghostMark(370, 968, 32);
drawText("make.fun", 412, 950, 5, WHITE);

// ---------------------------------------------------------------- PNG encode
const CRC_TABLE = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[n] = c >>> 0;
}
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, "ascii"), data])), 8 + data.length);
  return out;
}

const raw = Buffer.alloc(H * (1 + W * 4));
for (let y = 0; y < H; y++) {
  raw[y * (1 + W * 4)] = 0; // filter: none
  px.copy(raw, y * (1 + W * 4) + 1, y * W * 4, (y + 1) * W * 4);
}
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 6; // color type RGBA
ihdr[10] = 0;
ihdr[11] = 0;
ihdr[12] = 0;
const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  chunk("IHDR", ihdr),
  chunk("IDAT", deflateSync(raw, { level: 9 })),
  chunk("IEND", Buffer.alloc(0)),
]);

const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
mkdirSync(outDir, { recursive: true });
writeFileSync(`${outDir}/meme.png`, png);
console.log(`meme.png ${W}x${H} ${png.length} bytes sha256=${createHash("sha256").update(png).digest("hex")}`);
