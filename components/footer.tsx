import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black/20 backdrop-blur-xl">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="relative">
                <img
                  src="/images/bctchain-logo.png"
                  alt="BCTChain Logo"
                  className="w-10 h-10 transition-transform duration-300 hover:scale-110"
                />
              </div>
              <div className="text-2xl font-bold text-white">BCTChain</div>
            </div>
            <p className="text-gray-400 max-w-md mb-6 leading-relaxed">
              The financial layer for synthetic assets. Securely bridge Bitcoin, mint transparent synthetic assets, and
              unlock global financial markets.
            </p>
            <p className="text-sm text-gray-500">
              Decentralized protocol. Use at your own risk. Built with ❤️ by the community.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Protocol</h3>
            <ul className="space-y-3 text-gray-400">
              <li>
                <Link
                  href="/trade"
                  className="hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block"
                >
                  Trade
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block"
                >
                  Mint
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block"
                >
                  Governance
                </Link>
              </li>
              <li>
                <Link
                  href="/docs"
                  className="hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block"
                >
                  Documentation
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Resources</h3>
            <ul className="space-y-3 text-gray-400">
              <li>
                <Link
                  href="#"
                  className="hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block"
                >
                  Documentation
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block"
                >
                  Security
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block"
                >
                  Terms of Use
                </Link>
              </li>
              <li>
                <Link
                  href="https://scan.bctchain.com"
                  target="_blank"
                  className="hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block"
                >
                  Explorer
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm mb-4 md:mb-0">© 2024 BCTChain Protocol. All rights reserved.</p>
            <p className="text-gray-500 text-sm text-center md:text-right max-w-md">
              Built for transparency, security, and the future of decentralized finance.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
