import { useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { trackPageView, trackScrollDepth, trackTimeOnPage } from '../lib/analytics';

interface UsePageTrackingOptions {
  category?: string;
  trackScroll?: boolean;
  trackTime?: boolean;
}

export const usePageTracking = (options: UsePageTrackingOptions = {}) => {
  const router = useRouter();
  const startTimeRef = useRef<number | undefined>(undefined);
  const scrollDepthsTracked = useRef(new Set<number>());
  
  const {
    category = 'general',
    trackScroll = true,
    trackTime = true
  } = options;

  // Track page view on route change
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      // Reset tracking state for new page
      startTimeRef.current = Date.now();
      scrollDepthsTracked.current.clear();
      
      // Track page view
      trackPageView(url, document.title, category);
    };

    // Track initial page load
    if (router.isReady) {
      handleRouteChange(router.asPath);
    }

    router.events.on('routeChangeComplete', handleRouteChange);
    
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router, category]);

  // Track scroll depth
  useEffect(() => {
    if (!trackScroll) return;

    const handleScroll = () => {
      const scrollPercent = Math.round(
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      );

      // Track at 25%, 50%, 75%, and 100% scroll depths
      const depths = [25, 50, 75, 100];
      
      depths.forEach(depth => {
        if (scrollPercent >= depth && !scrollDepthsTracked.current.has(depth)) {
          scrollDepthsTracked.current.add(depth);
          trackScrollDepth(depth, router.asPath);
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [trackScroll, router.asPath]);

  // Track time on page when leaving
  useEffect(() => {
    if (!trackTime) return;

    const handleBeforeUnload = () => {
      if (startTimeRef.current) {
        const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);
        trackTimeOnPage(timeSpent, router.asPath);
      }
    };

    const handleRouteChangeStart = () => {
      if (startTimeRef.current) {
        const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);
        trackTimeOnPage(timeSpent, router.asPath);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    router.events.on('routeChangeStart', handleRouteChangeStart);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      router.events.off('routeChangeStart', handleRouteChangeStart);
    };
  }, [trackTime, router]);

  return {
    // Expose manual tracking functions if needed
    trackCurrentPage: () => trackPageView(router.asPath, document.title, category),
    trackManualScroll: (depth: number) => trackScrollDepth(depth, router.asPath),
    trackManualTime: (seconds: number) => trackTimeOnPage(seconds, router.asPath)
  };
};
