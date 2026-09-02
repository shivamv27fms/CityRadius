import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cafes = JSON.parse(await readFile(path.join(projectRoot, "src/data/cafes.json"), "utf8"));
const extraPlacesSource = await readFile(path.join(projectRoot, "src/data/extraPlaces.ts"), "utf8");
const extraSlugs = [...extraPlacesSource.matchAll(/\bslug:\s*"([^"]+)"/g)].map((match) => match[1]);
const placeSlugs = [...cafes.map((place) => place.slug), ...extraSlugs].sort();
const siteUrl = "https://www.cityradius.in";
const routes = ["/", "/explore", "/about", "/privacy", "/submit", ...placeSlugs.map((slug) => `/places/${slug}`)];
const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...routes.map((route) => `  <url><loc>${siteUrl}${route}</loc></url>`),
  "</urlset>",
  "",
].join("\n");

await writeFile(path.join(projectRoot, "public/sitemap.xml"), xml, "utf8");
console.log(`Generated sitemap with ${routes.length} indexable URLs.`);
