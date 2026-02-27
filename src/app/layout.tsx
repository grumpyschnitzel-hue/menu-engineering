import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Menu Engineering & Pricing Optimizer | The Grumpy Chef',
  description: 'Classify your menu items into Stars, Plowhorses, Puzzles, and Dogs. Find which dishes make money, which drain it, and what to reprice. Built from 20 years of Master Chef kitchen operations.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-gold focus:text-navy focus:rounded-lg focus:font-bold focus:text-sm"
        >
          Skip to main content
        </a>
        <Header />
        <main id="main-content" className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  )
}

function Header() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-navy/95 backdrop-blur-sm border-b border-navy-border">
      <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-between h-16">
        <a href="/" className="font-display text-lg font-bold tracking-wider uppercase text-white">
          The Grumpy <span className="text-gold">Chef</span>
        </a>
        <div className="flex items-center gap-6">
          <span className="hidden sm:block text-xs text-steel uppercase tracking-wider font-mono">
            Menu Engineering Tool
          </span>
          <a
            href="https://thegrumpychef.com"
            className="text-sm text-gold hover:text-white transition-colors font-medium"
          >
            Back to Site &rarr;
          </a>
        </div>
      </div>
    </nav>
  )
}

function Footer() {
  return (
    <footer className="bg-navy-light border-t border-navy-border py-10 px-6 no-print">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
          <div className="max-w-md">
            <div className="font-display text-lg font-bold uppercase mb-2">
              The Grumpy <span className="text-gold">Chef</span>
            </div>
            <p className="text-sm text-steel leading-relaxed">
              Built from 20 years of Master Chef kitchen operations across 5 countries.
              Not a consultant. An operator who learned the hard way.
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gold font-semibold mb-2">
              Want the full profit recovery?
            </p>
            <a
              href="https://thegrumpychef.com/calculator.html"
              className="btn-gold text-xs"
            >
              Book a 72-Hour Profit Discovery &rarr;
            </a>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-navy-border flex justify-between items-center text-xs text-steel">
          <p>Christian Schiffner | The Grumpy Chef | German Master Chef</p>
          <p>Dawson City, Yukon</p>
        </div>
      </div>
    </footer>
  )
}
