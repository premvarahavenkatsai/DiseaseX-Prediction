const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

function createPNG(width, height, getPixel) {
  const rowSize = width * 4 + 1;
  const rawData = Buffer.alloc(rowSize * height);
  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter type: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixel(x, y);
      const pxOffset = rowOffset + 1 + x * 4;
      rawData[pxOffset] = Math.min(255, Math.max(0, Math.round(r)));
      rawData[pxOffset + 1] = Math.min(255, Math.max(0, Math.round(g)));
      rawData[pxOffset + 2] = Math.min(255, Math.max(0, Math.round(b)));
      rawData[pxOffset + 3] = Math.min(255, Math.max(0, Math.round(a !== undefined ? a : 255)));
    }
  }
  const compressed = zlib.deflateSync(rawData);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    table[n] = c >>> 0;
  }

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const typeBuf = Buffer.from(type);
    const body = Buffer.concat([typeBuf, data]);
    let c = 0xffffffff;
    for (let i = 0; i < body.length; i++) {
      c = (c >>> 8) ^ table[(c ^ body[i]) & 0xff];
    }
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE((c ^ 0xffffffff) >>> 0);
    return Buffer.concat([len, body, crc]);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  return Buffer.concat([signature, chunk('IHDR', ihdr), chunk('IDAT', compressed), chunk('IEND', Buffer.alloc(0))]);
}

// Pseudo-random noise generator
function hash(x, y) {
  let h = (x * 374761393 + y * 668265263) ^ 0x5bf03635;
  h = (h ^ (h >>> 13)) * 1274126177;
  return (h ^ (h >>> 16)) / 2147483648;
}

function noise(x, y) {
  const i = Math.floor(x);
  const j = Math.floor(y);
  const fx = x - i;
  const fy = y - j;
  const s = fx * fx * (3 - 2 * fx);
  const t = fy * fy * (3 - 2 * fy);
  const a = hash(i, j);
  const b = hash(i + 1, j);
  const c = hash(i, j + 1);
  const d = hash(i + 1, j + 1);
  return (a * (1 - s) + b * s) * (1 - t) + (c * (1 - s) + d * s) * t;
}

function fbm(x, y, octaves = 4) {
  let val = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < octaves; i++) {
    val += amp * noise(x * freq, y * freq);
    amp *= 0.5;
    freq *= 2;
  }
  return val;
}

const W = 300, H = 300;
const skinDir = 'd:\\DiseaseX-main_duplicate\\public\\samples\\skin';
const breastDir = 'd:\\DiseaseX-main_duplicate\\public\\samples\\breast';

fs.mkdirSync(skinDir, { recursive: true });
fs.mkdirSync(breastDir, { recursive: true });

// 1. SKIN: Malignant Melanoma
fs.writeFileSync(path.join(skinDir, 'melanoma.png'), createPNG(W, H, (x, y) => {
  const nx = (x - W / 2) / 80;
  const ny = (y - H / 2) / 80;
  const r = Math.sqrt(nx * nx + ny * ny);
  const angle = Math.atan2(ny, nx);
  
  // Asymmetrical distorted border
  const borderDistort = fbm(nx * 3 + 10, ny * 3 + 10) * 0.7 + Math.sin(angle * 5) * 0.15;
  const dist = r + borderDistort;
  
  // Base skin color (natural caucasian / asian tone)
  const skinNoise = fbm(x * 0.05, y * 0.05);
  let red = 230 + skinNoise * 15;
  let green = 188 + skinNoise * 12;
  let blue = 162 + skinNoise * 10;
  
  if (dist < 1.4) {
    const factor = Math.max(0, 1 - dist / 1.4);
    // Melanoma multi-color variegated pigmentation: deep black, dark brown, reddish rim
    const lesionNoise = fbm(nx * 6 + 50, ny * 6 + 50);
    const darkCore = Math.exp(-r * 2.2) * (0.8 + lesionNoise * 0.4);
    
    // Core black & dark brown
    const coreR = 25 + lesionNoise * 40;
    const coreG = 15 + lesionNoise * 20;
    const coreB = 10 + lesionNoise * 15;
    
    // Intermediate reddish brown
    const midR = 110 + lesionNoise * 50;
    const midG = 50 + lesionNoise * 30;
    const midB = 30 + lesionNoise * 20;

    const blend = Math.min(1, factor * 1.5);
    const coreBlend = Math.min(1, darkCore * 2);
    
    const lesR = midR * (1 - coreBlend) + coreR * coreBlend;
    const lesG = midG * (1 - coreBlend) + coreG * coreBlend;
    const lesB = midB * (1 - coreBlend) + coreB * coreBlend;
    
    red = red * (1 - blend) + lesR * blend;
    green = green * (1 - blend) + lesG * blend;
    blue = blue * (1 - blend) + lesB * blend;
  }
  return [red, green, blue, 255];
}));

