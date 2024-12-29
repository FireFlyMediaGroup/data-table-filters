import { useState, useEffect } from 'react';

interface RateLimitConfig {
  windowMs: number;
  max: number;
}

export function useRateLimit(config: RateLimitConfig) {
  const [requests, setRequests] = useState<number[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setRequests(prevRequests => prevRequests.filter(time => now - time < config.windowMs));
    }, 1000);

    return () => clearInterval(interval);
  }, [config.windowMs]);

  const checkRateLimit = () => {
    const now = Date.now();
    if (requests.length < config.max) {
      setRequests(prevRequests => [...prevRequests, now]);
      return true;
    }
    return false;
  };

  return { checkRateLimit };
}
