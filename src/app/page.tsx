'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const EXAMPLE_SEARCHES = [
  'pawpaw tree',
  'Antonovka rootstock',
  'Liberty apple scionwood',
  'zone 4 edible hedge',
  'elderberry cuttings',
  'disease resistant chestnut',
];

export default function Home() {
  const [query, setQuery] = useState('');
  const [zip, setZip] = useState('');
  const router = useRouter();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    const params = new URLSearchParams({ q: query });
    if (zip) params.set('zip', zip);
    router.push(`/search?${params.toString()}`);
  }

  function handleExampleClick(example: string) {
    setQuery(example);
    const params = new URLSearchParams({ q: example });
    if (zip) params.set('zip', zip);
    router.push(`/search?${params.toString()}`);
  }

  return (
    <div className="min-h-screen bg-stone-950 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="text-emerald-500 text-xl">&#9752;</span>
          <span className="text-stone-200 font-semibold text-lg tracking-tight">PlantFinder</span>
        </div>
        <a href="#" className="text-stone-500 text-sm hover:text-stone-300 transition-colors">
          For Nurseries
        </a>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 -mt-20">
        <div className="w-full max-w-2xl mx-auto text-center">
          {/* Tagline */}
          <h1 className="text-stone-100 text-3xl sm:text-4xl font-light tracking-tight mb-2">
            Find who actually has it.
          </h1>
          <p className="text-stone-500 text-base sm:text-lg mb-10">
            Search edible plants, rootstocks, and scionwood across independent nurseries.
          </p>

          {/* Search form */}
          <form onSubmit={handleSearch} className="w-full">
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by plant, cultivar, or growing conditions..."
                className="w-full bg-stone-900 border border-stone-700 rounded-xl px-5 py-4 text-stone-100 text-lg placeholder-stone-600 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all"
                autoFocus
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Search
              </button>
            </div>

            {/* Zip code input */}
            <div className="mt-3 flex items-center justify-center gap-2">
              <input
                type="text"
                value={zip}
                onChange={(e) => setZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
                placeholder="ZIP code"
                className="bg-stone-900/50 border border-stone-800 rounded-lg px-3 py-1.5 text-stone-300 text-sm placeholder-stone-600 w-28 focus:outline-none focus:border-stone-600 transition-colors text-center"
                maxLength={5}
              />
              <span className="text-stone-600 text-sm">for zone + shipping info</span>
            </div>
          </form>

          {/* Example searches */}
          <div className="mt-8 flex flex-wrap gap-2 justify-center">
            {EXAMPLE_SEARCHES.map((example) => (
              <button
                key={example}
                onClick={() => handleExampleClick(example)}
                className="px-3 py-1.5 bg-stone-900/50 border border-stone-800 rounded-full text-stone-500 text-sm hover:border-stone-600 hover:text-stone-300 transition-all cursor-pointer"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 text-center">
        <p className="text-stone-700 text-xs">
          Availability shown with confidence indicators. Always confirm with the nursery before ordering.
        </p>
      </footer>
    </div>
  );
}
