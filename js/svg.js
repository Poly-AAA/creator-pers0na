const NS = "http://www.w3.org/2000/svg";

export function el(tag, attrs = {}) {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v !== undefined && v !== null) node.setAttribute(k, v);
  }
  return node;
}

export function createPath(d, fill, stroke = "#2a1c15", strokeW = 1.5) {
  return el("path", {
    d,
    fill,
    stroke,
    "stroke-width": strokeW,
    "stroke-linejoin": "round",
  });
}

export function createEllipse(cx, cy, rx, ry, fill, stroke = "#2a1c15", strokeW = 1.5) {
  return el("ellipse", {
    cx,
    cy,
    rx,
    ry,
    fill,
    stroke,
    "stroke-width": strokeW,
  });
}

export function px(v, w) {
  return (v * w).toFixed(2);
}

export function darken(hex, amount = 0.22) {
  const n = hex.replace("#", "");
  const r = Math.max(0, Math.round(parseInt(n.slice(0, 2), 16) * (1 - amount)));
  const g = Math.max(0, Math.round(parseInt(n.slice(2, 4), 16) * (1 - amount)));
  const b = Math.max(0, Math.round(parseInt(n.slice(4, 6), 16) * (1 - amount)));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

export { NS };
