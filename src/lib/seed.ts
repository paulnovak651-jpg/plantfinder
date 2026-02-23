import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bwfhdyjjuubpzwjngquo.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3ZmhkeWpqdXVicHp3am5ncXVvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTg0ODg2OCwiZXhwIjoyMDg3NDI0ODY4fQ.FlHujojrkLzsmBE9Gm2VHRr9QxZxm0nrfd_A_cLI9WE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seed() {
  console.log('Seeding plants...');
  const { count: plantCount } = await supabase.from('plants').select('*', { count: 'exact', head: true });
  if (!plantCount || plantCount === 0) {
    const { error: plantError } = await supabase.from('plants').insert([
      { botanical_name: 'Asimina triloba', common_name: 'Pawpaw', common_aliases: ['Indiana banana','poor mans banana'], plant_group: 'tree', edible: true, zone_min: 5, zone_max: 9, sun: ['full sun','partial shade'], soil_moisture: ['moist','well-drained'], use_tags: ['fresh eating','wildlife'], pollination_notes: 'Requires cross-pollination. Plant 2+ trees.', chill_hours_min: 400, growth_rate: 'moderate', mature_height_ft: 20, description: 'Native North American fruit tree with large tropical-flavored fruits.' },
      { botanical_name: 'Diospyros virginiana', common_name: 'American Persimmon', common_aliases: ['possumwood','simmon'], plant_group: 'tree', edible: true, zone_min: 4, zone_max: 9, sun: ['full sun','partial shade'], soil_moisture: ['dry','moist','well-drained'], use_tags: ['fresh eating','wildlife','drying'], pollination_notes: 'Dioecious — need male and female trees for fruit.', chill_hours_min: 100, growth_rate: 'slow', mature_height_ft: 60, description: 'Hardy native persimmon with astringent fruits that sweeten after frost.' },
      { botanical_name: 'Diospyros kaki', common_name: 'Asian Persimmon', common_aliases: ['Japanese persimmon','kaki'], plant_group: 'tree', edible: true, zone_min: 7, zone_max: 10, sun: ['full sun'], soil_moisture: ['well-drained'], use_tags: ['fresh eating','drying'], pollination_notes: 'Most cultivars self-fertile.', chill_hours_min: 200, growth_rate: 'moderate', mature_height_ft: 25, description: 'Large-fruited persimmon, non-astringent varieties eaten firm.' },
      { botanical_name: 'Prunus persica', common_name: 'Peach', common_aliases: ['nectarine'], plant_group: 'tree', edible: true, zone_min: 5, zone_max: 9, sun: ['full sun'], soil_moisture: ['well-drained'], use_tags: ['fresh eating','jam','cooking'], pollination_notes: 'Most varieties self-fertile.', chill_hours_min: 650, growth_rate: 'fast', mature_height_ft: 15, description: 'Classic stone fruit, many varieties available.' },
      { botanical_name: 'Malus domestica', common_name: 'Apple', common_aliases: ['cider apple','dessert apple'], plant_group: 'tree', edible: true, zone_min: 3, zone_max: 8, sun: ['full sun'], soil_moisture: ['well-drained','moist'], use_tags: ['fresh eating','cider','cooking','jam'], pollination_notes: 'Requires cross-pollination with compatible variety.', chill_hours_min: 800, growth_rate: 'moderate', mature_height_ft: 20, description: 'Most widely grown fruit tree. Thousands of varieties.' },
      { botanical_name: 'Pyrus communis', common_name: 'Pear', common_aliases: ['European pear'], plant_group: 'tree', edible: true, zone_min: 4, zone_max: 8, sun: ['full sun'], soil_moisture: ['well-drained'], use_tags: ['fresh eating','cooking','canning'], pollination_notes: 'Most varieties need cross-pollination.', chill_hours_min: 600, growth_rate: 'moderate', mature_height_ft: 20, description: 'Long-lived tree with sweet, gritty fruits.' },
      { botanical_name: 'Prunus avium', common_name: 'Sweet Cherry', common_aliases: ['bird cherry'], plant_group: 'tree', edible: true, zone_min: 5, zone_max: 7, sun: ['full sun'], soil_moisture: ['well-drained'], use_tags: ['fresh eating','jam'], pollination_notes: 'Requires cross-pollination for most varieties.', chill_hours_min: 700, growth_rate: 'fast', mature_height_ft: 35, description: 'Beloved spring fruit tree.' },
      { botanical_name: 'Juglans regia', common_name: 'English Walnut', common_aliases: ['Persian walnut'], plant_group: 'tree', edible: true, zone_min: 5, zone_max: 9, sun: ['full sun'], soil_moisture: ['deep','well-drained'], use_tags: ['fresh eating','cooking'], pollination_notes: 'Monoecious, but plant 2 for best yields.', growth_rate: 'fast', mature_height_ft: 60, description: 'Large nut tree, highly productive.' },
      { botanical_name: 'Ficus carica', common_name: 'Fig', common_aliases: ['common fig'], plant_group: 'tree', edible: true, zone_min: 7, zone_max: 11, sun: ['full sun'], soil_moisture: ['well-drained','dry'], use_tags: ['fresh eating','drying','jam'], pollination_notes: 'Most common figs are self-fertile.', growth_rate: 'fast', mature_height_ft: 15, description: 'Sweet fruit, very productive in warm climates.' },
      { botanical_name: 'Vaccinium corymbosum', common_name: 'Highbush Blueberry', common_aliases: ['blueberry'], plant_group: 'shrub', edible: true, zone_min: 4, zone_max: 7, sun: ['full sun','partial shade'], soil_moisture: ['acidic','moist'], use_tags: ['fresh eating','jam','cooking'], pollination_notes: 'Plant 2+ varieties for better yields.', growth_rate: 'slow', mature_height_ft: 6, description: 'High-yielding berry shrub, needs acid soil.' },
    ]);
    if (plantError) throw plantError;
  }

  const { data: plants } = await supabase.from('plants').select('id, common_name');
  if (!plants || plants.length === 0) throw new Error('Plants not found');
  const pId = (name: string) => plants.find(p => p.common_name === name)?.id;

  console.log('Seeding cultivars...');
  const { count: cultivarCount } = await supabase.from('cultivars').select('*', { count: 'exact', head: true });
  if (!cultivarCount || cultivarCount === 0) {
    const { error: cultivarError } = await supabase.from('cultivars').insert([
      { plant_id: pId('Pawpaw'), cultivar_name: 'Shenandoah', self_fertile: false, zone_min_override: 5, zone_max_override: 9, description: 'Large fruits, excellent flavor, reliable producer.' },
      { plant_id: pId('Pawpaw'), cultivar_name: 'Susquehanna', self_fertile: false, zone_min_override: 5, zone_max_override: 9, description: 'Very large fruits, rich flavor.' },
      { plant_id: pId('American Persimmon'), cultivar_name: 'Meader', self_fertile: true, zone_min_override: 4, zone_max_override: 9, description: 'Self-fertile American persimmon, good producer.' },
      { plant_id: pId('Asian Persimmon'), cultivar_name: 'Fuyu', self_fertile: true, zone_min_override: 7, zone_max_override: 10, description: 'Non-astringent, eaten firm like an apple.' },
      { plant_id: pId('Peach'), cultivar_name: 'Reliance', self_fertile: true, zone_min_override: 4, zone_max_override: 8, description: 'Extra-hardy peach, survives zone 4 winters.' },
      { plant_id: pId('Apple'), cultivar_name: 'Honeycrisp', self_fertile: false, zone_min_override: 3, zone_max_override: 8, description: 'Crisp, sweet-tart, very popular.' },
      { plant_id: pId('Apple'), cultivar_name: 'Goldrush', self_fertile: false, zone_min_override: 4, zone_max_override: 8, description: 'Late ripening, excellent for cider, disease resistant.' },
      { plant_id: pId('Sweet Cherry'), cultivar_name: 'Stella', self_fertile: true, zone_min_override: 5, zone_max_override: 7, description: 'One of the few self-fertile sweet cherries.' },
      { plant_id: pId('Fig'), cultivar_name: 'Brown Turkey', self_fertile: true, zone_min_override: 7, zone_max_override: 11, description: 'Reliable, prolific, mild-flavored fig.' },
    ]);
    if (cultivarError) throw cultivarError;
  }

  const { data: cultivars } = await supabase.from('cultivars').select('id, cultivar_name');
  const cId = (name: string) => cultivars?.find(c => c.cultivar_name === name)?.id;

  console.log('Seeding rootstocks...');
  const { count: rootstockCount } = await supabase.from('rootstocks').select('*', { count: 'exact', head: true });
  if (!rootstockCount || rootstockCount === 0) {
    const { error: rootstockError } = await supabase.from('rootstocks').insert([
      { name: 'M9', vigor_class: 'dwarfing', compatible_with: ['Apple'], description: 'Very dwarfing, needs support, early bearing.' },
      { name: 'M111', vigor_class: 'semi-vigorous', compatible_with: ['Apple'], description: 'Drought tolerant, good for poor soils.' },
      { name: 'G11', vigor_class: 'dwarfing', compatible_with: ['Apple'], description: 'Geneva series, replant disease resistant.' },
      { name: 'Lovell', vigor_class: 'standard', compatible_with: ['Peach','Nectarine','Plum'], description: 'Standard peach rootstock, excellent anchorage.' },
      { name: 'Citation', vigor_class: 'semi-dwarfing', compatible_with: ['Peach','Plum','Nectarine'], description: 'Semi-dwarfing, good for wet soils.' },
      { name: 'Gisela 6', vigor_class: 'semi-dwarfing', compatible_with: ['Sweet Cherry'], description: 'Widely used cherry dwarfing rootstock.' },
      { name: 'OHxF 97', vigor_class: 'semi-vigorous', compatible_with: ['Pear'], description: 'Fire blight resistant, good anchorage.' },
    ]);
    if (rootstockError) throw rootstockError;
  }

  const { data: rootstocks } = await supabase.from('rootstocks').select('id, name');
  const rId = (name: string) => rootstocks?.find(r => r.name === name)?.id;

  console.log('Seeding suppliers...');
  const { count: supplierCount } = await supabase.from('suppliers').select('*', { count: 'exact', head: true });
  const supplierSeed = [
    { name: 'One Green World', slug: 'one-green-world', city: 'Mollala', state: 'OR', lat: 45.14, lng: -122.57, shipsNationwide: true, pickupAvailable: false, website_url: 'https://onegreenworld.com', bio: 'Rare and unusual edible plants.' },
    { name: 'Cummins Nursery', slug: 'cummins-nursery', city: 'Ithaca', state: 'NY', lat: 42.44, lng: -76.50, shipsNationwide: true, pickupAvailable: false, website_url: 'https://cumminsnursery.com', bio: 'Fruit tree specialists, excellent rootstock selection.' },
    { name: 'Stark Bros', slug: 'stark-bros', city: 'Louisiana', state: 'MO', lat: 39.44, lng: -91.05, shipsNationwide: true, pickupAvailable: false, website_url: 'https://starkbros.com', bio: 'Over 190 years of fruit tree growing.' },
    { name: 'Fedco Trees', slug: 'fedco-trees', city: 'Clinton', state: 'ME', lat: 44.63, lng: -69.50, shipsNationwide: false, pickupAvailable: true, website_url: 'https://fedcoseeds.com/trees', bio: 'Cooperative, cold-hardy varieties, Northeast focus.' },
    { name: 'Raintree Nursery', slug: 'raintree-nursery', city: 'Morton', state: 'WA', lat: 46.55, lng: -122.27, shipsNationwide: true, pickupAvailable: false, website_url: 'https://raintree-nursery.com', bio: 'Pacific Northwest edible plant specialists.' },
    { name: 'Burnt Ridge Nursery', slug: 'burnt-ridge', city: 'Onalaska', state: 'WA', lat: 46.54, lng: -122.65, shipsNationwide: true, pickupAvailable: false, website_url: 'https://burntridgenursery.com', bio: 'Nuts, fruits, and native plants.' },
    { name: 'Hidden Springs Nursery', slug: 'hidden-springs', city: 'Cookeville', state: 'TN', lat: 36.16, lng: -85.50, shipsNationwide: false, pickupAvailable: true, website_url: 'https://hiddenspringsnursery.com', bio: 'Pawpaw and persimmon specialists.' },
    { name: 'Indiana Nut & Fruit', slug: 'indiana-nut-fruit', city: 'Bloomington', state: 'IN', lat: 39.16, lng: -86.52, shipsNationwide: false, pickupAvailable: true, website_url: 'https://indiananutandfruit.com', bio: 'Native Midwestern edibles.' },
    { name: 'Maple Valley Orchards', slug: 'maple-valley-orchards', city: 'Covington', state: 'WA', lat: 47.36, lng: -122.10, shipsNationwide: false, pickupAvailable: true, website_url: 'https://maplevalleyorchards.com', bio: 'Local Pacific Northwest orchard.' },
    { name: 'Trees of Antiquity', slug: 'trees-of-antiquity', city: 'Paso Robles', state: 'CA', lat: 35.63, lng: -120.69, shipsNationwide: true, pickupAvailable: false, website_url: 'https://treesofantiquity.com', bio: 'Heirloom apple and fruit tree specialists.' },
  ];

  if (!supplierCount || supplierCount === 0) {
    const { error: supplierError } = await supabase.from('suppliers').insert(
      supplierSeed.map(s => ({
        name: s.name,
        slug: s.slug,
        city: s.city,
        state: s.state,
        lat: s.lat,
        lng: s.lng,
        shipping_states: s.shipsNationwide ? ['ALL'] : [],
        pickup_available: s.pickupAvailable,
        retail_enabled: true,
        wholesale_enabled: false,
        supplier_status: 'active',
        website_url: s.website_url,
        bio: s.bio,
      }))
    );
    if (supplierError) throw supplierError;
  }

  const { data: suppliers } = await supabase.from('suppliers').select('id, name, slug');
  const sId = (slug: string) => suppliers?.find(s => s.slug === slug)?.id;
  const sName = (slug: string) => suppliers?.find(s => s.slug === slug)?.name || '';

  console.log('Seeding listings...');
  const { count: listingCount } = await supabase.from('supplier_listings').select('*', { count: 'exact', head: true });
  if (!listingCount || listingCount === 0) {
    const ships = (slug: string) => supplierSeed.find(s => s.slug === slug)?.shipsNationwide || false;
    const pickupOnly = (slug: string) => !ships(slug);

    const { error: listingError } = await supabase.from('supplier_listings').insert([
      { supplier_id: sId('hidden-springs'), supplier_raw_name: sName('hidden-springs'), plant_id: pId('Pawpaw'), cultivar_id: cId('Shenandoah'), listing_type: 'tree', normalized_title: 'Pawpaw Shenandoah Tree', price_amount: 28, availability_status: 'in_stock', is_visible: true, confidence_score: 90, ships_now: ships('hidden-springs'), pickup_only: pickupOnly('hidden-springs') },
      { supplier_id: sId('hidden-springs'), supplier_raw_name: sName('hidden-springs'), plant_id: pId('Pawpaw'), cultivar_id: cId('Susquehanna'), listing_type: 'tree', normalized_title: 'Pawpaw Susquehanna Tree', price_amount: 30, availability_status: 'limited', is_visible: true, confidence_score: 88, ships_now: ships('hidden-springs'), pickup_only: pickupOnly('hidden-springs') },
      { supplier_id: sId('one-green-world'), supplier_raw_name: sName('one-green-world'), plant_id: pId('Pawpaw'), cultivar_id: cId('Shenandoah'), listing_type: 'tree', normalized_title: 'Pawpaw Shenandoah Ships Nationwide', price_amount: 35, availability_status: 'in_stock', is_visible: true, confidence_score: 92, ships_now: ships('one-green-world'), pickup_only: pickupOnly('one-green-world') },
      { supplier_id: sId('indiana-nut-fruit'), supplier_raw_name: sName('indiana-nut-fruit'), plant_id: pId('Pawpaw'), listing_type: 'scion', normalized_title: 'Pawpaw Scionwood Mixed Varieties', price_amount: 8, availability_status: 'seasonal', is_visible: true, confidence_score: 75, ships_now: ships('indiana-nut-fruit'), pickup_only: pickupOnly('indiana-nut-fruit') },
      { supplier_id: sId('hidden-springs'), supplier_raw_name: sName('hidden-springs'), plant_id: pId('American Persimmon'), cultivar_id: cId('Meader'), listing_type: 'tree', normalized_title: 'American Persimmon Meader Tree', price_amount: 22, availability_status: 'in_stock', is_visible: true, confidence_score: 88, ships_now: ships('hidden-springs'), pickup_only: pickupOnly('hidden-springs') },
      { supplier_id: sId('one-green-world'), supplier_raw_name: sName('one-green-world'), plant_id: pId('Asian Persimmon'), cultivar_id: cId('Fuyu'), listing_type: 'tree', normalized_title: 'Fuyu Persimmon Non-Astringent', price_amount: 30, availability_status: 'in_stock', is_visible: true, confidence_score: 92, ships_now: ships('one-green-world'), pickup_only: pickupOnly('one-green-world') },
      { supplier_id: sId('cummins-nursery'), supplier_raw_name: sName('cummins-nursery'), plant_id: pId('Apple'), cultivar_id: cId('Honeycrisp'), rootstock_id: rId('M9'), listing_type: 'tree', normalized_title: 'Honeycrisp Apple on M9 Rootstock', price_amount: 35, availability_status: 'in_stock', is_visible: true, confidence_score: 95, ships_now: ships('cummins-nursery'), pickup_only: pickupOnly('cummins-nursery') },
      { supplier_id: sId('cummins-nursery'), supplier_raw_name: sName('cummins-nursery'), plant_id: pId('Apple'), cultivar_id: cId('Goldrush'), rootstock_id: rId('M111'), listing_type: 'tree', normalized_title: 'Goldrush Apple on M111 Cider Apple', price_amount: 38, availability_status: 'in_stock', is_visible: true, confidence_score: 93, ships_now: ships('cummins-nursery'), pickup_only: pickupOnly('cummins-nursery') },
      { supplier_id: sId('cummins-nursery'), supplier_raw_name: sName('cummins-nursery'), plant_id: pId('Apple'), rootstock_id: rId('M9'), listing_type: 'rootstock', normalized_title: 'M9 Apple Rootstock Bare Root', price_amount: 5, availability_status: 'in_stock', is_visible: true, confidence_score: 85, ships_now: ships('cummins-nursery'), pickup_only: pickupOnly('cummins-nursery') },
      { supplier_id: sId('stark-bros'), supplier_raw_name: sName('stark-bros'), plant_id: pId('Peach'), cultivar_id: cId('Reliance'), listing_type: 'tree', normalized_title: 'Reliance Peach Hardy Bare Root Tree', price_amount: 25, availability_status: 'in_stock', is_visible: true, confidence_score: 90, ships_now: ships('stark-bros'), pickup_only: pickupOnly('stark-bros') },
      { supplier_id: sId('fedco-trees'), supplier_raw_name: sName('fedco-trees'), plant_id: pId('Peach'), cultivar_id: cId('Reliance'), listing_type: 'tree', normalized_title: 'Reliance Peach Cold Hardy', price_amount: 22, availability_status: 'in_stock', is_visible: true, confidence_score: 88, ships_now: ships('fedco-trees'), pickup_only: pickupOnly('fedco-trees') },
      { supplier_id: sId('raintree-nursery'), supplier_raw_name: sName('raintree-nursery'), plant_id: pId('Sweet Cherry'), cultivar_id: cId('Stella'), rootstock_id: rId('Gisela 6'), listing_type: 'tree', normalized_title: 'Stella Self-Fertile Cherry on Gisela 6', price_amount: 42, availability_status: 'in_stock', is_visible: true, confidence_score: 91, ships_now: ships('raintree-nursery'), pickup_only: pickupOnly('raintree-nursery') },
      { supplier_id: sId('fedco-trees'), supplier_raw_name: sName('fedco-trees'), plant_id: pId('Pear'), rootstock_id: rId('OHxF 97'), listing_type: 'tree', normalized_title: 'Pear Tree on OHxF 97 Rootstock', price_amount: 28, availability_status: 'in_stock', is_visible: true, confidence_score: 87, ships_now: ships('fedco-trees'), pickup_only: pickupOnly('fedco-trees') },
      { supplier_id: sId('burnt-ridge'), supplier_raw_name: sName('burnt-ridge'), plant_id: pId('English Walnut'), listing_type: 'tree', normalized_title: 'English Walnut Bare Root Tree', price_amount: 20, availability_status: 'in_stock', is_visible: true, confidence_score: 85, ships_now: ships('burnt-ridge'), pickup_only: pickupOnly('burnt-ridge') },
      { supplier_id: sId('one-green-world'), supplier_raw_name: sName('one-green-world'), plant_id: pId('Fig'), cultivar_id: cId('Brown Turkey'), listing_type: 'tree', normalized_title: 'Brown Turkey Fig Ships Nationwide', price_amount: 22, availability_status: 'in_stock', is_visible: true, confidence_score: 90, ships_now: ships('one-green-world'), pickup_only: pickupOnly('one-green-world') },
      { supplier_id: sId('raintree-nursery'), supplier_raw_name: sName('raintree-nursery'), plant_id: pId('Highbush Blueberry'), listing_type: 'plant', normalized_title: 'Highbush Blueberry Mixed Varieties', price_amount: 12, availability_status: 'in_stock', is_visible: true, confidence_score: 88, ships_now: ships('raintree-nursery'), pickup_only: pickupOnly('raintree-nursery') },
      { supplier_id: sId('trees-of-antiquity'), supplier_raw_name: sName('trees-of-antiquity'), plant_id: pId('Apple'), listing_type: 'scion', normalized_title: 'Heirloom Apple Scionwood Ships Nationwide', price_amount: 6, availability_status: 'seasonal', is_visible: true, confidence_score: 80, ships_now: ships('trees-of-antiquity'), pickup_only: pickupOnly('trees-of-antiquity') },
      { supplier_id: sId('maple-valley-orchards'), supplier_raw_name: sName('maple-valley-orchards'), plant_id: pId('Apple'), listing_type: 'tree', normalized_title: 'Local Apple Tree Pacific Northwest', price_amount: 28, availability_status: 'in_stock', is_visible: true, confidence_score: 82, ships_now: ships('maple-valley-orchards'), pickup_only: pickupOnly('maple-valley-orchards') },
    ]);
    if (listingError) throw listingError;
  }

  console.log('Seeding zip zones...');
  const { count: zipCount } = await supabase.from('zip_zones').select('*', { count: 'exact', head: true });
  if (!zipCount || zipCount === 0) {
    const { error: zipError } = await supabase.from('zip_zones').insert([
      { zip_code: '97201', state: 'OR', zone: 8, lat: 45.52, lng: -122.68 },
      { zip_code: '10001', state: 'NY', zone: 7, lat: 40.75, lng: -73.99 },
      { zip_code: '60601', state: 'IL', zone: 6, lat: 41.88, lng: -87.63 },
      { zip_code: '30301', state: 'GA', zone: 8, lat: 33.75, lng: -84.39 },
      { zip_code: '98101', state: 'WA', zone: 8, lat: 47.61, lng: -122.33 },
      { zip_code: '02101', state: 'MA', zone: 6, lat: 42.36, lng: -71.06 },
      { zip_code: '37201', state: 'TN', zone: 7, lat: 36.17, lng: -86.78 },
      { zip_code: '47401', state: 'IN', zone: 6, lat: 39.16, lng: -86.53 },
      { zip_code: '04401', state: 'ME', zone: 5, lat: 44.80, lng: -68.78 },
      { zip_code: '93401', state: 'CA', zone: 9, lat: 35.28, lng: -120.66 },
      { zip_code: '75201', state: 'TX', zone: 8, lat: 32.79, lng: -96.80 },
      { zip_code: '85001', state: 'AZ', zone: 10, lat: 33.45, lng: -112.07 },
      { zip_code: '55401', state: 'MN', zone: 4, lat: 44.98, lng: -93.27 },
      { zip_code: '80201', state: 'CO', zone: 5, lat: 39.74, lng: -104.98 },
      { zip_code: '43201', state: 'OH', zone: 6, lat: 39.99, lng: -82.99 },
      { zip_code: '23201', state: 'VA', zone: 7, lat: 37.54, lng: -77.44 },
      { zip_code: '66101', state: 'KS', zone: 6, lat: 39.12, lng: -94.63 },
      { zip_code: '28201', state: 'NC', zone: 7, lat: 35.23, lng: -80.84 },
      { zip_code: '14201', state: 'NY', zone: 6, lat: 42.90, lng: -78.85 },
      { zip_code: '53201', state: 'WI', zone: 5, lat: 43.04, lng: -87.91 },
    ]);
    if (zipError) throw zipError;
  }

  console.log('✅ Seed complete!');
}

seed().catch(console.error);
