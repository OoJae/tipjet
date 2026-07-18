import * as THREE from "three";

/**
 * Paints a stylized TipJet banknote onto a 1024x512 canvas and returns it as a
 * CanvasTexture. Both faces of the paper dart (and the folded slips in the jar)
 * sample this — it is what makes the plane read as "a tip", not just paper.
 *
 * Palette (design tokens): paper #F7F5F0, ink #14120E, money-print #0E9F6E,
 * brand violet #7C3AED.
 */

const W = 1024;
const H = 512;
const PAPER = "#F7F5F0";
const INK_RGB = "20, 18, 14";
const MONEY_RGB = "14, 159, 110";
const MONEY = "#0E9F6E";
const VIOLET = "#7C3AED";

export function makeBillTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (ctx) paintBill(ctx);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

function paintBill(ctx: CanvasRenderingContext2D): void {
  // ---- paper ground ----
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);

  // ---- guilloché field: two mirrored sine families across the bill ----
  ctx.lineWidth = 1;
  for (const dir of [1, -1]) {
    for (let k = 0; k < 7; k++) {
      ctx.beginPath();
      const amp = 24 + k * 9;
      const freq = 0.012 + k * 0.0021;
      const phase = k * 1.7 + (dir === -1 ? 0.9 : 0);
      let first = true;
      for (let x = 22; x <= W - 22; x += 4) {
        const y =
          H / 2 +
          dir *
            (Math.sin(x * freq + phase) * amp +
              Math.sin(x * 0.031 + phase * 2.3) * 10);
        if (first) {
          ctx.moveTo(x, y);
          first = false;
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.strokeStyle =
        k % 2 === 0 ? `rgba(${MONEY_RGB}, 0.35)` : `rgba(${INK_RGB}, 0.10)`;
      ctx.stroke();
    }
  }

  // ---- central rosette: wobbled concentric rings ----
  ctx.strokeStyle = `rgba(${MONEY_RGB}, 0.35)`;
  for (let r = 150; r >= 62; r -= 11) {
    ctx.beginPath();
    let first = true;
    for (let a = 0; a <= Math.PI * 2 + 0.06; a += 0.05) {
      const wob = Math.sin(a * 12) * 6;
      const x = W / 2 + Math.cos(a) * (r + wob);
      const y = H / 2 + Math.sin(a) * (r + wob) * 0.82;
      if (first) {
        ctx.moveTo(x, y);
        first = false;
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
  }

  // clear a soft paper disc so the "$" sits on calm ground
  ctx.fillStyle = "rgba(247, 245, 240, 0.88)";
  ctx.beginPath();
  ctx.ellipse(W / 2, H / 2, 86, 72, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = `rgba(${MONEY_RGB}, 0.5)`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(W / 2, H / 2, 86, 72, 0, 0, Math.PI * 2);
  ctx.stroke();

  // ---- the bold "$" ----
  ctx.fillStyle = MONEY;
  ctx.font = "700 150px Georgia, 'Times New Roman', serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("$", W / 2, H / 2 + 8);

  // ---- ornate border frame ----
  ctx.strokeStyle = `rgba(${INK_RGB}, 0.55)`;
  ctx.lineWidth = 3;
  ctx.strokeRect(16.5, 16.5, W - 33, H - 33);
  ctx.strokeStyle = `rgba(${MONEY_RGB}, 0.5)`;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(28.5, 28.5, W - 57, H - 57);
  // engraving ticks along the inner frame, top and bottom
  ctx.strokeStyle = `rgba(${MONEY_RGB}, 0.35)`;
  ctx.lineWidth = 1;
  for (let x = 40; x <= W - 40; x += 16) {
    ctx.beginPath();
    ctx.moveTo(x, 28.5);
    ctx.lineTo(x, 34.5);
    ctx.moveTo(x, H - 28.5);
    ctx.lineTo(x, H - 34.5);
    ctx.stroke();
  }

  // ---- violet corner seals ----
  const seals: [number, number][] = [
    [86, 86],
    [W - 86, 86],
    [86, H - 86],
    [W - 86, H - 86],
  ];
  for (const [sx, sy] of seals) {
    ctx.fillStyle = VIOLET;
    ctx.beginPath();
    ctx.arc(sx, sy, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(247, 245, 240, 0.8)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(sx, sy, 22, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = PAPER;
    ctx.font = "700 30px Georgia, 'Times New Roman', serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("$", sx, sy + 1);
  }

  // ---- lettering ----
  ctx.fillStyle = `rgba(${INK_RGB}, 0.4)`;
  ctx.textBaseline = "middle";
  ctx.font = "700 26px 'Courier New', Courier, monospace";
  ctx.textAlign = "center";
  ctx.fillText("T I P J E T", W / 2, 54);
  ctx.font = "700 18px 'Courier New', Courier, monospace";
  ctx.textAlign = "left";
  ctx.fillText("ONE TIP", 48, H - 52);
  ctx.textAlign = "right";
  ctx.fillText("ONE TIP", W - 48, H - 52);
}
