import { chromium } from 'playwright';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import TurndownService from 'turndown';
import fetch from 'node-fetch';

const turndown = new TurndownService();

async function resolveShortUrl(shortUrl) {
  try {
    const response = await fetch(shortUrl, { method: 'HEAD', redirect: 'follow' });
    return response.url;
  } catch (error) {
    console.error(`❌ Error al resolver URL acortada ${shortUrl}:`, error.message);
    return shortUrl; // Return original URL if resolution fails
  }
}

/**
 * Check if a URL contains Amazon product links
 * @param {string} url - URL to check
 * @returns {boolean} - True if URL contains Amazon products
 */
async function containsAmazonLinks(url) {
  console.log(`🔍 Verificando si ${url} contiene productos de Amazon...`);
  let browser = null;

  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    const links = await page.evaluate(() => {
      const amazonLinks = Array.from(document.querySelectorAll('a[href*="amazon"]'));
      const chollometroLinks = Array.from(document.querySelectorAll('a[href*="chollometro"]'));
      const amznToLinks = Array.from(document.querySelectorAll('a[href*="amzn.to"]'));

      console.log(`🔍 Enlaces de Amazon encontrados: ${amazonLinks.length}`);
      console.log(`🔍 Enlaces de Amazon acortados encontrados: ${amznToLinks.length}`);  
      
      // Combine all links
      return [...amazonLinks, ...amznToLinks, ...chollometroLinks].map(link => link.href);
    });

    await browser.close();

    if (links.length > 0) {
      console.log(`✅ La URL contiene ${links.length} enlaces de productos Amazon (directos o acortados).`);
      return true;
    } else {
      console.log(`❌ La URL no contiene enlaces de Amazon.`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error al verificar enlaces de Amazon:`, error.message);
    if (browser) await browser.close();
    return false;
  }
}

async function fetchCleanContent(url) {
  console.log(`🌐 Extrayendo contenido de ${url}...`);
  let browser = null;

  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });

    // Extract basic page info
    const title = await page.title();
    const html = await page.content();

    // Use Readability to extract the main content
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article) {
      throw new Error('No se pudo extraer el contenido principal de la página');
    }

    // Convert HTML to Markdown
    const markdown = turndown.turndown(article.content);

    // Extract images
    const mainImage = await page.evaluate(() => {
      // Try to find a featured image or the first significant image
      const ogImage = document.querySelector('meta[property="og:image"]');
      if (ogImage && ogImage.content) return ogImage.content;

      const images = Array.from(document.querySelectorAll('img'));
      const significantImages = images.filter(img => {
        const width = parseInt(img.getAttribute('width') || '0');
        const height = parseInt(img.getAttribute('height') || '0');
        return (width > 200 && height > 200) || (img.clientWidth > 200 && img.clientHeight > 200);
      });

      return significantImages.length > 0 ? significantImages[0].src : null;
    });

    // Extract Amazon product links and details (including shortened links)
    const rawProductLinks = await page.evaluate(() => {
      const amazonLinks = Array.from(document.querySelectorAll('a[href*="amazon"]'));
      const amznToLinks = Array.from(document.querySelectorAll('a[href*="amzn.to"]'));
      const chollometroLinks = Array.from(document.querySelectorAll('a[href*="chollometro"]'));
      
      // Combine all links
      return [...amazonLinks, ...amznToLinks, ...chollometroLinks].map(link => link.href);
    });
    
    // Resolve shortened URLs
    const productLinks = [];
    for (const link of rawProductLinks) {
      if (link.includes('amzn.to') || link.includes('tidd.ly')) {
        console.log(`🔗 Resolviendo URL acortada: ${link}`);
        const resolvedUrl = await resolveShortUrl(link);
        console.log(`✅ URL resuelta: ${resolvedUrl}`);
        productLinks.push({
          original: link,
          resolved: resolvedUrl
        });
      } else {
        productLinks.push({
          original: link,
          resolved: link
        });
      }
    }

    // Extract product prices if available
    const productPrices = await page.evaluate(() => {
      // Find prices by class names
      const priceElements = Array.from(document.querySelectorAll('.price, [class*="price"], [class*="Price"]'));
      const classPrices = priceElements.map(el => ({
        text: el.textContent.trim(),
        selector: getSelector(el),
        source: 'class'
      }));

      // Find prices inside anchor tags with $ or € symbols
      const priceRegex = /\s*([0-9]+[.,]?[0-9]*)\s*[$€]\s*|\s*[$€]\s*([0-9]+[.,]?[0-9]*)\s*/;
      const anchorElements = Array.from(document.querySelectorAll('a'));
      const anchorPrices = anchorElements
        .filter(a => priceRegex.test(a.textContent))
        .map(a => {
          const match = a.textContent.match(priceRegex);
          const priceValue = match[1] || match[2]; // Get the captured group with the number
          const currencySymbol = a.textContent.includes('$') ? '$' : '€';

          return {
            text: a.textContent.trim(),
            priceValue,
            currency: currencySymbol,
            selector: getSelector(a),
            href: a.href,
            source: 'anchor'
          };
        });

      // Combine both price sources
      return [...classPrices, ...anchorPrices];

      function getSelector(el) {
        if (el.id) return `#${el.id}`;
        if (el.className) return `.${el.className.split(' ').join('.')}`;
        return el.tagName.toLowerCase();
      }
    });

    await browser.close();

    // Format the date
    const today = new Date();
    const date = today.toISOString().split('T')[0]; // YYYY-MM-DD format

    return {
      title,
      content: markdown,
      excerpt: article.excerpt,
      image: mainImage,
      date,
      productLinks,
      productPrices
    };
  } catch (error) {
    console.error(`❌ Error al extraer contenido:`, error.message);
    if (browser) await browser.close();
    throw error;
  }
}

export {
  containsAmazonLinks,
  fetchCleanContent,
  resolveShortUrl
};
