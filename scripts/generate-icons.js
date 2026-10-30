import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function crc32(buf) {
  let table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(8 + len + 4);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const c = crc32(typeAndData);
  chunk.writeUInt32BE(c, 8 + len);
  return chunk;
}

function createPng(size) {
  const width = size;
  const height = size;
  const rowBytes = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowBytes);

  const cx = size / 2;
  const cy = size / 2;
  const outerR = size * 0.44;
  const innerR = size * 0.32;
  const centerR = size * 0.16;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowBytes;
    rawData[rowOffset] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Check ring or center dot
      const inRing = (dist <= outerR && dist >= innerR);
      const inCenter = (dist <= centerR);

      if (inRing) {
        // Gradient from indigo (99, 102, 241) to emerald (16, 185, 129)
        const t = (Math.atan2(dy, dx) + Math.PI) / (2 * Math.PI);
        const r = Math.round(99 * (1 - t) + 16 * t);
        const g = Math.round(102 * (1 - t) + 185 * t);
        const b = Math.round(241 * (1 - t) + 129 * t);
        rawData[pxOffset] = r;
        rawData[pxOffset + 1] = g;
        rawData[pxOffset + 2] = b;
        rawData[pxOffset + 3] = 255;
      } else if (inCenter) {
        // Center accent
        rawData[pxOffset] = 99;
        rawData[pxOffset + 1] = 102;
        rawData[pxOffset + 2] = 241;
        rawData[pxOffset + 3] = 255;
      } else {
        // Subtle dark background for icon or transparent
        // Let's make background rounded square with dark slate #111827
        const cornerR = size * 0.22;
        const inBox = (
          x >= cornerR && x <= width - cornerR && y >= 0 && y <= height ||
          y >= cornerR && y <= height - cornerR && x >= 0 && x <= width ||
          Math.hypot(x - cornerR, y - cornerR) <= cornerR ||
          Math.hypot(x - (width - cornerR), y - cornerR) <= cornerR ||
          Math.hypot(x - cornerR, y - (height - cornerR)) <= cornerR ||
          Math.hypot(x - (width - cornerR), y - (height - cornerR)) <= cornerR
        );

        if (inBox) {
          rawData[pxOffset] = 17;
          rawData[pxOffset + 1] = 24;
          rawData[pxOffset + 2] = 39;
          rawData[pxOffset + 3] = 255;
        } else {
          rawData[pxOffset] = 0;
          rawData[pxOffset + 1] = 0;
          rawData[pxOffset + 2] = 0;
          rawData[pxOffset + 3] = 0;
        }
      }
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8-bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const outDir = path.resolve('public/icons');
fs.mkdirSync(outDir, { recursive: true });

[16, 32, 48, 128].forEach(size => {
  const png = createPng(size);
  fs.writeFileSync(path.join(outDir, `icon${size}.png`), png);
  console.log(`Generated icon${size}.png (${size}x${size})`);
});
