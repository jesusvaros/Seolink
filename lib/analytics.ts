// Analytics configuration and utility functions
export const UMAMI_CONFIG = {
  websiteId: '9b734560-f9b3-42bb-a754-99ffdb0f6159',
  scriptUrl: 'https://cloud.umami.is/script.js'
};

// Event names for consistent tracking
export const UMAMI_EVENTS = {
  // Affiliate actions
  AFFILIATE_CLICK: 'affiliate-click',
  PRODUCT_VIEW: 'product-view',
  BUY_BUTTON_CLICK: 'buy-button-click',
  STICKY_CTA_CLICK: 'sticky-cta-click',
  
  // Table interactions
  TABLE_INTERACTION: 'table-interaction',
  PRODUCT_NAME_CLICK: 'product-name-click',
  TABLE_BUY_BUTTON: 'table-buy-button',
  MOBILE_BUY_BUTTON: 'mobile-buy-button',
  
  // Page interactions
  PAGE_VIEW: 'page-view',
  SCROLL_DEPTH: 'scroll-depth',
  TIME_ON_PAGE: 'time-on-page',
  
  // Content interactions
  ARTICLE_READ: 'article-read',
  SECTION_VIEW: 'section-view',
  PROS_CONS_VIEW: 'pros-cons-view',
  SPECIFICATIONS_VIEW: 'specifications-view'
} as const;

// Helper function to track page views with additional context
export const trackPageView = (pagePath: string, pageTitle: string, category?: string) => {
  if (typeof window !== 'undefined' && window.umami) {
    window.umami.track(UMAMI_EVENTS.PAGE_VIEW, {
      path: pagePath,
      title: pageTitle,
      category: category || 'general'
    });
  }
};

// Helper function to track scroll depth
export const trackScrollDepth = (depth: number, pagePath: string) => {
  if (typeof window !== 'undefined' && window.umami) {
    window.umami.track(UMAMI_EVENTS.SCROLL_DEPTH, {
      depth: depth,
      path: pagePath
    });
  }
};

// Helper function to track time spent on page
export const trackTimeOnPage = (timeInSeconds: number, pagePath: string) => {
  if (typeof window !== 'undefined' && window.umami) {
    window.umami.track(UMAMI_EVENTS.TIME_ON_PAGE, {
      time: timeInSeconds,
      path: pagePath
    });
  }
};
