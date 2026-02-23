'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

// Dynamically import map to avoid SSR issues with Leaflet
const SearchMap = dynamic(() => import('@/components/SearchMap'), { ssr: false });

interface SearchResult {
  listing_id: number;
  listing_type: string;
  rank_score: number;
  plant: any;
  cultivar: any;
  rootstock: any;
  supplier: any;
  listing: any;
  availability: any;
  confidence: any;
  match_reasons: { tag: string; label: string }[];
}

interface MapPin {
  supplier_id: number;
  name: string;
  slug: string;
  lat: number;
  lng: number;
  city: string;
  state: string;
  listing_count: number;
  best_status: string;
  pin_color: string;
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [zip, setZip] = useState(searchParams.get('zip') || '');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [pins, setPins] = useState<MapPin[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const doSearch = useCallback(async (q: string, z: string) => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ q });
      if (z) params.set('zip', z);
      const res = await fetch(`/api/search?${params}`);
      const data = await res.json();
      setResults(data.results || []);
      setPins(data.map_pins || []);
      setMeta(data.meta || null);
    } catch (e) {
      console.error('Search failed:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const q = searchParams.get('q') || '';
    const z = searchParams.get('zip') || '';
    setQuery(q);
    setZip(z);
    doSearch(q, z);
  }, [searchParams, doSearch]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams({ q: query });
    if (zip) params.set('zip', zip);
    router.push(`/search?${params.toString()}`);
  }

  const filteredResults = activeFilter
    ? results.filter(r => {
        if (activeFilter === 'in_stock') return r.availability.status === 'in_stock' || r.availability.status === 'limited';
        if (activeFilter === 'scionwood') return r.listing_type === 'scionwood';
        if (activeFilter === 'rootstock') return r.listing_type === 'rootstock';
        if (activeFilter === 'ships_now') return r.availability.ships_now;
        return true;
      })
    : results;

  return (
    <div className="min-h-screen bg-stone-950 flex flex-col">
      {/* Search header */}
      <header className="border-b border-stone-800 px-4 py-3">
        <div className="max-w-screen-2xl mx-auto flex items-center gap-3">
          <a href="/" className="flex items-center gap-1.5 shrink-0">
            <span className="text-emerald-500 text-lg">&#9752;</span>
            <span className="text-stone-300 font-semibold text-sm">PlantFinder</span>
          </a>

          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-stone-900 border border-stone-700 rounded-lg px-4 py-2 text-stone-100 text-sm placeholder-stone-600 focus:outline-none focus:border-emerald-600 transition-colors"
              placeholder="Search plants, rootstocks, scionwood..."
            />
            <input
              type="text"
              value={zip}
              onChange={(e) => setZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
              placeholder="ZIP"
              className="w-20 bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-stone-300 text-sm placeholder-stone-600 focus:outline-none focus:border-stone-600 transition-colors text-center"
              maxLength={5}
            />
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shrink-0"
            >
              Search
            </button>
          </form>
        </div>

        {/* Location chip + filters */}
        <div className="max-w-screen-2xl mx-auto mt-2 flex items-center gap-2 flex-wrap">
          {meta?.user_location && (
            <span className="inline-flex items-center gap-1 bg-stone-800 text-stone-400 text-xs px-2.5 py-1 rounded-full">
              <span className="text-emerald-500">&#9679;</span>
              Zone {meta.user_location.zone} &middot; {meta.user_location.city}, {meta.user_location.state}
            </span>
          )}

          <span className="text-stone-600 text-xs">
            {meta ? `${meta.total_results} results from ${meta.total_suppliers} nurseries` : ''}
          </span>

          <div className="ml-auto flex gap-1.5">
            {[
              { key: null, label: 'All' },
              { key: 'in_stock', label: 'In Stock' },
              { key: 'scionwood', label: 'Scionwood' },
              { key: 'rootstock', label: 'Rootstock' },
              { key: 'ships_now', label: 'Ships Now' },
            ].map(f => (
              <button
                key={f.key || 'all'}
                onClick={() => setActiveFilter(f.key)}
                className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
                  activeFilter === f.key
                    ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-600/30'
                    : 'bg-stone-900 text-stone-500 border border-stone-800 hover:border-stone-600'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main content: Map + Results */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Map */}
        <div className="lg:w-[55%] h-[300px] lg:h-auto bg-stone-900 relative">
          {pins.length > 0 ? (
            <SearchMap pins={pins} userLat={meta?.user_location?.lat} userLng={meta?.user_location?.lng} />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-stone-600 text-sm">
              {loading ? 'Searching...' : 'No results to map'}
            </div>
          )}
        </div>

        {/* Results cards */}
        <div className="lg:w-[45%] overflow-y-auto border-l border-stone-800">
          {loading ? (
            <div className="p-8 text-center text-stone-500">Searching nurseries...</div>
          ) : filteredResults.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-stone-400 mb-2">No results found</p>
              <p className="text-stone-600 text-sm">Try broadening your search or removing filters.</p>
            </div>
          ) : (
            <div className="divide-y divide-stone-800/50">
              {filteredResults.map((r) => (
                <ResultCard key={r.listing_id} result={r} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ResultCard({ result: r }: { result: SearchResult }) {
  const statusColors: Record<string, string> = {
    in_stock: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    limited: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    preorder: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    seasonal: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    out_of_stock: 'bg-stone-500/10 text-stone-400 border-stone-500/20',
    unknown: 'bg-stone-500/10 text-stone-500 border-stone-500/20',
  };

  const statusLabels: Record<string, string> = {
    in_stock: 'In Stock',
    limited: 'Limited',
    preorder: 'Preorder',
    seasonal: 'Seasonal',
    out_of_stock: 'Out of Stock',
    unknown: 'Unknown',
  };

  const confidenceColors: Record<string, string> = {
    high: 'bg-emerald-500',
    medium: 'bg-amber-500',
    low: 'bg-stone-500',
  };

  const typeLabels: Record<string, string> = {
    plant: 'Plant',
    cultivar_plant: 'Plant',
    rootstock: 'Rootstock',
    scionwood: 'Scionwood',
    cutting: 'Cutting',
    seed: 'Seed',
    liner: 'Liner',
  };

  return (
    <div className="p-4 hover:bg-stone-900/50 transition-colors cursor-pointer">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3 className="text-stone-100 font-medium text-sm truncate">
            {r.listing.normalized_title}
          </h3>

          {/* Supplier + location */}
          <p className="text-stone-500 text-xs mt-0.5">
            {r.supplier.name} &middot; {r.supplier.city}, {r.supplier.state}
          </p>

          {/* Details row */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {/* Status badge */}
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${statusColors[r.availability.status] || statusColors.unknown}`}>
              {statusLabels[r.availability.status] || r.availability.status}
            </span>

            {/* Type badge */}
            <span className="text-stone-600 text-xs bg-stone-800 px-2 py-0.5 rounded-full">
              {typeLabels[r.listing_type] || r.listing_type}
            </span>

            {/* Size */}
            {r.listing.size_raw && (
              <span className="text-stone-500 text-xs">{r.listing.size_raw}</span>
            )}

            {/* Season */}
            {r.availability.seasonal_window && (
              <span className="text-stone-500 text-xs">
                Ships {r.availability.seasonal_window.start}
              </span>
            )}
          </div>

          {/* Match reasons */}
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {r.match_reasons.slice(0, 4).map((reason, i) => (
              <span key={i} className="text-stone-600 text-[10px] bg-stone-900 px-1.5 py-0.5 rounded">
                {reason.label}
              </span>
            ))}
          </div>
        </div>

        {/* Right side: price + confidence */}
        <div className="text-right shrink-0">
          {r.listing.price_amount && (
            <p className="text-stone-200 font-medium text-sm">
              ${r.listing.price_amount.toFixed(2)}
            </p>
          )}
          <div className="flex items-center gap-1 mt-1 justify-end">
            <span className={`w-1.5 h-1.5 rounded-full ${confidenceColors[r.confidence.band] || confidenceColors.low}`} />
            <span className="text-stone-600 text-[10px]">
              {r.confidence.band}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
