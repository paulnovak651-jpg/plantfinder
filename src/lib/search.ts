import { getDb } from './db';

export interface ParsedQuery {
  intent_type: 'exact_item' | 'category' | 'goal_based' | 'trait_based';
  plant_terms: string[];
  cultivar_terms: string[];
  listing_type: string | null;
  zone: string | null;
  use_tags: string[];
  traits: string[];
  availability_preference: 'now' | 'preorder' | 'any';
}

export interface SearchResult {
  listing_id: number;
  listing_type: string;
  rank_score: number;
  plant: {
    id: number;
    botanical_name: string;
    common_name: string;
    zone_min: number;
    zone_max: number;
    edible: boolean;
    use_tags: string[];
  } | null;
  cultivar: {
    id: number;
    name: string;
    self_fertile: boolean;
    pollination_notes: string;
  } | null;
  rootstock: {
    id: number;
    name: string;
    vigor_class: string;
    compatible_with: string[];
  } | null;
  supplier: {
    id: number;
    name: string;
    slug: string;
    city: string;
    state: string;
    lat: number;
    lng: number;
    ships_to_user: boolean;
  };
  listing: {
    normalized_title: string;
    size_raw: string;
    price_amount: number | null;
    listing_url: string | null;
  };
  availability: {
    status: string;
    qty_bucket: string | null;
    ships_now: boolean;
    seasonal_window: { start: string; end: string } | null;
  };
  confidence: {
    score: number;
    band: string;
    last_updated: string | null;
  };
  match_reasons: { tag: string; label: string }[];
}

