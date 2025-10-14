import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Cross-Chain Parametric Insurance
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90 max-w-3xl mx-auto">
              Protect your crypto assets with automated, oracle-powered insurance coverage across
              Ethereum and Hedera
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/coverage"
                className="px-8 py-4 bg-white text-blue-600 font-bold rounded-lg hover:bg-gray-100 transition-colors"
              >
                Get Coverage
              </Link>
              <Link
                href="/liquidity"
                className="px-8 py-4 bg-transparent border-2 border-white text-white font-bold rounded-lg hover:bg-white hover:text-blue-600 transition-colors"
              >
                Provide Liquidity
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Why OmniShield?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl border-2 border-gray-200 hover:border-blue-300 transition-colors">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-bold mb-2">Instant Payouts</h3>
              <p className="text-gray-600">
                Automated claim processing powered by Pyth price oracles. No paperwork, no delays.
              </p>
            </div>
            <div className="p-6 rounded-xl border-2 border-gray-200 hover:border-blue-300 transition-colors">
              <div className="text-4xl mb-4">🌐</div>
              <h3 className="text-xl font-bold mb-2">Cross-Chain Coverage</h3>
              <p className="text-gray-600">
                Seamlessly bridge coverage between Ethereum and Hedera using Chainlink CCIP.
              </p>
            </div>
            <div className="p-6 rounded-xl border-2 border-gray-200 hover:border-blue-300 transition-colors">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-bold mb-2">Transparent & Secure</h3>
              <p className="text-gray-600">
                All coverage terms encoded in smart contracts. Fully audited and battle-tested.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">$12.5M</div>
              <div className="text-gray-600">Total Value Locked</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">342</div>
              <div className="text-gray-600">Active Policies</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">$256K</div>
              <div className="text-gray-600">Premiums Collected</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">12.5%</div>
              <div className="text-gray-600">Average APY</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to protect your assets?</h2>
          <p className="text-xl mb-8 opacity-90">
            Get started with parametric insurance coverage in just a few clicks
          </p>
          <Link
            href="/coverage"
            className="inline-block px-8 py-4 bg-white text-blue-600 font-bold rounded-lg hover:bg-gray-100 transition-colors"
          >
            Purchase Coverage Now
          </Link>
        </div>
      </section>
    </div>
  );
}
