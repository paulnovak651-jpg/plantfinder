import { getSupabaseAdmin } from './db';

export interface ParsedQuery {
  rawQuery: string;
  plantTerms: string[];
  locationTerms: string[];
  zipCode?: string;
  listingType?: 'scion' | 'rootstock' | 'tree' | 'plant' | 'cutting' | 'seed';
  edibleOnly: boolean;
  zoneFilter?: number;
  stateFilter?: string;
  shippingOnly: boolean;
  localOnly: boolean;
  selfFertileOnly: boolean;
  useTagFilters: string[];
}

export interface SearchResult {
  listingId: number;
  supplierId: number;
  supplierName: string;
  supplierSlug: string;
  supplierCity: string;
  supplierState: string;
  supplierLat?: number;
  supplierLng?: number;
  shipsNationwide: boolean;
  isOrganic: boolean;
  plantName: string;
  botanicalName: string;
  cultivarName?: string;
  rootstockName?: string;
  listingType: string;
  normalizedTitle: string;
  priceMin?: number;
  priceMax?: number;
  zoneMin?: number;
  zoneMax?: number;
  edible: boolean;
  useTags: string[];
  pollinationNotes?: string;
  confidenceScore: number;
  availabilityStatus: string;
  textMatchScore: number;
  distanceMiles?: number;
  compositeScore: number;
}

const STOP_WORDS = new Set(['a','an','the','and','or','for','of','in','at','to','i','want','looking','find','buy','get','need','some','any','where','can','my','zone','near','me','local','online','ship','shipping','please','thanks','help','good','best','great','nice']);

const LISTING_TYPE_MAP: Record<string, ParsedQuery['listingType']> = {
  scion: 'scion', scionwood: 'scion', scions: 'scion', budwood: 'scion',
  rootstock: 'rootstock', rootstocks: 'rootstock', understory: 'rootstock',
  tree: 'tree', trees: 'tree', bare: 'tree', 'bare-root': 'tree',
  cutting: 'cutting', cuttings: 'cutting', hardwood: 'cutting',
  seed: 'seed', seeds: 'seed',
  plant: 'plant', plants: 'plant', seedling: 'plant', seedlings: 'plant', plug: 'plant', plugs: 'plant',
};

const USE_TAG_WORDS: Record<string, string> = {
  cider: 'cider', juice: 'juice', jam: 'jam', jelly: 'jam', fresh: 'fresh eating',
  'fresh eating': 'fresh eating', cooking: 'cooking', drying: 'drying', wine: 'wine',
  ornamental: 'ornamental', wildlife: 'wildlife', perry: 'perry',
};

export function parseQuery(raw: string): ParsedQuery {
  const lower = raw.toLowerCase().trim();
  const tokens = lower.replace(/[^\w\s]/g, ' ').split(/\s+/).filter(Boolean);

  const result: ParsedQuery = {
    rawQuery: raw,
    plantTerms: [],
    locationTerms: [],
    edibleOnly: false,
    shippingOnly: false,
    localOnly: false,
    selfFertileOnly: false,
    useTagFilters: [],
  };

  const zipMatch = lower.match(/\b(\d{5})\b/);
  if (zipMatch) result.zipCode = zipMatch[1];

  const stateMatch = lower.match(/\b([a-z]{2})\b/);
  if (stateMatch) result.stateFilter = stateMatch[1].toUpperCase();

  if (/\b(ship|ships|shipping|mail|online|nationwide)\b/.test(lower)) result.shippingOnly = true;
  if (/\b(local|nearby|near me|pickup|pick up)\b/.test(lower)) result.localOnly = true;
  if (/\b(self.fertil|self fertil)\b/.test(lower)) result.selfFertileOnly = true;
  if (/\b(edible|fruit|food|eat)\b/.test(lower)) result.edibleOnly = true;

  for (const token of tokens) {
    if (LISTING_TYPE_MAP[token]) { result.listingType = LISTING_TYPE_MAP[token]; continue; }
    if (USE_TAG_WORDS[token]) { if (!result.useTagFilters.includes(USE_TAG_WORDS[token])) result.useTagFilters.push(USE_TAG_WORDS[token]); continue; }
    if (STOP_WORDS.has(token)) continue;
    if (/^\d+$/.test(token)) continue;
    result.plantTerms.push(token);
  }

  return result;
}

