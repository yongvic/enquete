/**
 * Génère les visuels promo Sondage (LinkedIn + Story + Social 4:5)
 * Usage: node scripts/generate-promo-visual.mjs
 */
import sharp from "sharp";
import QRCode from "qrcode";
import { mkdir } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const SCREENSHOT =
  process.env.PROMO_SCREENSHOT ||
  "C:/Users/Banen/.cursor/projects/c-Users-Banen-Downloads-ENQUETE/assets/c__Users_Banen_AppData_Roaming_Cursor_User_workspaceStorage_6697ee5e0e85339deeee96251da9f8b5_images_image-ce27db79-fe2b-4dda-97e9-8587df02524a.png";

const LOGO = path.join(root, "public/logo-header.png");
const OUT_DIR = path.join(root, "public/promo");

const OCHRE = "#c9971c";
const OCHRE_DARK = "#a67a12";
const INK = "#1e2a38";
const PAPER = "#f7f5ef";
const SITE_URL = "sondage-me.vercel.app";
const SITE_HREF = "https://sondage-me.vercel.app/fr";

function escapeXml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function backgroundSvg(w, h) {
  return Buffer.from(`
<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${OCHRE}"/>
      <stop offset="55%" stop-color="${OCHRE_DARK}"/>
      <stop offset="100%" stop-color="#8a6410"/>
    </linearGradient>
    <radialGradient id="glow" cx="70%" cy="40%" r="50%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  <rect width="${w}" height="${h}" fill="url(#glow)"/>
  <!-- decorative rings -->
  <circle cx="${Math.round(w * 0.85)}" cy="${Math.round(h * 0.2)}" r="${Math.round(h * 0.35)}" fill="none" stroke="#ffffff" stroke-opacity="0.06" stroke-width="2"/>
  <circle cx="${Math.round(w * 0.12)}" cy="${Math.round(h * 0.85)}" r="${Math.round(h * 0.25)}" fill="none" stroke="#ffffff" stroke-opacity="0.05" stroke-width="2"/>
</svg>`);
}

function headlineSvg(w, h, variant) {
  const big = variant === "story" ? 88 : 72;
  const subSize = variant === "story" ? 22 : 18;
  const yBig = variant === "story" ? h * 0.22 : h * 0.38;
  const ySub = variant === "story" ? h * 0.12 : h * 0.18;

  return Buffer.from(`
<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <text x="${w / 2}" y="${ySub}" text-anchor="middle" fill="#ffffff" fill-opacity="0.92"
    font-family="Georgia, serif" font-size="${subSize}" letter-spacing="3">${escapeXml("Saison mémoires · Collecte de données")}</text>
  <text x="${w / 2}" y="${yBig}" text-anchor="middle" fill="#ffffff" fill-opacity="0.18"
    font-family="Georgia, serif" font-size="${big}" font-weight="700">Simple.</text>
</svg>`);
}

function footerSvg(w, h) {
  const barH = 44;
  return Buffer.from(`
<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <rect y="${h - barH}" width="${w}" height="${barH}" fill="${PAPER}"/>
  <text x="${w / 2}" y="${h - barH / 2 + 6}" text-anchor="middle"
    font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="16" font-weight="600" fill="${INK}">${escapeXml(SITE_URL)}</text>
</svg>`);
}

function laptopFrameSvg(screenW, screenH, bezel = 14) {
  const w = screenW + bezel * 2;
  const h = screenH + bezel * 2 + 18;
  return {
    svg: Buffer.from(`
<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="${w}" height="${h - 10}" rx="12" fill="#2a2a2a"/>
  <rect x="${bezel}" y="${bezel}" width="${screenW}" height="${screenH}" rx="4" fill="#111"/>
  <rect x="${w * 0.35}" y="${h - 10}" width="${w * 0.3}" height="8" rx="4" fill="#3a3a3a"/>
</svg>`),
    w,
    h,
    screenX: bezel,
    screenY: bezel,
  };
}

