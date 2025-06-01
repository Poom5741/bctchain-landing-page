"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { ModeToggle } from "@/components/mode-toggle"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/20 backdrop-blur-xl">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-xl font-bold text-white flex items-center gap-3">
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
              href="#bridge"
              className="text-gray-300 hover:text-white text-sm transition-all duration-300 hover:scale-105"
            >
              Bridge
            </Link>
            <Link
              href="#trade"
              className="text-gray-300 hover:text-white text-sm transition-all duration-300 hover:scale-105"
            >
              Trade
            </Link>
            <Link
              href="#docs"
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
          </nav>

          <div className="hidden md:flex items-center space-x-4">
            <ModeToggle />
            <Button className="relative overflow-hidden bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25">
              <span className="relative z-10">Launch App</span>
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-700"></div>
            </Button>
          </div>

          <div className="md:hidden flex items-center space-x-4">
            <ModeToggle />
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-white">
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/10 animate-in slide-in-from-top-2 duration-300">
            <nav className="flex flex-col space-y-4">
              <Link
                href="#bridge"
                className="text-gray-300 hover:text-white transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Bridge
              </Link>
              <Link
                href="#trade"
                className="text-gray-300 hover:text-white transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Trade
              </Link>
              <Link
                href="#docs"
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
              <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white w-full">
                Launch App
              </Button>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
