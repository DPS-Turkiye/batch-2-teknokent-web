import { create } from "qrcode";

/** A QR code as one SVG path on a `size` × `size` grid of modules. */
export type QrShape = { size: number; path: string };

/**
 * Draws the QR code in the browser from the `qrcode` package's module matrix, so the link never goes to an outside
 * QR service. Error correction M survives a projector's glare and a slightly blurred phone camera.
 */
export function qrShape(text: string): QrShape {
  const { modules } = create(text, { errorCorrectionLevel: "M" });
  const parts: string[] = [];
  for (let row = 0; row < modules.size; row++) {
    for (let column = 0; column < modules.size; column++) {
      if (modules.get(row, column) !== 0)
        parts.push(`M${column} ${row}h1v1h-1z`);
    }
  }
  return { size: modules.size, path: parts.join("") };
}