function phoneFrameSvg(screenW, screenH, bezel = 10) {
  const w = screenW + bezel * 2;
  const h = screenH + bezel * 2 + 8;
  return {
    svg: Buffer.from(`
<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="${w}" height="${h}" rx="28" fill="#1a1a1a"/>
  <rect x="${bezel}" y="${bezel + 6}" width="${screenW}" height="${screenH}" rx="18" fill="#111"/>
  <rect x="${w / 2 - 28}" y="${bezel + 2}" width="56" height="5" rx="3" fill="#333"/>
</svg>`),
    w,
    h,
    screenX: bezel,
    screenY: bezel + 6,
  };
}

function benchSvg(w, h) {
  return Buffer.from(`
<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  ${[0, 1, 2, 3, 4]
    .map(
      (i) =>
        `<rect x="0" y="${i * (h / 5)}" width="${w}" height="${h / 5 - 6}" rx="${h / 10}" fill="#ffffff" fill-opacity="0.14"/>`
    )
    .join("")}
</svg>`);
}

async function prepareScreens(screenshotPath) {
  const meta = await sharp(screenshotPath).metadata();
  const sw = meta.width;
  const sh = meta.height;

  // PC: full screenshot resized for laptop screen
  const laptopScreenW = 520;
  const laptopScreenH = Math.round(laptopScreenW * (sh / sw));
  const laptopShot = await sharp(screenshotPath)
    .resize(laptopScreenW, laptopScreenH, { fit: "cover", position: "top" })
    .png()
    .toBuffer();

  // Mobile: crop left hero column (~42% width)
  const cropW = Math.round(sw * 0.42);
  const phoneScreenW = 200;
  const phoneScreenH = Math.round(phoneScreenW * (sh / cropW));
  const phoneShot = await sharp(screenshotPath)
    .extract({ left: 0, top: 0, width: cropW, height: sh })
    .resize(phoneScreenW, phoneScreenH, { fit: "cover", position: "top" })
    .png()
    .toBuffer();

  return { laptopShot, laptopScreenW, laptopScreenH, phoneShot, phoneScreenW, phoneScreenH };
}

async function buildLinkedIn(screens) {
  const W = 1200;
  const H = 628;

  const laptop = laptopFrameSvg(screens.laptopScreenW, screens.laptopScreenH);
  const phone = phoneFrameSvg(screens.phoneScreenW, screens.phoneScreenH);

  const laptopLeft = Math.round(W * 0.52 - laptop.w / 2);
  const laptopTop = Math.round(H * 0.42 - laptop.h / 2 + 20);
  const phoneLeft = Math.round(W * 0.08);
  const phoneTop = Math.round(H * 0.38 - phone.h / 2 + 30);

  const benchW = laptop.w + 80;
  const benchH = 56;
  const benchLeft = laptopLeft - 40;
  const benchTop = laptopTop + laptop.h - 20;

  const logoW = 180;
  const logo = await sharp(LOGO).resize(logoW).png().toBuffer();
  const logoMeta = await sharp(logo).metadata();

  const laptopScreen = await sharp(laptop.svg)
    .composite([{ input: screens.laptopShot, left: laptop.screenX, top: laptop.screenY }])
    .png()
    .toBuffer();

  const phoneScreen = await sharp(phone.svg)
    .composite([{ input: screens.phoneShot, left: phone.screenX, top: phone.screenY }])
    .png()
    .toBuffer();

  const layers = [
    { input: backgroundSvg(W, H), top: 0, left: 0 },
    { input: headlineSvg(W, H, "linkedin"), top: 0, left: 0 },
    { input: await sharp(benchSvg(benchW, benchH)).png().toBuffer(), top: benchTop, left: benchLeft },
    { input: laptopScreen, top: laptopTop, left: laptopLeft },
    { input: phoneScreen, top: phoneTop, left: phoneLeft },
    { input: logo, top: 28, left: Math.round(W / 2 - logoW / 2) },
    { input: footerSvg(W, H), top: 0, left: 0 },
  ];

  // White logo on ochre - invert logo-header for top (black text) -> use dark panel or logo.png
  const logoDark = await sharp(path.join(root, "public/logo.png"))
    .resize(Math.round(logoW * 0.55))
    .png()
    .toBuffer();
  layers[5] = { input: logoDark, top: 32, left: Math.round(W / 2 - logoW * 0.55 / 2) };

  // Feature pills — right side, clear of phone mockup
  const pills = Buffer.from(`
<svg width="240" height="100" xmlns="http://www.w3.org/2000/svg">
  <text x="0" y="22" fill="#ffffff" fill-opacity="0.95" font-family="Georgia, serif" font-size="14" font-weight="700">Enquêtes académiques</text>
  <text x="0" y="48" fill="#ffffff" fill-opacity="0.88" font-family="sans-serif" font-size="12">Répondants sans compte</text>
  <text x="0" y="72" fill="#ffffff" fill-opacity="0.88" font-family="sans-serif" font-size="12">Excel · PDF · Rapport IA</text>
</svg>`);
  layers.splice(2, 0, { input: pills, top: Math.round(H * 0.52), left: Math.round(W * 0.72) });

  await sharp({ create: { width: W, height: H, channels: 4, background: OCHRE } })
    .composite(layers)
    .png()
    .toFile(path.join(OUT_DIR, "promo-linkedin.png"));

  console.log("✓ public/promo/promo-linkedin.png (1200×628)");
}

