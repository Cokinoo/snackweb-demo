"use client";

import { useEffect, useState, useCallback } from "react";

export function usePolling<T>(url: string, interval: number = 2000): T | null {
  const [data, setData] = useState<T | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(url);
      const json = await res.json() as { success: boolean; data: T };
      if (json.success) {
        setData(json.data);
      }
    } catch {
      // silently ignore network errors during polling
    }
  }, [url]);

  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, interval);
    return () => clearInterval(timer);
  }, [fetchData, interval]);

  return data;
}