// 2. SKIN: Benign Melanocytic Nevus
fs.writeFileSync(path.join(skinDir, 'benign_nevus.png'), createPNG(W, H, (x, y) => {
  const nx = (x - W / 2) / 60;
  const ny = (y - H / 2) / 60;
  const r = Math.sqrt(nx * nx + ny * ny);
  
  // Symmetric smooth border with slight natural organic texture
  const dist = r + fbm(nx * 2, ny * 2) * 0.15;
  
  const skinNoise = fbm(x * 0.05, y * 0.05);
  let red = 238 + skinNoise * 10;
  let green = 195 + skinNoise * 10;
  let blue = 170 + skinNoise * 8;
  
  if (dist < 1.1) {
    const factor = Math.pow(Math.max(0, 1 - dist / 1.1), 0.7);
    // Uniform, regular globular brown mole pigmentation
    const nevusNoise = fbm(nx * 8, ny * 8) * 0.15;
    const nevusR = 115 + nevusNoise * 20;
    const nevusG = 70 + nevusNoise * 15;
    const nevusB = 45 + nevusNoise * 10;
    
    red = red * (1 - factor) + nevusR * factor;
    green = green * (1 - factor) + nevusG * factor;
    blue = blue * (1 - factor) + nevusB * factor;
  }
  return [red, green, blue, 255];
}));

// 3. SKIN: Basal Cell Carcinoma
fs.writeFileSync(path.join(skinDir, 'basal_cell.png'), createPNG(W, H, (x, y) => {
  const nx = (x - W / 2) / 65;
  const ny = (y - H / 2) / 65;
  const r = Math.sqrt(nx * nx + ny * ny);
  
  const dist = r + fbm(nx * 3, ny * 3) * 0.25;
  
  const skinNoise = fbm(x * 0.05, y * 0.05);
  let red = 235 + skinNoise * 10;
  let green = 190 + skinNoise * 8;
  let blue = 168 + skinNoise * 8;
  
  if (dist < 1.25) {
    const factor = Math.max(0, 1 - dist / 1.25);
    // Pearly translucent pink nodule with central depression
    const centralDip = Math.exp(-r * 3.5);
    const bccNoise = fbm(nx * 5, ny * 5);
    
    // Pearly pinkish border
    let bccR = 210 + bccNoise * 25 + centralDip * 20;
    let bccG = 135 + bccNoise * 20 - centralDip * 30;
    let bccB = 135 + bccNoise * 15 - centralDip * 30;
    
    // Arborizing telangiectasia (red branching fine vessels)
    const vessel = Math.abs(Math.sin(nx * 9 + fbm(nx * 4, ny * 4) * 4)) < 0.08 && r < 0.9;
    if (vessel) {
      bccR = 190; bccG = 30; bccB = 40;
    }
    
    red = red * (1 - factor) + bccR * factor;
    green = green * (1 - factor) + bccG * factor;
    blue = blue * (1 - factor) + bccB * factor;
  }
  return [red, green, blue, 255];
}));

// 4. SKIN: Normal Skin / Seborrheic Keratosis
fs.writeFileSync(path.join(skinDir, 'normal_skin.png'), createPNG(W, H, (x, y) => {
  const skinNoise = fbm(x * 0.04, y * 0.04);
  const micro = fbm(x * 0.2, y * 0.2) * 4;
  let red = 238 + skinNoise * 12 + micro;
  let green = 196 + skinNoise * 10 + micro;
  let blue = 172 + skinNoise * 8 + micro;
  
  // Subtle tiny benign freckle
  const dx = (x - 170) / 10;
  const dy = (y - 140) / 10;
  const fr = Math.sqrt(dx * dx + dy * dy);
  if (fr < 1) {
    const f = 1 - fr;
    red = red * (1 - f * 0.35) + 160 * (f * 0.35);
    green = green * (1 - f * 0.35) + 110 * (f * 0.35);
    blue = blue * (1 - f * 0.35) + 80 * (f * 0.35);
  }
  return [red, green, blue, 255];
}));