async function buildStory(screens) {
  const W = 1080;
  const H = 1920;

  const laptop = laptopFrameSvg(Math.round(screens.laptopScreenW * 0.95), Math.round(screens.laptopScreenH * 0.95));
  const phone = phoneFrameSvg(screens.phoneScreenW, screens.phoneScreenH);

  const laptopLeft = Math.round(W / 2 - laptop.w / 2);
  const laptopTop = Math.round(H * 0.48);
  const phoneLeft = Math.round(W * 0.08);
  const phoneTop = Math.round(H * 0.42);

  const logoDark = await sharp(path.join(root, "public/logo.png"))
    .resize(200)
    .png()
    .toBuffer();

  const laptopScreen = await sharp(laptop.svg)
    .composite([
      {
        input: await sharp(screens.laptopShot)
          .resize(Math.round(screens.laptopScreenW * 0.95), Math.round(screens.laptopScreenH * 0.95))
          .png()
          .toBuffer(),
        left: laptop.screenX,
        top: laptop.screenY,
      },
    ])
    .png()
    .toBuffer();

  const phoneScreen = await sharp(phone.svg)
    .composite([{ input: screens.phoneShot, left: phone.screenX, top: phone.screenY }])
    .png()
    .toBuffer();

  const cta = Buffer.from(`
<svg width="${W}" height="200" xmlns="http://www.w3.org/2000/svg">
  <text x="${W / 2}" y="40" text-anchor="middle" fill="#ffffff" font-family="Georgia, serif" font-size="28" font-weight="700">Vos sondages. Vos résultats.</text>
  <text x="${W / 2}" y="75" text-anchor="middle" fill="#ffffff" fill-opacity="0.9" font-family="sans-serif" font-size="18">Sans complication — mémoires &amp; thèses</text>
  <rect x="${W / 2 - 160}" y="100" width="320" height="52" rx="26" fill="${INK}"/>
  <text x="${W / 2}" y="133" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="17" font-weight="600">Commencer gratuitement</text>
</svg>`);

  await sharp({ create: { width: W, height: H, channels: 4, background: OCHRE } })
    .composite([
      { input: backgroundSvg(W, H), top: 0, left: 0 },
      { input: headlineSvg(W, H, "story"), top: 0, left: 0 },
      { input: logoDark, top: 100, left: Math.round(W / 2 - 100) },
      { input: phoneScreen, top: phoneTop, left: phoneLeft },
      { input: laptopScreen, top: laptopTop, left: laptopLeft },
      { input: cta, top: H - 280, left: 0 },
      { input: footerSvg(W, H), top: 0, left: 0 },
    ])
    .png()
    .toFile(path.join(OUT_DIR, "promo-story.png"));

  console.log("✓ public/promo/promo-story.png (1080×1920)");
}

