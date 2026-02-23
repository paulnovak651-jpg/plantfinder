import { NextRequest, NextResponse } from 'next/server';
import { parseQuery, searchListings } from '@/lib/search';
import { getDb, initializeDb } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';

// Initialize DB on first request
let initialized = false;

function ensureDb() {
  if (!initialized) {
    initializeDb();
    seedDatabase();
    initialized = true;
  }
}

export async function GET(request: NextRequest) {
  ensureDb();

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  const zip = searchParams.get('zip') || '';

  if (!q.trim()) {
    return NextResponse.json({ error: 'Query is required', results: [], map_pins: [] }, { status: 400 });
  }

  // Parse the query
  const parsed = parseQuery(q);

  // Look up user location from zip
  let userZone: number | undefined;
  let userState: string | undefined;
  let userLat: number | undefined;
  let userLng: number | undefined;
  let userCity: string | undefined;
  let userZoneLabel: string | undefined;

  if (zip) {
    const db = getDb();
    const zipData = db.prepare('SELECT * FROM zip_zones WHERE zip_code = ?').get(zip) as any;
    if (zipData) {
      userZone = zipData.zone_number;
      userState = zipData.state;
      userLat = zipData.lat;
      userLng = zipData.lng;
      userCity = zipData.city;
      userZoneLabel = zipData.zone;
    }
  }

  // Execute search
  const results = searchListings(parsed, userZone, userState, userLat, userLng);

  // Log search for demand intelligence
  try {
    const db = getDb();
    db.prepare(`
      INSERT INTO user_searches (raw_query, parsed_filters, user_zip, user_zone, user_state, result_count)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(q, JSON.stringify(parsed), zip || null, userZoneLabel || null, userState || null, results.length);
  } catch (e) {
    // Non-critical, don't fail search
  }

  // Build map pins from results
  const supplierMap = new Map<number, any>();
  for (const r of results) {
    const existing = supplierMap.get(r.supplier.id);
    if (!existing) {
      supplierMap.set(r.supplier.id, {
        supplier_id: r.supplier.id,
        name: r.supplier.name,
        slug: r.supplier.slug,
        lat: r.supplier.lat,
        lng: r.supplier.lng,
        city: r.supplier.city,
        state: r.supplier.state,
        listing_count: 1,
        best_status: r.availability.status,
        best_confidence: r.confidence.band,
        pin_color: getPinColor(r.availability.status, r.confidence.band),
      });
    } else {
      existing.listing_count++;
    }
  }

  return NextResponse.json({
    meta: {
      query: q,
      parsed,
      user_location: zip ? {
        zip,
        city: userCity,
        state: userState,
        zone: userZoneLabel,
        zone_number: userZone,
        lat: userLat,
        lng: userLng,
      } : null,
      total_results: results.length,
      total_suppliers: supplierMap.size,
    },
    results,
    map_pins: Array.from(supplierMap.values()),
  });
}

function getPinColor(status: string, confidence: string): string {
  if (status === 'in_stock' && confidence === 'high') return 'green';
  if (status === 'in_stock') return 'yellow';
  if (status === 'limited') return 'yellow';
  if (status === 'preorder' || status === 'seasonal') return 'blue';
  return 'gray';
}
