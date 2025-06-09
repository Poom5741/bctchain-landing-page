"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
import { WalletButton } from "@/components/wallet-button";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/20 backdrop-blur-xl">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link
            href="/"
            className="text-xl font-bold text-white flex items-center gap-3"
          >
            <div className="relative">
              <img
                src="/images/bctchain-logo.png"
                alt="BCTChain Logo"
                className="w-8 h-8 transition-transform duration-300 hover:scale-110"
              />
            </div>
            BCTChain
          </Link>

          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/trade"
              className="text-gray-300 hover:text-white text-sm transition-all duration-300 hover:scale-105"
            >
              Trade
            </Link>
            <Link
              href="/docs"
              className="text-gray-300 hover:text-white text-sm transition-all duration-300 hover:scale-105"
            >
              Docs
            </Link>
            <Link
              href="https://scan.bctchain.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-300 hover:text-white text-sm transition-all duration-300 hover:scale-105"
            >
              Explorer
            </Link>
            <Link
              href="https://status.bctchain.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-400 hover:text-green-300 text-sm transition-all duration-300 hover:scale-105 flex items-center gap-1"
            >
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              Status
            </Link>
          </nav>

          <div className="hidden md:flex items-center space-x-4">
            <ModeToggle />
            <WalletButton />
          </div>

          <div className="md:hidden flex items-center space-x-4">
            <ModeToggle />
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/10 animate-in slide-in-from-top-2 duration-300">
            <nav className="flex flex-col space-y-4">
              <Link
                href="/trade"
                className="text-gray-300 hover:text-white transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Trade
              </Link>
              <Link
                href="/docs"
                className="text-gray-300 hover:text-white transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Docs
              </Link>
              <Link
                href="https://scan.bctchain.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-white transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Explorer
              </Link>
              <Link
                href="https://status.bctchain.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-400 hover:text-green-300 transition-colors flex items-center gap-2"
                onClick={() => setIsMenuOpen(false)}
              >
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                Network Status
              </Link>
              <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white w-full">
                Launch App
              </Button>
              <div className="pt-4">
                <WalletButton variant="compact" className="w-full" />
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
