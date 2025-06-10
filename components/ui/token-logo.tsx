"use client";

import { useState } from "react";
import { TokenInfo } from "@/lib/token-list";

interface TokenLogoProps {
  token?: TokenInfo | null;
  symbol?: string;
  logoURI?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function TokenLogo({
  token,
  symbol,
  logoURI,
  size = "md",
  className = "",
}: TokenLogoProps) {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    sm: "w-5 h-5",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  // Determine the logo URL and symbol to use
  const finalLogoURI = logoURI || token?.logoURI;
  const finalSymbol = symbol || token?.symbol || "?";

  // If no logo URL or image failed to load, show a fallback
  if (!finalLogoURI || imageError) {
    return (
      <div
        className={`${sizeClasses[size]} ${className} bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs border border-white/20`}
      >
        {finalSymbol.slice(0, 2).toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={finalLogoURI}
      alt={`${finalSymbol} logo`}
      className={`${sizeClasses[size]} ${className} rounded-full border border-white/20 object-cover`}
      onError={() => setImageError(true)}
      onLoad={() => setImageError(false)}
    />
  );
}
