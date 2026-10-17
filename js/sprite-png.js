import zlib from "node:zlib";

function crc32(bytes) {
  let c = ~0;
  for (let i = 0; i < bytes.length; i++) {
    c ^= bytes[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return (~c) >>> 0;
}

function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 4, "ascii");
  data.copy(out, 8);
  const crc = crc32(out.subarray(4, 8 + data.length));
  out.writeInt32BE(crc > 0x7fffffff ? crc - 0x100000000 : crc, 8 + data.length);
  return out;
}

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

/** Décode un PNG 8 bits RGBA non entrelacé (feuilles fantasy-cc). */
export function decodePNG(buffer) {
  const data = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  if (data[0] !== 137 || data.toString("ascii", 1, 4) !== "PNG") throw new Error("pas un PNG");
  let w = 0;
  let h = 0;
  let color = 0;
  let depth = 0;
  let inter = 0;
  const parts = [];
  let o = 8;
  while (o < data.length) {
    const len = data.readUInt32BE(o);
    const type = data.toString("ascii", o + 4, o + 8);
    const chunk = data.subarray(o + 8, o + 8 + len);
    if (type === "IHDR") {
      w = chunk.readUInt32BE(0);
      h = chunk.readUInt32BE(4);
      depth = chunk[8];
      color = chunk[9];
      inter = chunk[12];
    } else if (type === "IDAT") parts.push(chunk);
    else if (type === "IEND") break;
    o += 12 + len;
  }
  if (depth !== 8 || color !== 6 || inter !== 0) throw new Error("PNG non supporté " + depth + "/" + color);
  const raw = zlib.inflateSync(Buffer.concat(parts));
  const stride = w * 4;
  const rgba = new Uint8Array(w * h * 4);
  let pos = 0;
  let prev = Buffer.alloc(stride);
  for (let y = 0; y < h; y++) {
    const filter = raw[pos++];
    const row = Buffer.from(raw.subarray(pos, pos + stride));
    pos += stride;
    if (filter === 1) {
      for (let x = 0; x < stride; x++) row[x] = (row[x] + (x >= 4 ? row[x - 4] : 0)) & 255;
    } else if (filter === 2) {
      for (let x = 0; x < stride; x++) row[x] = (row[x] + prev[x]) & 255;
    } else if (filter === 3) {
      for (let x = 0; x < stride; x++) {
        const left = x >= 4 ? row[x - 4] : 0;
        row[x] = (row[x] + ((left + prev[x]) >> 1)) & 255;
      }
    } else if (filter === 4) {
      for (let x = 0; x < stride; x++) {
        const a = x >= 4 ? row[x - 4] : 0;
        const b = prev[x];
        const c = x >= 4 ? prev[x - 4] : 0;
        row[x] = (row[x] + paeth(a, b, c)) & 255;
      }
    } else if (filter !== 0) throw new Error("filtre " + filter);
    rgba.set(row, y * stride);
    prev = row;
  }
  return { w, h, rgba };
}

export function encodePNG(rgba, w, h) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  const src = Buffer.from(rgba.buffer, rgba.byteOffset, rgba.byteLength);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    src.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  }
  const idat = zlib.deflateSync(raw);
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}
