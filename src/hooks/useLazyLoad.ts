import { useEffect, useRef, useState } from 'react';

interface UseLazyLoadOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

/**
 * Custom hook for lazy loading images with Intersection Observer
 * Provides better control than native loading="lazy"
 */
export const useLazyLoad = (options: UseLazyLoadOptions = {}) => {
  const {
    threshold = 0.1,
    rootMargin = '50px',
    triggerOnce = true
  } = options;

  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const targetRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    // If already intersected and triggerOnce is true, skip
    if (hasIntersected && triggerOnce) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        
        if (entry.isIntersecting && !hasIntersected) {
          setHasIntersected(true);
        }
      },
      {
        threshold,
        rootMargin
      }
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, triggerOnce, hasIntersected]);

  return {
    ref: targetRef,
    isIntersecting,
    hasIntersected,
    shouldLoad: triggerOnce ? hasIntersected : isIntersecting
  };
};

/**
 * Hook for preloading images in advance
 * Useful for carousel/gallery where next images should be ready
 */
export const useImagePreload = (urls: string[], enabled: boolean = true) => {
  const [loadedUrls, setLoadedUrls] = useState<Set<string>>(new Set());
  const [failedUrls, setFailedUrls] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!enabled || urls.length === 0) return;

    const loadImage = (url: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        
        img.onload = () => {
          setLoadedUrls(prev => new Set([...prev, url]));
          resolve();
        };
        
        img.onerror = () => {
          setFailedUrls(prev => new Set([...prev, url]));
          reject(new Error(`Failed to load: ${url}`));
        };
        
        img.src = url;
      });
    };

    // Load images in parallel
    const loadPromises = urls.map(url => 
      loadImage(url).catch(err => console.warn('Image preload failed:', err))
    );

    Promise.allSettled(loadPromises);

  }, [urls, enabled]);

  return {
    loadedUrls,
    failedUrls,
    isLoaded: (url: string) => loadedUrls.has(url),
    hasFailed: (url: string) => failedUrls.has(url),
    loadingCount: urls.length - loadedUrls.size - failedUrls.size
  };
};

/**
 * Hook for creating low-quality image placeholders (LQIP)
 * Generates a tiny blurred version while full image loads
 */
export const useLQIP = (imageUrl: string) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [lqipUrl, setLqipUrl] = useState<string>('');

  useEffect(() => {
    if (!imageUrl) return;

    // For now, use a data URI for LQIP
    // In production, backend should provide thumbnail URLs
    const generateLQIP = (): string => {
      // Create a 1x1 pixel gray placeholder
      // In real implementation, backend provides 10x10 blurred thumbnail
      return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3Crect fill="%23f1f5f9" width="1" height="1"/%3E%3C/svg%3E';
    };

    setLqipUrl(generateLQIP());

    // Preload full image
    const img = new Image();
    img.onload = () => setIsLoaded(true);
    img.src = imageUrl;

  }, [imageUrl]);

  return {
    lqipUrl,
    fullImageUrl: imageUrl,
    isLoaded,
    currentUrl: isLoaded ? imageUrl : lqipUrl
  };
};
