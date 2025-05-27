import fs from 'fs';
import { chromium } from 'playwright';

const SEARCH_URL = 'https://www.elle.com/es/search/?q=las+mejores+2025';
const OUTPUT_FILE = 'elle-links-2025.json';

async function scrapeElle() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(SEARCH_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  console.log('🔁 Cargando todos los resultados con click forzado...');
  let clickCount = 0;

  while (true) {
    const verMas = await page.$('button:has-text("Ver más")');
    if (!verMas) break;

    try {
      await page.evaluate((btn) => btn.click(), verMas);
      clickCount++;
      console.log(`🖱 Click forzado en "Ver más" (${clickCount})`);
      await page.waitForTimeout(2500);
    } catch (err) {
      console.warn("⚠️ No se pudo hacer clic, saliendo.");
      break;
    }
  }

  await page.waitForTimeout(1500);

  const links = await page.$$eval('a[href]', (elements) =>
    elements
      .map((el) => el.href)
      .filter((href) =>
        href.startsWith('https://www.elle.com/es/') &&
        !href.includes('?q=') &&
        !href.includes('#') &&
        href.length > 40
      )
  );

  const unique = [...new Set(links)];
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(unique, null, 2));

  console.log(`✅ Guardados ${unique.length} enlaces en ${OUTPUT_FILE}`);
  await browser.close();
}

scrapeElle();
