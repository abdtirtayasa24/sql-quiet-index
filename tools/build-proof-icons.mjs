import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';

// Original records-ledger glyph. No downloaded art, font or graphics dependency.
function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++)
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const label = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([label, data])));
  return Buffer.concat([length, label, data, crc]);
}
mkdirSync('public/icons', { recursive: true });
for (const size of [192, 512]) {
  const rows = Buffer.alloc(size * (1 + size * 3));
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const u = x / size,
        v = y / size;
      const paper = u > 0.24 && u < 0.76 && v > 0.18 && v < 0.82;
      const line =
        paper &&
        u > 0.33 &&
        u < 0.67 &&
        [0.34, 0.47, 0.6].some((at) => v > at && v < at + 0.035);
      const color = line
        ? [28, 94, 89]
        : paper
          ? [241, 237, 221]
          : [25, 32, 40];
      const offset = y * (1 + size * 3) + 1 + x * 3;
      rows.set(color, offset);
    }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 2;
  writeFileSync(
    `public/icons/proof-${size}.png`,
    Buffer.concat([
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      chunk('IHDR', header),
      chunk('IDAT', deflateSync(rows)),
      chunk('IEND', Buffer.alloc(0)),
    ]),
  );
}
console.log('Original local 192/512px proof install icons generated.');
