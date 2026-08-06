import {
  VIEW_W,
  VIEW_H,
  ZOOM_MIN,
  ZOOM_MAX,
  ZOOM_DEFAULT,
} from "./constants.js";
import { gridToWorld } from "./grid.js";

/**
 * Caméra = couche SÉPARÉE (décalage + zoom).
 * Le zoom ne doit jamais être intégré à la taille de case.
 */
export function createCamera(options = {}) {
  let offsetX = options.offsetX ?? 0;
  let offsetY = options.offsetY ?? 0;
  let zoom = options.zoom ?? ZOOM_DEFAULT;

  return {
    get offsetX() {
      return offsetX;
    },
    get offsetY() {
      return offsetY;
    },
    get zoom() {
      return zoom;
    },

    setOffset(x, y) {
      offsetX = x;
      offsetY = y;
    },

    pan(dx, dy) {
      offsetX += dx;
      offsetY += dy;
    },

    setZoom(z) {
      zoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z));
    },

    zoomBy(factor, pivotX = VIEW_W / 2, pivotY = VIEW_H / 2) {
      const prev = zoom;
      const next = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom * factor));
      // Garder le pivot écran stable
      const worldX = (pivotX - offsetX) / prev;
      const worldY = (pivotY - offsetY) / prev;
      zoom = next;
      offsetX = pivotX - worldX * zoom;
      offsetY = pivotY - worldY * zoom;
    },

    /** Monde → écran. */
    worldToScreen(wx, wy) {
      return {
        x: offsetX + wx * zoom,
        y: offsetY + wy * zoom,
      };
    },

    /** Écran → monde. */
    screenToWorld(sx, sy) {
      return {
        x: (sx - offsetX) / zoom,
        y: (sy - offsetY) / zoom,
      };
    },

    /** Transform SVG de la couche caméra. */
    transform() {
      return `translate(${offsetX}, ${offsetY}) scale(${zoom})`;
    },

    /**
     * Recadre pour garder attaquant et cible visibles au zoom élevé.
     * actors: [{col,row}, ...]
     */
    frameActors(actors, padding = 48) {
      if (!actors || actors.length === 0) return;
      const pts = actors.map((a) => gridToWorld(a.col, a.row));
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      for (const p of pts) {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
      }
      // Marge pour hauteur perso
      minY -= 100;
      maxY += 20;
      minX -= padding;
      maxX += padding;
      minY -= padding;
      maxY += padding;

      const w = Math.max(1, maxX - minX);
      const h = Math.max(1, maxY - minY);
      const zx = VIEW_W / w;
      const zy = VIEW_H / h;
      zoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.min(zx, zy)));

      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;
      offsetX = VIEW_W / 2 - cx * zoom;
      offsetY = VIEW_H / 2 - cy * zoom;
    },
  };
}
