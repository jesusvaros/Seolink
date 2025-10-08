import { useCallback } from 'react';
import { UMAMI_EVENTS } from '../lib/analytics';

// Extend the Window interface to include umami
declare global {
  interface Window {
    umami?: {
      track: (eventName: string, eventData?: Record<string, any>) => void;
    };
  }
}

export const useUmami = () => {
  const track = useCallback((eventName: string, eventData?: Record<string, any>) => {
    if (typeof window !== 'undefined' && window.umami) {
      window.umami.track(eventName, eventData);
    }
  }, []);

  // Specific tracking functions for affiliate actions
  const trackAffiliateClick = useCallback((productName: string, asin: string, price?: string) => {
    track(UMAMI_EVENTS.AFFILIATE_CLICK, {
      product: productName,
      asin: asin,
      price: price || 'unknown'
    });
  }, [track]);

  const trackProductView = useCallback((productName: string, asin: string) => {
    track(UMAMI_EVENTS.PRODUCT_VIEW, {
      product: productName,
      asin: asin
    });
  }, [track]);

  const trackBuyButtonClick = useCallback((productName: string, asin: string, buttonType: string) => {
    track(UMAMI_EVENTS.BUY_BUTTON_CLICK, {
      product: productName,
      asin: asin,
      button_type: buttonType
    });
  }, [track]);

  const trackTableInteraction = useCallback((action: string, productName?: string) => {
    track(UMAMI_EVENTS.TABLE_INTERACTION, {
      action: action,
      product: productName || 'unknown'
    });
  }, [track]);

  const trackStickyCtaClick = useCallback((productName: string, asin: string) => {
    track(UMAMI_EVENTS.STICKY_CTA_CLICK, {
      product: productName,
      asin: asin
    });
  }, [track]);

  return {
    track,
    trackAffiliateClick,
    trackProductView,
    trackBuyButtonClick,
    trackTableInteraction,
    trackStickyCtaClick
  };
};

export default useUmami;