function textMatch(parsed: ParsedQuery, row: any): number {
  if (parsed.plantTerms.length === 0) return 0.5;
  const haystack = [
    row.normalized_title,
    row.plants?.common_name,
    row.plants?.botanical_name,
    ...(row.plants?.common_aliases || []),
    row.cultivars?.cultivar_name,
    row.rootstocks?.name,
  ].filter(Boolean).join(' ').toLowerCase();

  let matched = 0;
  for (const term of parsed.plantTerms) {
    const re = new RegExp(`\\b${term}`, 'i');
    if (re.test(haystack)) matched++;
  }
  return matched / parsed.plantTerms.length;
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

export async function searchListings(
  parsed: ParsedQuery,
  userZone?: number,
  userState?: string,
  userLat?: number,
  userLng?: number
): Promise<SearchResult[]> {
  const supabase = getSupabaseAdmin();

  let query = supabase
    .from('supplier_listings')
    .select(`
      id, listing_type, normalized_title, price_amount, ships_now, pickup_only,
      availability_status, confidence_score,
      suppliers!inner ( id, name, slug, city, state, lat, lng, shipping_states, pickup_available, supplier_status ),
      plants ( id, botanical_name, common_name, common_aliases, zone_min, zone_max, edible, use_tags, pollination_notes ),
      cultivars ( id, cultivar_name, self_fertile, zone_min_override, zone_max_override ),
      rootstocks ( id, name, vigor_class, compatible_with )
    `)
    .eq('is_visible', true)
    .eq('suppliers.supplier_status', 'active')
    .order('confidence_score', { ascending: false })
    .limit(50);

  if (parsed.listingType) query = query.eq('listing_type', parsed.listingType);
  if (parsed.edibleOnly) query = query.eq('plants.edible', true);
  if (parsed.zoneFilter) {
    query = query.lte('plants.zone_min', parsed.zoneFilter).gte('plants.zone_max', parsed.zoneFilter);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Supabase query failed: ${error.message}`);
  if (!data || data.length === 0) return [];

  let rows = data as any[];

  // Client-side text filtering
  if (parsed.plantTerms.length > 0) {
    rows = rows.filter(row => textMatch(parsed, row) > 0);
  }

  if (parsed.shippingOnly) {
    rows = rows.filter(r => Array.isArray(r.suppliers?.shipping_states) && r.suppliers.shipping_states.includes('ALL'));
  }
  if (parsed.localOnly) rows = rows.filter(r => r.suppliers?.pickup_available);
  if (parsed.selfFertileOnly) rows = rows.filter(r => r.cultivars?.self_fertile);

  const results: SearchResult[] = rows.map(row => {
    const tmScore = textMatch(parsed, row);
    const availScore = row.availability_status === 'in_stock' ? 1 : row.availability_status === 'limited' ? 0.5 : 0.1;
    const confScore = (row.confidence_score || 50) / 100;
    const shipsNationwide = Array.isArray(row.suppliers?.shipping_states) && row.suppliers.shipping_states.includes('ALL');
    const shipScore = shipsNationwide || row.ships_now ? 1 : 0.3;

    let distScore = 0.5;
    let distanceMiles: number | undefined;
    if (userLat && userLng && row.suppliers?.lat && row.suppliers?.lng) {
      distanceMiles = haversine(userLat, userLng, row.suppliers.lat, row.suppliers.lng);
      distScore = Math.max(0, 1 - distanceMiles / 500);
    }

    const composite = tmScore * 0.35 + availScore * 0.25 + confScore * 0.20 + distScore * 0.10 + shipScore * 0.10;

    return {
      listingId: row.id,
      supplierId: row.suppliers?.id,
      supplierName: row.suppliers?.name || '',
      supplierSlug: row.suppliers?.slug || '',
      supplierCity: row.suppliers?.city || '',
      supplierState: row.suppliers?.state || '',
      supplierLat: row.suppliers?.lat,
      supplierLng: row.suppliers?.lng,
      shipsNationwide,
      isOrganic: false,
      plantName: row.plants?.common_name || '',
      botanicalName: row.plants?.botanical_name || '',
      cultivarName: row.cultivars?.cultivar_name,
      rootstockName: row.rootstocks?.name,
      listingType: row.listing_type,
      normalizedTitle: row.normalized_title,
      priceMin: row.price_amount,
      priceMax: row.price_amount,
      zoneMin: row.cultivars?.zone_min_override ?? row.plants?.zone_min,
      zoneMax: row.cultivars?.zone_max_override ?? row.plants?.zone_max,
      edible: row.plants?.edible || false,
      useTags: row.plants?.use_tags || [],
      pollinationNotes: row.plants?.pollination_notes,
      confidenceScore: row.confidence_score || 0,
      availabilityStatus: row.availability_status || 'unknown',
      textMatchScore: tmScore,
      distanceMiles,
      compositeScore: composite,
    };
  });

  return results.sort((a, b) => b.compositeScore - a.compositeScore);
}