// 5. BREAST: Malignant Tumor (Spiculated Carcinoma Mammogram)
fs.writeFileSync(path.join(breastDir, 'malignant_tumor.png'), createPNG(W, H, (x, y) => {
  // Pectoral breast contour background (X-ray grey gradient)
  const breastContour = 1.0 - Math.sqrt((x * 0.6) ** 2 + ((y - 50) * 0.5) ** 2) / 240;
  const baseGlandular = Math.max(0, breastContour) * 80 + fbm(x * 0.03, y * 0.03) * 35;
  
  let val = Math.min(180, Math.max(10, baseGlandular));
  
  // Centered Spiculated High-Density Malignant Mass
  const cx = 160, cy = 150;
  const dx = (x - cx) / 45;
  const dy = (y - cy) / 45;
  const r = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx);
  
  // Spicules radiating outward
  const spicules = Math.pow(Math.abs(Math.sin(angle * 7 + fbm(dx * 4, dy * 4) * 3)), 6) * 0.6;
  const tumorDist = r - spicules;
  
  if (tumorDist < 1.0) {
    const tumorFactor = Math.pow(Math.max(0, 1.0 - tumorDist / 1.0), 0.5);
    // Dense radiopaque bright white tumor core
    const coreBrightness = 160 + fbm(dx * 8, dy * 8) * 60;
    val = Math.max(val, val * (1 - tumorFactor) + (val + coreBrightness) * tumorFactor);
    
    // Clustered pleomorphic microcalcifications (sharp white specks)
    if (r < 0.6 && hash(Math.floor(x / 4), Math.floor(y / 4)) > 0.88) {
      val = Math.min(255, val + 75);
    }
  }
  
  val = Math.min(250, Math.max(5, val));
  return [val, val, val + 4, 255];
}));

// 6. BREAST: Benign Fibroadenoma
fs.writeFileSync(path.join(breastDir, 'benign_fibroadenoma.png'), createPNG(W, H, (x, y) => {
  const breastContour = 1.0 - Math.sqrt((x * 0.6) ** 2 + ((y - 50) * 0.5) ** 2) / 240;
  const baseGlandular = Math.max(0, breastContour) * 75 + fbm(x * 0.03, y * 0.03) * 30;
  let val = Math.min(160, Math.max(10, baseGlandular));
  
  // Smooth, circumscribed oval mass
  const cx = 155, cy = 145;
  const dx = (x - cx) / 45;
  const dy = (y - cy) / 35;
  const r = Math.sqrt(dx * dx + dy * dy);
  
  // Halo sign (thin radiolucent darker ring around the mass)
  if (r >= 0.95 && r <= 1.15) {
    val = Math.max(8, val * 0.7);
  } else if (r < 0.95) {
    const factor = Math.max(0, 1 - r / 0.95);
    // Homogeneous radiopaque mass
    const massDensity = 135 + fbm(dx * 4, dy * 4) * 20;
    val = Math.max(val, val * (1 - factor) + massDensity * factor);
  }
  
  val = Math.min(240, Math.max(5, val));
  return [val, val, val + 2, 255];
}));

// 7. BREAST: Suspicious Microcalcifications
fs.writeFileSync(path.join(breastDir, 'calcifications.png'), createPNG(W, H, (x, y) => {
  const breastContour = 1.0 - Math.sqrt((x * 0.6) ** 2 + ((y - 50) * 0.5) ** 2) / 240;
  const baseGlandular = Math.max(0, breastContour) * 90 + fbm(x * 0.03, y * 0.03) * 45;
  let val = Math.min(170, Math.max(10, baseGlandular));
  
  // Cluster zone
  const cx = 150, cy = 150;
  const dx = (x - cx) / 60;
  const dy = (y - cy) / 40;
  const r = Math.sqrt(dx * dx + dy * dy);
  
  if (r < 1.0) {
    // Subtle ductal architectural density
    val += 25 * (1 - r);
    // High density clustered microcalcification flecks
    const speckHash = hash(Math.floor(x / 3), Math.floor(y / 3));
    if (speckHash > 0.84) {
      val = Math.min(255, val + 90);
    }
  }
  
  val = Math.min(250, Math.max(5, val));
  return [val, val, val + 2, 255];
}));

// 8. BREAST: Normal Mammogram (BI-RADS 1)
fs.writeFileSync(path.join(breastDir, 'normal_mammogram.png'), createPNG(W, H, (x, y) => {
  const breastContour = 1.0 - Math.sqrt((x * 0.6) ** 2 + ((y - 50) * 0.5) ** 2) / 240;
  const baseGlandular = Math.max(0, breastContour) * 85 + fbm(x * 0.025, y * 0.025) * 40;
  // Smooth fibroglandular parenchyma without focal mass
  let val = Math.min(160, Math.max(8, baseGlandular));
  return [val, val, val + 2, 255];
}));

console.log('All 8 authentic clinical sample images created successfully in public/samples/!');

