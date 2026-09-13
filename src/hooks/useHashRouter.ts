import { useState, useEffect, useCallback } from 'react';
import { QueryCategory } from '../types';

export interface RouteInfo {
  view: string;
  category?: QueryCategory;
  queryId?: string;
}

export function parseHash(hash: string): RouteInfo {
  // Strip leading '#', '#/', or '/' and query parameters
  const cleanHash = hash.replace(/^#\/?/, '').trim();
  const [pathPart] = cleanHash.split('?');

  if (!pathPart || pathPart === 'dashboard') {
    return { view: 'dashboard' };
  }

  const parts = pathPart.split('/');
  const segment = parts[0];

  if (segment === 'query' && parts[1]) {
    return { view: 'query', queryId: parts[1] };
  }

  if (segment === 'category' && parts[1]) {
    const rawCat = decodeURIComponent(parts.slice(1).join('/'));
    return { view: 'category', category: rawCat as QueryCategory };
  }

  const knownViews = [
    'dashboard',
    'browse',
    'favorites',
    'recent',
    'playground',
    'tips',
    'standards',
    'checklist',
    'guidelines',
    'boilerplate-sp',
    'sql-compare',
    'json-formatter',
    'knowledge',
    'sql-knowledge',
    'meter-journey',
    'kt',
  ];

  if (knownViews.includes(segment)) {
    return { view: segment };
  }

  return { view: 'dashboard' };
}

export function useHashRouter() {
  const [route, setRoute] = useState<RouteInfo>(() => {
    if (typeof window === 'undefined') return { view: 'dashboard' };
    return parseHash(window.location.hash);
  });

  useEffect(() => {
    // If no hash exists on first visit, normalize to #/dashboard without adding history entry
    if (!window.location.hash || window.location.hash === '#' || window.location.hash === '#/') {
      window.location.replace('#/dashboard');
    }

    const handleHashChange = () => {
      setRoute(parseHash(window.location.hash));
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = useCallback((path: string) => {
    const clean = path.startsWith('/') ? path : `/${path}`;
    window.location.hash = clean;
  }, []);

  const navigateQuery = useCallback((queryId: string) => {
    window.location.hash = `/query/${queryId}`;
  }, []);

  const navigateCategory = useCallback((category: string) => {
    window.location.hash = `/category/${encodeURIComponent(category)}`;
  }, []);

  const navigateView = useCallback((view: string, category?: QueryCategory) => {
    if (view === 'category' && category) {
      window.location.hash = `/category/${encodeURIComponent(category)}`;
    } else if (view === 'dashboard') {
      window.location.hash = `/dashboard`;
    } else {
      window.location.hash = `/${view}`;
    }
  }, []);

  return {
    route,
    navigate,
    navigateQuery,
    navigateCategory,
    navigateView,
  };
}
