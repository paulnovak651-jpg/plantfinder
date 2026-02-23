import { NextRequest, NextResponse } from 'next/server';
import { parseQuery, searchListings } from '@/lib/search';
import { getSupabaseAdmin } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const zip = searchParams.get('zip') || '';

    if (!q.trim()) {
      return NextResponse.json({ results: [], pins: [], query: null });
    }

    const parsed = parseQuery(q);
    if (zip && /^\d{5}$/.test(zip)) parsed.zipCode = zip;

    let userZone: number | undefined;
    let userState: string | undefined;
    let userLat: number | undefined;
    let userLng: number | undefined;

    const zipToLookup = parsed.zipCode || zip;
    if (zipToLookup) {
      const supabase = getSupabaseAdmin();
      const { data: zoneData } = await supabase
        .from('zip_zones')
        .select('zone, state, lat, lng')
        .eq('zip_code', zipToLookup)
        .single();
      if (zoneData) {
        userZone = zoneData.zone;
        userState = zoneData.state;
        userLat = zoneData.lat;
        userLng = zoneData.lng;
      }
    }

    const results = await searchListings(parsed, userZone, userState, userLat, userLng);

    const pins = results
      .filter(r => r.supplierLat && r.supplierLng)
      .map(r => ({
        id: r.listingId,
        lat: r.supplierLat!,
        lng: r.supplierLng!,
        name: r.supplierName,
        title: r.normalizedTitle,
        city: r.supplierCity,
        state: r.supplierState,
      }));

    // Log search (fire and forget)
    if (q.trim()) {
      const supabase = getSupabaseAdmin();
      supabase.from('user_searches').insert({
        query_raw: q,
        zip_code: zipToLookup || null,
        result_count: results.length,
      }).then(() => {}, () => {});
    }

    return NextResponse.json({
      results,
      pins,
      query: parsed,
      zone: userZone,
      state: userState,
    });
  } catch (error: any) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Search failed', message: error?.message || 'Unknown error', results: [], pins: [] },
      { status: 500 }
    );
  }
}
