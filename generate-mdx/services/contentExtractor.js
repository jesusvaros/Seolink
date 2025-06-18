import { chromium } from 'playwright';
import { JSDOM, VirtualConsole } from 'jsdom';
import { Readability } from '@mozilla/readability';
import TurndownService from 'turndown';
import fetch from 'node-fetch';

const turndown = new TurndownService();

/**
 * Setup a browser instance with optimized settings
 * @returns {Promise<{browser: Browser, page: Page}>} - Browser and page objects
 */
async function setupBrowser(url, timeout = 60000) {
  // Launch with more browser-like settings
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  
  // Create a context with realistic browser settings
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
    hasTouch: false,
    ignoreHTTPSErrors: true,
    javaScriptEnabled: true
  });
  
  const page = await context.newPage();
  
  // Add console logging from the page
  page.on('console', msg => console.log(`🌐 Browser console: ${msg.text()}`));
  
  console.log(`🌐 Navegando a ${url}...`);
  await page.goto(url, { 
    waitUntil: 'networkidle',
    timeout: timeout
  });
  
  return { browser, page };
}

/**
 * Resolve a shortened URL to its final destination
 */
async function resolveShortUrl(shortUrl) {
  try {
    const response = await fetch(shortUrl, { method: 'HEAD', redirect: 'follow' });
    return response.url;
  } catch (error) {
    console.error(`Error resolving shortened URL:`, error.message);
    return shortUrl;
  }
}

/**
 * Extract product IDs from Amazon URLs
 * @param {string} url - Amazon URL
 * @returns {string|null} - Product ID or null if not found
 */
function extractProductId(url) {
  try {
    // Common Amazon product ID patterns
    const patterns = [
      /\/dp\/([A-Z0-9]{10})(?:\/|\?|$)/, // /dp/XXXXXXXXXX
      /\/gp\/product\/([A-Z0-9]{10})(?:\/|\?|$)/, // /gp/product/XXXXXXXXXX
      /\/([A-Z0-9]{10})(?:\/|\?|$)/, // /XXXXXXXXXX directly in path
      /(?:\?|&)ASIN=([A-Z0-9]{10})(?:&|$)/, // ASIN=XXXXXXXXXX in query
      /(?:\?|&)asin=([A-Z0-9]{10})(?:&|$)/, // asin=XXXXXXXXXX in query
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1]; // Return the first captured group (product ID)
      }
    }
    
    return null; // No product ID found
  } catch (error) {
    console.error(`Error extracting product ID from ${url}:`, error.message);
    return null;
  }
}

/**
 * Extract Amazon product links from a page
 */
async function extractProductLinks(page) {
  return await page.evaluate(() => {
    const amazonLinks = Array.from(document.querySelectorAll('a[href*="amazon"]'));
    const chollometroLinks = Array.from(document.querySelectorAll('a[href*="chollometro"]'));
    const amznToLinks = Array.from(document.querySelectorAll('a[href*="amzn.to"]'));

    console.log(`🔍 Enlaces de Amazon encontrados: ${amazonLinks.length}`);
    console.log(`🔍 Enlaces de Amazon acortados encontrados: ${amznToLinks.length}`);  
    
    // Combine all links
    return [...amazonLinks, ...amznToLinks, ...chollometroLinks].map(link => link.href);
  });
}

/**
 * Check if a URL contains Amazon product links
 */