// Parse natural language query into structured filters
export function parseQuery(raw: string): ParsedQuery {
  const q = raw.toLowerCase().trim();

  const result: ParsedQuery = {
    intent_type: 'exact_item',
    plant_terms: [],
    cultivar_terms: [],
    listing_type: null,
    zone: null,
    use_tags: [],
    traits: [],
    availability_preference: 'any',
  };

  // Detect listing type
  if (/scion(wood)?/i.test(q)) result.listing_type = 'scionwood';
  else if (/rootstock/i.test(q)) result.listing_type = 'rootstock';
  else if (/cutting/i.test(q)) result.listing_type = 'cutting';
  else if (/seed(s|ling)?/i.test(q)) result.listing_type = 'plant';
  else if (/liner/i.test(q)) result.listing_type = 'liner';

  // Detect zone
  const zoneMatch = q.match(/zone\s*(\d+[ab]?)/i);
  if (zoneMatch) result.zone = zoneMatch[1];

  // Detect availability
  if (/\b(now|available|in stock)\b/i.test(q)) result.availability_preference = 'now';
  if (/\bpreorder\b/i.test(q)) result.availability_preference = 'preorder';

  // Detect use tags
  const useTagMap: Record<string, string> = {
    'hedge': 'hedge',
    'privacy': 'hedge',
    'windbreak': 'windbreak',
    'nitrogen': 'nitrogen_fixer',
    'pollinator': 'pollinator',
    'native': 'native',
    'edible': 'edible',
    'food forest': 'food_forest',
    'erosion': 'erosion_control',
    'wildlife': 'wildlife',
    'timber': 'timber',
  };

  for (const [keyword, tag] of Object.entries(useTagMap)) {
    if (q.includes(keyword)) result.use_tags.push(tag);
  }

  // Detect traits
  const traitMap: Record<string, string> = {
    'shade': 'shade_tolerant',
    'part shade': 'part_shade',
    'wet': 'wet_tolerant',
    'dry': 'drought_tolerant',
    'cold hardy': 'cold_hardy',
    'disease resistant': 'disease_resistant',
    'self fertile': 'self_fertile',
    'fast growing': 'fast_growing',
  };

  for (const [keyword, trait] of Object.entries(traitMap)) {
    if (q.includes(keyword)) result.traits.push(trait);
  }

  // Extract remaining terms as plant/cultivar search terms
  const stopWords = new Set([
    'tree', 'trees', 'plant', 'plants', 'bush', 'bushes', 'shrub', 'shrubs',
    'vine', 'vines', 'berry', 'berries', 'fruit', 'nut', 'for', 'the', 'and',
    'with', 'that', 'can', 'good', 'best', 'buy', 'find', 'where', 'get',
    'me', 'my', 'some', 'any', 'new', 'variety', 'varieties', 'type', 'types',
  ]);

  let cleaned = q
    .replace(/zone\s*\d+[ab]?/gi, '')
    .replace(/\b(scionwood|scion|rootstock|cutting|seedling|liner|bare root|potted)\b/gi, '')
    .replace(/\b(now|available|in stock|preorder)\b/gi, '')
    .replace(/\b(hedge|privacy|windbreak|nitrogen|pollinator|native|edible|food forest|erosion|wildlife|timber)\b/gi, '')
    .replace(/\b(shade|wet|dry|cold hardy|disease resistant|self fertile|fast growing)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (cleaned) {
    result.plant_terms = cleaned.split(' ').filter(t => t.length > 1 && !stopWords.has(t));
  }

  // Determine intent type
  if (result.use_tags.length > 0 || result.traits.length > 0) {
    result.intent_type = result.plant_terms.length > 0 ? 'trait_based' : 'goal_based';
  } else if (result.plant_terms.length > 0) {
    result.intent_type = 'exact_item';
  } else {
    result.intent_type = 'category';
  }

  return result;
}

// Execute search against database
export function searchListings(
  parsed: ParsedQuery,
  userZone?: number,
  userState?: string,
  userLat?: number,
  userLng?: number
): SearchResult[] {
  const db = getDb();

  // Build WHERE clauses
  const conditions: string[] = ['sl.is_visible = 1', "s.supplier_status = 'active'"];
  const params: any[] = [];

  // Text search on plant/cultivar names
  if (parsed.plant_terms.length > 0) {
    const termConditions = parsed.plant_terms.map(term => {
      params.push(`%${term}%`, `%${term}%`, `%${term}%`, `%${term}%`, `%${term}%`);
      return `(
        p.common_name LIKE ? OR
        p.botanical_name LIKE ? OR
        p.common_aliases LIKE ? OR
        c.cultivar_name LIKE ? OR
        sl.normalized_title LIKE ?
      )`;
    });
    conditions.push(`(${termConditions.join(' AND ')})`);
  }

  // Listing type filter
  if (parsed.listing_type) {
    conditions.push('sl.listing_type = ?');
    params.push(parsed.listing_type);
  }

  // Availability preference
  if (parsed.availability_preference === 'now') {
    conditions.push("sl.availability_status IN ('in_stock', 'limited')");
  } else if (parsed.availability_preference === 'preorder') {
    conditions.push("sl.availability_status = 'preorder'");
  }

  // Zone filter on plants
  if (parsed.zone || userZone) {
    const zoneNum = parsed.zone ? parseFloat(parsed.zone) : userZone;
    if (zoneNum) {
      conditions.push('(p.zone_min IS NULL OR p.zone_min <= ?)');
      conditions.push('(p.zone_max IS NULL OR p.zone_max >= ?)');
      params.push(zoneNum, zoneNum);
    }
  }

  // Use tags filter
  if (parsed.use_tags.length > 0) {
    for (const tag of parsed.use_tags) {
      conditions.push('p.use_tags LIKE ?');
      params.push(`%${tag}%`);
    }
  }

  const query = `
    SELECT
      sl.id as listing_id,
      sl.listing_type,
      sl.supplier_raw_name,
      sl.normalized_title,
      sl.size_raw,
      sl.price_amount,
      sl.availability_status,
      sl.qty_bucket,
      sl.seasonal_window_start,
      sl.seasonal_window_end,
      sl.ships_now,
      sl.listing_notes,
      sl.listing_url,
      sl.confidence_score,
      sl.confidence_band,
      sl.last_inventory_update,
      sl.inventory_source,
      s.id as supplier_id,
      s.name as supplier_name,
      s.slug as supplier_slug,
      s.city as supplier_city,
      s.state as supplier_state,
      s.lat as supplier_lat,
      s.lng as supplier_lng,
      s.shipping_states,
      s.restricted_states,
      s.retail_enabled,
      s.wholesale_enabled,
      p.id as plant_id,
      p.botanical_name,
      p.common_name,
      p.zone_min as plant_zone_min,
      p.zone_max as plant_zone_max,
      p.edible,
      p.use_tags,
      p.pollination_notes,
      c.id as cultivar_id,
      c.cultivar_name,
      c.self_fertile,
      r.id as rootstock_id,
      r.name as rootstock_name,
      r.vigor_class,
      r.compatible_with
    FROM supplier_listings sl
    JOIN suppliers s ON sl.supplier_id = s.id
    LEFT JOIN plants p ON sl.plant_id = p.id
    LEFT JOIN cultivars c ON sl.cultivar_id = c.id
    LEFT JOIN rootstocks r ON sl.rootstock_id = r.id
    WHERE ${conditions.join(' AND ')}
    ORDER BY sl.confidence_score DESC, sl.availability_status ASC
    LIMIT 50
  `;

  const rows = db.prepare(query).all(...params) as any[];

  return rows.map(row => {
    // Calculate match reasons
    const reasons: { tag: string; label: string }[] = [];

    if (row.availability_status === 'in_stock') reasons.push({ tag: 'in_stock', label: 'In stock' });
    if (row.availability_status === 'limited') reasons.push({ tag: 'limited', label: 'Limited availability' });
    if (row.availability_status === 'preorder') reasons.push({ tag: 'preorder', label: 'Available for preorder' });
    if (row.availability_status === 'seasonal') reasons.push({ tag: 'seasonal', label: `Ships ${row.seasonal_window_start || 'seasonally'}` });

    if (userZone && row.plant_zone_min && row.plant_zone_min <= userZone) {
      reasons.push({ tag: 'zone_match', label: `Hardy to Zone ${row.plant_zone_min}` });
    }

    if (row.confidence_band === 'high') reasons.push({ tag: 'high_confidence', label: 'Recently updated' });

    // Check shipping
    let shipsToUser = true;
    if (userState && row.restricted_states) {
      const restricted = JSON.parse(row.restricted_states || '[]');
      if (restricted.includes(userState)) shipsToUser = false;
    }
    if (shipsToUser && userState) {
      reasons.push({ tag: 'ships_to_user', label: `Ships to ${userState}` });
    }

    // Calculate distance-based score
    let distanceScore = 0;
    if (userLat && userLng && row.supplier_lat && row.supplier_lng) {
      const dist = haversine(userLat, userLng, row.supplier_lat, row.supplier_lng);
      distanceScore = Math.max(0, 1 - dist / 3000); // normalize to 3000 miles
    }

    // Composite ranking score
    const textScore = parsed.plant_terms.length > 0 ? 0.8 : 0.5;
    const availScore = row.availability_status === 'in_stock' ? 1 : row.availability_status === 'limited' ? 0.8 : row.availability_status === 'preorder' ? 0.5 : 0.3;
    const confidenceScore = row.confidence_score || 0.5;

    const rankScore = (
      textScore * 0.35 +
      availScore * 0.25 +
      confidenceScore * 0.20 +
      distanceScore * 0.10 +
      (shipsToUser ? 0.10 : 0)
    );

    return {
      listing_id: row.listing_id,
      listing_type: row.listing_type,
      rank_score: Math.round(rankScore * 100) / 100,
      plant: row.plant_id ? {
        id: row.plant_id,
        botanical_name: row.botanical_name,
        common_name: row.common_name,
        zone_min: row.plant_zone_min,
        zone_max: row.plant_zone_max,
        edible: !!row.edible,
        use_tags: JSON.parse(row.use_tags || '[]'),
      } : null,
      cultivar: row.cultivar_id ? {
        id: row.cultivar_id,
        name: row.cultivar_name,
        self_fertile: !!row.self_fertile,
        pollination_notes: row.pollination_notes || '',
      } : null,
      rootstock: row.rootstock_id ? {
        id: row.rootstock_id,
        name: row.rootstock_name,
        vigor_class: row.vigor_class,
        compatible_with: JSON.parse(row.compatible_with || '[]'),
      } : null,
      supplier: {
        id: row.supplier_id,
        name: row.supplier_name,
        slug: row.supplier_slug,
        city: row.supplier_city,
        state: row.supplier_state,
        lat: row.supplier_lat,
        lng: row.supplier_lng,
        ships_to_user: shipsToUser,
      },
      listing: {
        normalized_title: row.normalized_title || row.supplier_raw_name,
        size_raw: row.size_raw,
        price_amount: row.price_amount,
        listing_url: row.listing_url,
      },
      availability: {
        status: row.availability_status,
        qty_bucket: row.qty_bucket,
        ships_now: !!row.ships_now,
        seasonal_window: row.seasonal_window_start ? {
          start: row.seasonal_window_start,
          end: row.seasonal_window_end || '',
        } : null,
      },
      confidence: {
        score: row.confidence_score,
        band: row.confidence_band,
        last_updated: row.last_inventory_update,
      },
      match_reasons: reasons,
    };
  }).sort((a, b) => b.rank_score - a.rank_score);
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959; // miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
