// First, create a new cache service
export const cache = new Map();
export const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const fetchWithCache = async (url: string, options: RequestInit = {}) => {
  if (cache.has(url)) {
    const { data, timestamp } = cache.get(url);
    if (Date.now() - timestamp < CACHE_TTL) {
      return data;
    }
  }
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'X-Api-Key': process.env.NEXT_PUBLIC_NEETOL_API_KEY || '',
      ...options.headers,
    }
  });
  
  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    throw new Error(`API error: ${response.status}`);
  }
  
  const data = await response.json();
  cache.set(url, { data, timestamp: Date.now() });
  return data;
}; 