async function containsAmazonLinks(url) {
  console.log(`🔍 Verificando si ${url} contiene productos de Amazon...`);
  let browser = null;
  let page = null;

  try {
    // Setup browser and navigate to URL
    const setup = await setupBrowser(url);
    browser = setup.browser;
    page = setup.page;
    
    // Extract product links
    const links = await extractProductLinks(page);
    
    // Extract unique product IDs from the links
    const productIds = new Set();
    
    // For each link, try to extract a product ID
    for (const link of links) {
      // Skip non-Amazon links
      if (!link.includes('amazon') && !link.includes('amzn.to')) continue;
      
      // For shortened URLs, we need to resolve them first
      if (link.includes('amzn.to')) {
        try {
          const resolvedUrl = await resolveShortUrl(link);
          const productId = extractProductId(resolvedUrl);
          if (productId) productIds.add(productId);
        } catch (error) {
          console.error(`Error resolving shortened URL ${link}:`, error.message);
        }
      } else {
        // Direct Amazon links
        const productId = extractProductId(link);
        if (productId) productIds.add(productId);
      }
    }
    
    await browser.close();
    
    // Check if we have at least 2 unique product IDs
    if (productIds.size >= 2) {
      console.log(`✅ La URL contiene ${links.length} enlaces con ${productIds.size} productos Amazon diferentes.`);
      console.log(`✅ La URL contiene enlaces de Amazon`);
      return true;
    } else if (links.length > 0) {
      console.log(`⚠️ La URL contiene ${links.length} enlaces de Amazon pero solo ${productIds.size} producto(s) único(s).`);
      return false;
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

/**
 * Fetch and clean content from a URL
 */
async function fetchCleanContent(url) {
  console.log(`📄 Extrayendo contenido limpio...`);
  let browser = null;
  let page = null;

  try {
    // Setup browser with longer timeout for content extraction
    const setup = await setupBrowser(url, 90000);
    browser = setup.browser;
    page = setup.page;
    
    // Wait a bit more to ensure JavaScript has executed
    await page.waitForTimeout(2000);
    
    // Wait a bit more to ensure JavaScript has executed
    await page.waitForTimeout(2000);

    // Extract basic page info
    const title = await page.title();
    const html = await page.content();

    // Use Readability to extract the main content
    // Configure JSDOM to ignore CSS errors
    const virtualConsole = new VirtualConsole();
    virtualConsole.on("error", (err) => {
      // Silently ignore CSS parsing errors
      if (err.message && err.message.includes("Could not parse CSS stylesheet")) {
        return;
      }
      console.error("JSDOM Error:", err.message);
    });
    
    const dom = new JSDOM(html, { 
      url,
      // Disable CSS processing to avoid parsing errors
      runScripts: "outside-only",
      resources: "usable",
      virtualConsole
    });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article) {
      throw new Error('No se pudo extraer el contenido principal de la página');
    }

    // Convert HTML to Markdown
    let markdown = turndown.turndown(article.content);
    
    // Clean up the markdown to reduce token usage
    markdown = markdown
      .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines with just two
      .replace(/\[\s*\n+\s*\]/g, '[]') // Clean up empty markdown links
      .replace(/\n+\[\s*\n+/g, '[') // Clean up newlines in markdown links
      .replace(/\n+\]\s*\n+/g, ']') // Clean up newlines in markdown links
      .replace(/\n+\(\s*\n+/g, '(') // Clean up newlines in markdown links
      .replace(/\n+\)\s*\n+/g, ')') // Clean up newlines in markdown links
      .replace(/Publicidad[^\n]*\n[^\n]*debajo/g, '') // Remove advertising markers
      .replace(/\*\*([^*]+)\*\*\n+[-]+/g, '**$1**') // Remove unnecessary separator lines after headers
      .replace(/\n+Crédito:[^\n]+/g, '') // Remove credit lines
      .replace(/\]\n+\(/g, '](') // Fix broken markdown links
      
      // Advanced product listing cleanup
      .replace(/\[!\[([^\]]+)\]\([^)]+\)\s*"([^"]+)"\)\s*\n+\s*\]\([^)]+\)/g, '**$1**') // Convert complex image links to simple product names
      .replace(/\n+[-]+\s*\n+/g, '\n') // Remove horizontal lines
      .replace(/\n+[A-Za-z\s]+\s*[-]+\s*\n+/g, '\n') // Remove title underlines
      .replace(/\*\*([^*]+)\*\*\s*\n+\*\*([^*]+)\*\*\s*/g, '**$1 - $2**\n') // Combine consecutive headers
      .replace(/\n+\*\*/g, '\n**') // Clean up newlines before bold text

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
    const rawProductLinks = await extractProductLinks(page);
    
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

      // Find prices inside anchor tags with various formats
      // Handle formats like "87 € en Amazon" and standard price formats
      const amazonPriceRegex = /([0-9]+(?:[.,][0-9]+)?)\s*[€$]\s+en\s+Amazon/i;
      const standardPriceRegex = /\s*([0-9]+[.,]?[0-9]*)\s*[$€]\s*|\s*[$€]\s*([0-9]+[.,]?[0-9]*)\s*/;
      
      const anchorElements = Array.from(document.querySelectorAll('a'));
      const anchorPrices = anchorElements
        .filter(a => amazonPriceRegex.test(a.textContent) || standardPriceRegex.test(a.textContent))
        .map(a => {
          let priceValue, currencySymbol;
          
          // Try Amazon specific format first
          const amazonMatch = a.textContent.match(amazonPriceRegex);
          if (amazonMatch && amazonMatch[1]) {
            priceValue = amazonMatch[1];
            currencySymbol = '€'; // Default to Euro for Amazon.es
          } else {
            // Fall back to standard price format
            const standardMatch = a.textContent.match(standardPriceRegex);
            priceValue = standardMatch[1] || standardMatch[2]; // Get the captured group with the number
            currencySymbol = a.textContent.includes('$') ? '$' : '€';
          }
          
          // Extract ASIN from href if it's an Amazon link
          let asin = null;
          if (a.href && (a.href.includes('amazon') || a.href.includes('amzn.to'))) {
            const asinMatch = a.href.match(/\/dp\/([A-Z0-9]{10})|\/gp\/product\/([A-Z0-9]{10})/);
            if (asinMatch) {
              asin = asinMatch[1] || asinMatch[2];
            }
          }

          return {
            text: a.textContent.trim(),
            priceValue,
            currency: currencySymbol,
            selector: getSelector(a),
            href: a.href,
            asin,
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