async function buildSocialPost() {
  const W = 1080;
  const H = 1350;

  const logoDark = await sharp(path.join(root, "public/logo.png")).resize(220).png().toBuffer();

  const qrRaw = await QRCode.toBuffer(SITE_HREF, {
    type: "png",
    width: 340,
    margin: 1,
    color: { dark: INK, light: "#ffffff" },
  });

  const qrPad = 28;
  const qrBox = 340 + qrPad * 2;
  const qrLabelH = 40;
  const qrLabel = Buffer.from(`
<svg width="${qrBox}" height="${qrLabelH}" xmlns="http://www.w3.org/2000/svg">
  <text x="${qrBox / 2}" y="28" text-anchor="middle" font-family="sans-serif" font-size="15" font-weight="600" fill="${INK}">Scannez · c'est gratuit</text>
</svg>`);

  const qrFinal = await sharp({
    create: { width: qrBox, height: qrBox + qrLabelH, channels: 4, background: "#ffffff" },
  })
    .composite([
      { input: qrRaw, top: qrPad, left: qrPad },
      { input: qrLabel, top: qrBox, left: 0 },
    ])
    .png()
    .toBuffer();

  const qrCardH = qrBox + qrLabelH;

  const copy = Buffer.from(`
<svg width="${W}" height="520" xmlns="http://www.w3.org/2000/svg">
  <text x="${W / 2}" y="48" text-anchor="middle" fill="#ffffff" fill-opacity="0.9"
    font-family="sans-serif" font-size="14" letter-spacing="5" font-weight="600">SAISON MÉMOIRES</text>
  <text x="${W / 2}" y="130" text-anchor="middle" fill="#ffffff"
    font-family="Georgia, serif" font-size="52" font-weight="700">Collectez vos</text>
  <text x="${W / 2}" y="195" text-anchor="middle" fill="#ffffff"
    font-family="Georgia, serif" font-size="52" font-weight="700">données.</text>
  <text x="${W / 2}" y="268" text-anchor="middle" fill="#ffffff" fill-opacity="0.95"
    font-family="Georgia, serif" font-size="44" font-style="italic">Simplement.</text>
  <line x1="${W / 2 - 80}" y1="310" x2="${W / 2 + 80}" y2="310" stroke="#ffffff" stroke-opacity="0.35" stroke-width="1"/>
  <text x="${W / 2}" y="360" text-anchor="middle" fill="#ffffff" fill-opacity="0.88"
    font-family="sans-serif" font-size="20">Créez · Partagez · Analysez</text>
  <text x="${W / 2}" y="400" text-anchor="middle" fill="#ffffff" fill-opacity="0.72"
    font-family="sans-serif" font-size="16">Vos répondants n'ont pas besoin de compte</text>
</svg>`);

  const footer = Buffer.from(`
<svg width="${W}" height="56" xmlns="http://www.w3.org/2000/svg">
  <text x="${W / 2}" y="36" text-anchor="middle"
    font-family="sans-serif" font-size="18" font-weight="600" fill="#ffffff" fill-opacity="0.95">${escapeXml(SITE_URL)}</text>
</svg>`);

  // subtle screenshot strip at bottom behind content
  let screenshotStrip = null;
  try {
    screenshotStrip = await sharp(SCREENSHOT)
      .resize(W, 420, { fit: "cover", position: "top" })
      .modulate({ brightness: 0.75 })
      .png()
      .toBuffer();
  } catch {
    /* optional */
  }

  const layers = [{ input: backgroundSvg(W, H), top: 0, left: 0 }];

  if (screenshotStrip) {
    layers.push({
      input: await sharp(screenshotStrip)
        .composite([
          {
            input: Buffer.from(
              `<svg width="${W}" height="420"><rect width="${W}" height="420" fill="${OCHRE}" fill-opacity="0.72"/></svg>`
            ),
            top: 0,
            left: 0,
          },
        ])
        .png()
        .toBuffer(),
      top: H - 420,
      left: 0,
    });
  }

  layers.push(
    { input: logoDark, top: 72, left: Math.round(W / 2 - 110) },
    { input: copy, top: 200, left: 0 },
    { input: qrFinal, top: 720, left: Math.round(W / 2 - qrBox / 2) },
    { input: footer, top: H - 88, left: 0 }
  );

  await sharp({ create: { width: W, height: H, channels: 4, background: OCHRE } })
    .composite(layers)
    .png()
    .toFile(path.join(OUT_DIR, "promo-social-1080x1350.png"));

  console.log("✓ public/promo/promo-social-1080x1350.png (1080×1350)");
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const screens = await prepareScreens(SCREENSHOT);
  await buildLinkedIn(screens);
  await buildStory(screens);
  await buildSocialPost();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
