import { NextRequest, NextResponse } from 'next/server';
import { parseQuery, searchListings } from '@/lib/search';
import { initializeDb } from '@/lib/db';

let dbReady = false;

export async function GET(request: NextRequest) {
  try {
    if (!dbReady) {
      initializeDb();
      dbReady = true;
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const zone = searchParams.get('zone') ? parseFloat(searchParams.get('zone')!) : undefined;
    const state = searchParams.get('state') || undefined;
    const lat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : undefined;
    const lng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : undefined;

    if (!q.trim()) {
      return NextResponse.json({
        results: [],
        map_pins: [],
        parsed_query: null,
        meta: { total_results: 0, total_suppliers: 0 },
      });
    }

    const parsed = parseQuery(q);
    const results = searchListings(parsed, zone, state, lat, lng);

    // Build map pins from unique suppliers
    const supplierMap = new Map<number, any>();
    for (const r of results) {
      if (!supplierMap.has(r.supplier.id)) {
        supplierMap.set(r.supplier.id, {
          supplier_id: r.supplier.id,
          name: r.supplier.name,
          slug: r.supplier.slug,
          lat: r.supplier.lat,
          lng: r.supplier.lng,
          city: r.supplier.city,
          state: r.supplier.state,
          listing_count: 0,
        });
      }
      supplierMap.get(r.supplier.id)!.listing_count++;
    }

    return NextResponse.json({
      results,
      map_pins: Array.from(supplierMap.values()),
      parsed_query: parsed,
      meta: {
        total_results: results.length,
        total_suppliers: supplierMap.size,
      },
    });
  } catch (error: any) {
    console.error('Search API error:', error);
    return NextResponse.json(
      {
        error: 'Search failed',
        message: error?.message || 'Unknown error',
        results: [],
        map_pins: [],
        meta: { total_results: 0, total_suppliers: 0 },
      },
      { status: 500 }
    );
  }
}
