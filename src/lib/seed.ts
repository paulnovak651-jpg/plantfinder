import { getDb, initializeDb } from './db';

export function seedDatabase() {
  const db = initializeDb();

  // Check if already seeded
  const count = db.prepare('SELECT COUNT(*) as c FROM plants').get() as any;
  if (count.c > 0) return;

  // Seed plants
  const insertPlant = db.prepare(`
    INSERT INTO plants (botanical_name, common_name, common_aliases, plant_group, edible, zone_min, zone_max, sun, soil_moisture, use_tags, pollination_notes, chill_hours_min, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const plants = [
    ['Asimina triloba', 'Pawpaw', '["American Pawpaw","Indiana Banana"]', 'tree', 1, 5, 9, '["full_sun","part_shade"]', '["moist"]', '["edible","native","food_forest"]', 'Requires cross-pollination from genetically different tree', 400, 'Largest edible fruit native to North America. Tropical-tasting fruit.'],
    ['Sambucus canadensis', 'American Elderberry', '["Elderberry","Common Elderberry"]', 'shrub', 1, 3, 9, '["full_sun","part_shade"]', '["moist","wet_tolerant"]', '["edible","pollinator","native","hedge"]', 'Plant 2+ cultivars for best yields', 500, 'Fast-growing native shrub. Berries for syrup, wine, medicine.'],
    ['Castanea dentata x mollissima', 'Blight-Resistant Chestnut', '["American-Chinese Chestnut Hybrid"]', 'tree', 1, 4, 8, '["full_sun"]', '["average","moist"]', '["edible","native","timber","food_forest"]', 'Requires cross-pollination. Plant 2+ trees.', 400, 'Hybrid chestnuts bred for blight resistance.'],
    ['Diospyros virginiana', 'American Persimmon', '["Common Persimmon","Eastern Persimmon"]', 'tree', 1, 4, 9, '["full_sun","part_shade"]', '["average","moist","dry"]', '["edible","native","food_forest","wildlife"]', 'Most cultivars need male pollinator tree', 200, 'Extremely hardy native fruit tree.'],
    ['Malus domestica', 'Apple', '["Common Apple"]', 'tree', 1, 3, 8, '["full_sun"]', '["average","moist"]', '["edible","food_forest"]', 'Requires cross-pollination from different cultivar', 800, 'The most widely grown temperate fruit tree.'],
    ['Pyrus communis', 'European Pear', '["Common Pear"]', 'tree', 1, 4, 8, '["full_sun"]', '["average","moist"]', '["edible","food_forest"]', 'Most cultivars need cross-pollination', 600, 'Classic pear species.'],
    ['Ribes nigrum', 'Black Currant', '["Blackcurrant","Cassis"]', 'shrub', 1, 3, 7, '["full_sun","part_shade"]', '["moist"]', '["edible","food_forest","hedge"]', 'Most modern cultivars are self-fertile', 800, 'Extremely nutritious berries. Cold-hardy.'],
    ['Morus alba', 'White Mulberry', '["Mulberry"]', 'tree', 1, 4, 9, '["full_sun"]', '["average","moist","dry"]', '["edible","food_forest","wildlife","fast_growing"]', 'Many cultivars are self-fertile', 400, 'Extremely productive fruit tree.'],
    ['Hippophae rhamnoides', 'Sea Buckthorn', '["Seaberry"]', 'shrub', 1, 3, 7, '["full_sun"]', '["dry","average"]', '["edible","nitrogen_fixer","hedge","erosion_control"]', 'Dioecious - need male and female plants', null, 'Nitrogen-fixing shrub with nutritious berries.'],
    ['Elaeagnus umbellata', 'Autumn Olive', '["Autumnberry"]', 'shrub', 1, 3, 8, '["full_sun","part_shade"]', '["dry","average"]', '["edible","nitrogen_fixer","wildlife","food_forest"]', 'Self-fertile but better with cross-pollination', null, 'Nitrogen-fixing shrub. Note: invasive in some regions.'],
  ];

  const insertMany = db.transaction(() => {
    for (const p of plants) {
      insertPlant.run(...p);
    }
  });
  insertMany();

  // Seed cultivars
  const insertCultivar = db.prepare(`
    INSERT INTO cultivars (plant_id, cultivar_name, aliases, self_fertile, ripening_window, disease_resistance, description)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const pawpawId = (db.prepare("SELECT id FROM plants WHERE common_name = 'Pawpaw'").get() as any).id;
  const appleId = (db.prepare("SELECT id FROM plants WHERE common_name = 'Apple'").get() as any).id;
  const elderberryId = (db.prepare("SELECT id FROM plants WHERE common_name = 'American Elderberry'").get() as any).id;
  const persimmonId = (db.prepare("SELECT id FROM plants WHERE common_name = 'American Persimmon'").get() as any).id;

  const cultivars = [
    [pawpawId, 'Susquehanna', '["Susquehanna Pawpaw"]', 0, 'Mid-September', '[]', 'Large fruit, excellent flavor.'],
    [pawpawId, 'Shenandoah', '["Shenandoah Pawpaw"]', 0, 'Mid-September', '[]', 'Reliable producer. Sweet fruit.'],
    [pawpawId, 'Peterson Pawpaw', '["Petersons Pawpaw"]', 0, 'September', '[]', 'Large fruit, very cold hardy.'],
    [appleId, 'Liberty', '["Liberty Apple"]', 0, 'Late September', '["scab_immune","fire_blight_resistant"]', 'Disease-resistant heritage apple.'],
    [appleId, 'Honeycrisp', '["Honey Crisp"]', 0, 'Late September', '[]', 'Extremely popular sweet-tart apple.'],
    [appleId, 'Enterprise', '["Enterprise Apple"]', 0, 'October', '["scab_immune","fire_blight_resistant"]', 'Disease resistant, great storage apple.'],
    [elderberryId, 'York', '["York Elderberry"]', 0, 'August-September', '[]', 'High-yielding. Excellent for syrup.'],
    [elderberryId, 'Bob Gordon', '["Bob Gordon Elderberry"]', 0, 'August', '[]', 'Very productive cultivar.'],
    [persimmonId, 'Prok', '["Prok Persimmon"]', 0, 'October', '[]', 'Large fruit, excellent flavor. Female.'],
  ];

  db.transaction(() => {
    for (const c of cultivars) {
      insertCultivar.run(...c);
    }
  })();

  // Seed rootstocks
  const insertRootstock = db.prepare(`
    INSERT INTO rootstocks (name, species, aliases, compatible_with, vigor_class, zone_min, zone_max, soil_tolerance_notes, disease_resistance, anchorage_notes, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const rootstocks = [
    ['Antonovka Seedling', 'Malus domestica', '["Antonovka"]', '["apple"]', 'standard', 3, 8, 'Very adaptable. Tolerates heavy clay.', '["crown_rot_tolerant"]', 'Excellent anchorage.', 'Classic cold-hardy seedling rootstock.'],
    ['G.935', 'Malus domestica', '["Geneva 935"]', '["apple"]', 'semi_dwarf', 4, 8, 'Prefers well-drained soil.', '["fire_blight_resistant","crown_rot_resistant"]', 'Good anchorage.', 'Geneva series semi-dwarf. ~80% standard size.'],
    ['G.210', 'Malus domestica', '["Geneva 210"]', '["apple"]', 'semi_dwarf', 4, 8, 'Well-drained soils preferred.', '["fire_blight_resistant","crown_rot_resistant"]', 'Better than M.26.', 'Newer Geneva rootstock. Very productive.'],
    ['M.111', 'Malus domestica', '["EMLA 111","Malling 111"]', '["apple"]', 'semi_standard', 4, 8, 'Drought tolerant.', '["woolly_apple_aphid_resistant"]', 'Excellent anchorage.', 'Widely used semi-standard rootstock.'],
    ['OHxF 87', 'Pyrus communis', '["Old Home x Farmingdale 87"]', '["pear"]', 'semi_standard', 4, 8, 'Adaptable.', '["fire_blight_resistant"]', 'Good anchorage.', 'Standard fire-blight resistant pear rootstock.'],
    ['OHxF 333', 'Pyrus communis', '["Old Home x Farmingdale 333"]', '["pear"]', 'semi_dwarf', 4, 8, 'Prefers well-drained.', '["fire_blight_resistant"]', 'May need support.', 'Dwarfing pear rootstock.'],
    ['Dunstan Chestnut Seedling', 'Castanea', '["Dunstan"]', '["chestnut"]', 'standard', 5, 9, 'Well-drained acidic soil.', '["blight_resistant"]', 'Deep taproot.', 'Blight-resistant chestnut rootstock.'],
  ];

  db.transaction(() => {
    for (const r of rootstocks) {
      insertRootstock.run(...r);
    }
  })();

  // Seed suppliers
  const insertSupplier = db.prepare(`
    INSERT INTO suppliers (name, slug, website_url, city, state, lat, lng, retail_enabled, wholesale_enabled, pickup_available, bio)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const suppliers = [
    ['Rolling River Nursery', 'rolling-river-nursery', 'https://rollingrivernursery.com', 'Oregon City', 'OR', 45.3573, -122.6068, 1, 0, 0, 'Specializing in unusual edible plants for the Pacific Northwest.'],
    ['Burnt Ridge Nursery', 'burnt-ridge-nursery', 'https://burntridgenursery.com', 'Onalaska', 'WA', 46.5354, -122.6682, 1, 1, 1, 'Wide selection of fruit and nut trees, berries, and native plants.'],
    ['Raintree Nursery', 'raintree-nursery', 'https://raintreenursery.com', 'Morton', 'WA', 46.5567, -122.2751, 1, 0, 0, 'Edible plants for the home gardener. Trees, berries, and more.'],
    ['Fedco Trees', 'fedco-trees', 'https://fedcoseeds.com/trees', 'Clinton', 'ME', 44.6364, -69.5006, 1, 0, 1, 'Worker-owned cooperative. Cold-hardy fruit trees and rootstock.'],
    ['Cummins Nursery', 'cummins-nursery', 'https://cumminsnursery.com', 'Ithaca', 'NY', 42.4440, -76.5019, 1, 1, 1, 'Specializing in disease-resistant apple trees and Geneva rootstocks.'],
    ['Stark Bro\'s Nursery', 'stark-bros', 'https://starkbros.com', 'Louisiana', 'MO', 39.4489, -91.0513, 1, 0, 0, 'America\'s oldest nursery. Fruit trees since 1816.'],
    ['Nolin River Nut Tree Nursery', 'nolin-river', 'https://nolinriver.com', 'Upton', 'KY', 37.4809, -85.8952, 1, 0, 0, 'Specializing in grafted nut trees — chestnut, walnut, pecan.'],
    ['St. Lawrence Nurseries', 'st-lawrence-nurseries', 'https://stlawrencenurseries.com', 'Potsdam', 'NY', 44.6697, -74.9816, 1, 0, 1, 'Ultra-cold-hardy fruit and nut trees for northern climates.'],
    ['Midwest Scionwood Co-op', 'midwest-scionwood', null, 'Madison', 'WI', 43.0731, -89.4012, 1, 0, 0, 'Community scionwood exchange. Wide selection of heritage varieties.'],
    ['Hidden Springs Nursery', 'hidden-springs', 'https://hiddenspringsnursery.com', 'Cookeville', 'TN', 36.1628, -85.5016, 1, 0, 0, 'Edible and useful plants for permaculture and homesteading.'],
  ];

  db.transaction(() => {
    for (const s of suppliers) {
      insertSupplier.run(...s);
    }
  })();

  // Seed supplier listings
  const insertListing = db.prepare(`
    INSERT INTO supplier_listings (supplier_id, listing_type, plant_id, cultivar_id, rootstock_id, supplier_raw_name, normalized_title, size_raw, price_amount, availability_status, qty_bucket, seasonal_window_start, seasonal_window_end, ships_now, listing_notes, inventory_source, last_inventory_update, confidence_score, confidence_band)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, ?)
  `);

  // Get IDs
  const getSupplier = (slug: string) => (db.prepare("SELECT id FROM suppliers WHERE slug = ?").get(slug) as any)?.id;
  const getCultivar = (name: string) => (db.prepare("SELECT id FROM cultivars WHERE cultivar_name = ?").get(name) as any)?.id;
  const getRootstock = (name: string) => (db.prepare("SELECT id FROM rootstocks WHERE name = ?").get(name) as any)?.id;

  const listings = [
    // Rolling River - Pawpaws
    [getSupplier('rolling-river-nursery'), 'cultivar_plant', pawpawId, getCultivar('Susquehanna'), null, "Pawpaw 'Susquehanna' grafted", 'Susquehanna Pawpaw - Grafted', '#3 pot, 2-3 ft', 45.00, 'in_stock', '6_25', null, null, 1, 'Grafted on seedling rootstock.', 'csv', 0.85, 'high'],
    [getSupplier('rolling-river-nursery'), 'cultivar_plant', pawpawId, getCultivar('Shenandoah'), null, "Pawpaw 'Shenandoah' grafted", 'Shenandoah Pawpaw - Grafted', '#3 pot, 2-3 ft', 45.00, 'limited', '1_5', null, null, 1, 'Grafted on seedling rootstock.', 'csv', 0.85, 'high'],

    // Burnt Ridge - Mixed
    [getSupplier('burnt-ridge-nursery'), 'cultivar_plant', elderberryId, getCultivar('York'), null, "York Elderberry", 'York Elderberry', '#1 pot', 12.00, 'in_stock', '26_100', null, null, 1, 'Rooted cutting.', 'portal', 0.92, 'high'],
    [getSupplier('burnt-ridge-nursery'), 'cultivar_plant', appleId, getCultivar('Liberty'), null, "Liberty Apple on G.935", 'Liberty Apple on G.935', 'bare root 5/8 cal', 38.00, 'preorder', null, '2026-11-01', '2027-03-15', 0, 'Ships dormant season.', 'portal', 0.90, 'high'],

    // Cummins - Rootstocks
    [getSupplier('cummins-nursery'), 'rootstock', null, null, getRootstock('G.935'), "G.935 rootstock 9mm", 'G.935 Rootstock', '9mm bare root', 6.00, 'in_stock', '26_100', '2026-11-01', '2027-04-01', 0, 'Tissue culture. Min order 10.', 'portal', 0.95, 'high'],
    [getSupplier('cummins-nursery'), 'rootstock', null, null, getRootstock('G.210'), "G.210 rootstock 9mm", 'G.210 Rootstock', '9mm bare root', 6.50, 'limited', '6_25', '2026-11-01', '2027-04-01', 0, 'Tissue culture. Min order 10.', 'portal', 0.95, 'high'],
    [getSupplier('cummins-nursery'), 'rootstock', null, null, getRootstock('Antonovka Seedling'), "Antonovka seedling rootstock", 'Antonovka Seedling Rootstock', '3/8 cal bare root', 4.50, 'in_stock', 'gt_100', '2026-11-01', '2027-04-01', 0, 'Grade A seedling.', 'portal', 0.95, 'high'],

    // Fedco - Scionwood + trees
    [getSupplier('fedco-trees'), 'scionwood', appleId, getCultivar('Liberty'), null, "Liberty apple scionwood", 'Liberty Apple Scionwood', '10-12 in sticks', 4.00, 'seasonal', '26_100', '2027-01-15', '2027-03-01', 0, '1-year wood. Min 3 sticks.', 'manual', 0.70, 'medium'],
    [getSupplier('fedco-trees'), 'scionwood', appleId, getCultivar('Honeycrisp'), null, "Honeycrisp apple scionwood", 'Honeycrisp Apple Scionwood', '10-12 in sticks', 5.00, 'seasonal', '6_25', '2027-01-15', '2027-03-01', 0, '1-year wood. Min 3 sticks.', 'manual', 0.70, 'medium'],
    [getSupplier('fedco-trees'), 'cultivar_plant', persimmonId, getCultivar('Prok'), null, "Prok American Persimmon", 'Prok American Persimmon', 'bare root 3-4 ft', 35.00, 'preorder', null, '2026-11-15', '2027-03-15', 0, 'Female. Needs pollinator.', 'manual', 0.70, 'medium'],

    // Stark Bros
    [getSupplier('stark-bros'), 'cultivar_plant', appleId, getCultivar('Honeycrisp'), null, "Honeycrisp Apple Tree", 'Honeycrisp Apple', 'bare root 4-5 ft', 42.00, 'in_stock', null, null, null, 1, 'On M.111 rootstock.', 'scrape', 0.55, 'medium'],

    // Midwest Scionwood
    [getSupplier('midwest-scionwood'), 'scionwood', pawpawId, getCultivar('Susquehanna'), null, "Pawpaw scion - Susquehanna", 'Susquehanna Pawpaw Scionwood', '10-12 in sticks', 5.00, 'seasonal', '26_100', '2027-01-15', '2027-03-01', 0, 'Dormant season only.', 'portal', 0.80, 'high'],
    [getSupplier('midwest-scionwood'), 'scionwood', pawpawId, getCultivar('Shenandoah'), null, "Pawpaw scion - Shenandoah", 'Shenandoah Pawpaw Scionwood', '10-12 in sticks', 5.00, 'seasonal', '26_100', '2027-01-15', '2027-03-01', 0, 'Dormant season only.', 'portal', 0.80, 'high'],

    // Nolin River - Chestnuts
    [getSupplier('nolin-river'), 'plant', (db.prepare("SELECT id FROM plants WHERE common_name = 'Blight-Resistant Chestnut'").get() as any).id, null, null, "Dunstan Chestnut seedling", 'Dunstan Chestnut Seedling', 'bare root 3-4 ft', 28.00, 'preorder', null, '2026-12-01', '2027-03-15', 0, 'Blight resistant.', 'manual', 0.65, 'medium'],

    // Hidden Springs - Permaculture
    [getSupplier('hidden-springs'), 'plant', (db.prepare("SELECT id FROM plants WHERE common_name = 'Sea Buckthorn'").get() as any).id, null, null, "Sea Buckthorn female", 'Sea Buckthorn (Female)', '#2 pot', 22.00, 'in_stock', '6_25', null, null, 1, 'Female. Need male for fruit.', 'manual', 0.70, 'medium'],
    [getSupplier('hidden-springs'), 'plant', (db.prepare("SELECT id FROM plants WHERE common_name = 'Black Currant'").get() as any).id, null, null, "Titania Black Currant", 'Titania Black Currant', '#1 pot', 15.00, 'limited', '1_5', null, null, 1, 'Excellent disease resistance.', 'manual', 0.70, 'medium'],

    // St Lawrence - Cold hardy
    [getSupplier('st-lawrence-nurseries'), 'cultivar_plant', appleId, getCultivar('Liberty'), null, "Liberty Apple bare root", 'Liberty Apple', 'bare root whip 4-5 ft', 32.00, 'preorder', null, '2027-04-01', '2027-05-15', 0, 'On Antonovka rootstock. Spring ship only.', 'csv', 0.80, 'high'],

    // OHxF rootstocks at Cummins
    [getSupplier('cummins-nursery'), 'rootstock', null, null, getRootstock('OHxF 87'), "OHxF 87 pear rootstock", 'OHxF 87 Pear Rootstock', '3/8-1/2 cal bare root', 5.00, 'in_stock', 'gt_100', '2026-11-01', '2027-04-01', 0, 'Standard pear rootstock.', 'portal', 0.95, 'high'],
  ];

  db.transaction(() => {
    for (const l of listings) {
      insertListing.run(...l);
    }
  })();

  // Seed some zip zones (major cities for demo)
  const insertZip = db.prepare(`
    INSERT OR IGNORE INTO zip_zones (zip_code, zone, zone_number, lat, lng, city, state)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const zips = [
    ['55401', '4b', 4.5, 44.9778, -93.2650, 'Minneapolis', 'MN'],
    ['55101', '4b', 4.5, 44.9537, -93.0900, 'St Paul', 'MN'],
    ['53703', '5a', 5.0, 43.0731, -89.4012, 'Madison', 'WI'],
    ['60601', '5b', 5.5, 41.8819, -87.6278, 'Chicago', 'IL'],
    ['48201', '6a', 6.0, 42.3314, -83.0458, 'Detroit', 'MI'],
    ['10001', '7a', 7.0, 40.7484, -73.9967, 'New York', 'NY'],
    ['97201', '8b', 8.5, 45.5152, -122.6784, 'Portland', 'OR'],
    ['98101', '8b', 8.5, 47.6062, -122.3321, 'Seattle', 'WA'],
    ['04101', '5b', 5.5, 43.6591, -70.2568, 'Portland', 'ME'],
    ['14850', '5b', 5.5, 42.4440, -76.5019, 'Ithaca', 'NY'],
    ['40601', '6b', 6.5, 38.1970, -84.8631, 'Frankfort', 'KY'],
    ['37201', '7a', 7.0, 36.1627, -86.7816, 'Nashville', 'TN'],
    ['63101', '6a', 6.0, 38.6270, -90.1994, 'St Louis', 'MO'],
    ['50309', '5a', 5.0, 41.5868, -93.6250, 'Des Moines', 'IA'],
    ['43215', '6a', 6.0, 39.9612, -82.9988, 'Columbus', 'OH'],
    ['15213', '6b', 6.5, 40.4406, -79.9959, 'Pittsburgh', 'PA'],
    ['05401', '4b', 4.5, 44.4759, -73.2121, 'Burlington', 'VT'],
    ['03101', '5b', 5.5, 42.9956, -71.4548, 'Manchester', 'NH'],
    ['30301', '7b', 7.5, 33.7490, -84.3880, 'Atlanta', 'GA'],
    ['78701', '8b', 8.5, 30.2672, -97.7431, 'Austin', 'TX'],
  ];

  db.transaction(() => {
    for (const z of zips) {
      insertZip.run(...z);
    }
  })();

  console.log('Database seeded successfully!');
}
