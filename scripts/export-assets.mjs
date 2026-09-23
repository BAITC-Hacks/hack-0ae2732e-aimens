import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "src/assets/svg");
const publicSvg = join(root, "public/assets/svg");
const publicPng = join(root, "public/assets/png");
const names = (await readdir(source)).filter((name) => name.endsWith(".svg")).sort();

await Promise.all([mkdir(publicSvg, { recursive: true }), mkdir(publicPng, { recursive: true })]);

for (const name of names) {
  const svg = await readFile(join(source, name), "utf8");
  const viewBox = svg.match(/viewBox="([\d.\s-]+)"/);
  if (!viewBox) throw new Error(`${name}: an explicit viewBox is required`);
  if (/<image\b|<(?:script|foreignObject)\b|(?:href|src)\s*=\s*["'](?:https?:|data:)/i.test(svg)) {
    throw new Error(`${name}: assets must be self-contained vectors`);
  }

  const [, , width, height] = viewBox[1].trim().split(/\s+/).map(Number);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new Error(`${name}: invalid viewBox dimensions`);
  }

  await writeFile(join(publicSvg, name), svg);
  const pngSource = Buffer.from(svg.replaceAll("currentColor", "#16332f"));
  const stem = name.replace(/\.svg$/, "");

  for (const scale of [1, 2]) {
    await sharp(pngSource, { density: 72 * scale })
      .resize(Math.round(width * scale), Math.round(height * scale))
      .png({ compressionLevel: 9, palette: false })
      .toFile(join(publicPng, `${stem}@${scale}x.png`));
  }
}

await sharp(join(publicPng, "hero-illustration@1x.png"))
  .flatten({ background: "#edf6f1" })
  .png({ compressionLevel: 9 })
  .toFile(join(publicPng, "hero-preview.png"));

console.log(`Exported ${names.length} SVGs, ${names.length * 2} PNGs, and hero-preview.png.`);
