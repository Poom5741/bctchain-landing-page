"use client";

import { useState, useEffect } from "react";
import { TokenListService } from "@/lib/token-list";

export function useTokenLogos() {
  const [logoMap, setLogoMap] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadLogos = async () => {
      try {
        setIsLoading(true);
        const map = await TokenListService.getTokenLogoMap();
        setLogoMap(map);
      } catch (error) {
        console.error("Failed to load token logos:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLogos();
  }, []);

  const getTokenLogo = (symbolOrAddress: string): string | null => {
    return (
      logoMap[symbolOrAddress] || logoMap[symbolOrAddress.toLowerCase()] || null
    );
  };

  return {
    logoMap,
    getTokenLogo,
    isLoading,
  };
}
