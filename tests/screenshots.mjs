/** Captures d'écran des pages principales (CI) : BASE=http://localhost:3000 OUT=dossier node tests/screenshots.mjs */
import { chromium } from "playwright";
import fs from "node:fs";
const BASE = process.env.BASE ?? "http://localhost:3000";
const OUT = process.env.OUT ?? "captures";
fs.mkdirSync(OUT, { recursive: true });
const pages = ["/", "/cabinet", "/kinesitherapeute", "/soins", "/soins-non-conventionnes", "/mon-bilan-prevention", "/teleconsultation", "/rendez-vous", "/contact", "/faq", "/admin/connexion"];
const browser = await chromium.launch();
for (const [label, vp] of [["desktop", { width: 1440, height: 900 }], ["mobile", { width: 390, height: 844 }]]) {
  const page = await browser.newPage({ viewport: vp, deviceScaleFactor: 1 });
  for (const p of pages) {
    await page.goto(BASE + p, { waitUntil: "networkidle" });
    await page.waitForTimeout(400);
    const name = (p === "/" ? "accueil" : p.slice(1).replace(/\//g, "-")) + `-${label}.jpg`;
    await page.screenshot({ path: `${OUT}/${name}`, fullPage: label === "desktop", type: "jpeg", quality: 70 });
  }
  if (label === "desktop") {
    await page.goto(BASE + "/admin/connexion", { waitUntil: "networkidle" });
    await page.fill("#admin-password", process.env.ADMIN_PASSWORD);
    await page.getByRole("button", { name: "Se connecter" }).click();
    await page.waitForURL(BASE + "/admin");
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${OUT}/admin-desktop.jpg`, fullPage: true, type: "jpeg", quality: 70 });
  }
  await page.close();
}
await browser.close();
console.log("captures OK");
