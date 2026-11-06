export type WineCatalogResult = {
  name: string;
  producer: string;
  countryName: string;
  countryIso2: string;
  wineType: string;
  region: string;
  grapes: string[];
  imageUrl: string;
  sources: string[];
};

type AnyRecord = Record<string, unknown>;

const COUNTRY_ALIASES: Record<string, string> = {
  argentina: 'AR', australia: 'AU', brazil: 'BR', brasil: 'BR',
  chile: 'CL', spain: 'ES', espana: 'ES', españa: 'ES',
  france: 'FR', italy: 'IT', portugal: 'PT', 'united states': 'US',
  usa: 'US', uruguay: 'UY', 'south africa': 'ZA', germany: 'DE',
  'new zealand': 'NZ', mexico: 'MX',
};

function asRecord(value: unknown): AnyRecord {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as AnyRecord : {};
}

function asText(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.map(asText).filter(Boolean).join(', ');
  return '';
}

function firstText(...values: unknown[]): string {
  for (const value of values) {
    const text = asText(value);
    if (text) return text;
  }
  return '';
}

function normalizeCountry(value: unknown): { name: string; iso2: string } {
  const raw = firstText(value);
  if (!raw) return { name: '', iso2: '' };
  const cleaned = raw.replace(/^en:/, '').replace(/_/g, ' ').trim();
  const iso2 = COUNTRY_ALIASES[cleaned.toLowerCase()] || (/^[A-Z]{2}$/.test(cleaned) ? cleaned : '');
  return { name: cleaned, iso2 };
}

function normalizeWineType(...values: unknown[]): string {
  const text = values.map(asText).join(' ').toLowerCase();
  if (text.includes('rosé') || text.includes('rose')) return 'Rosé';
  if (text.includes('sparkling') || text.includes('espumante') || text.includes('champagne')) return 'Espumante';
  if (text.includes('white') || text.includes('branco')) return 'Branco';
  if (text.includes('red') || text.includes('tinto')) return 'Tinto';
  if (text.includes('orange')) return 'Laranja';
  return '';
}

function imageFrom(value: unknown): string {
  if (typeof value === 'string' && /^https?:\/\//i.test(value)) return value;
  const record = asRecord(value);
  return firstText(record.image_front_url, record.image_url, record.image, record.url);
}

function hasUsefulWineIdentity(item: AnyRecord): boolean {
  return Boolean(firstText(
    item.product_name, item.product_name_pt, item.product_name_en,
    item.name, item.product, item.title, item.display_name,
  ));
}

async function getJson(url: string, init?: RequestInit, timeoutMs = 8500): Promise<unknown> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(init?.headers || {}),
      },
    });
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } finally {
    window.clearTimeout(timeout);
  }
}

function parseProductGuru(payload: unknown): WineCatalogResult | null {
  const root = asRecord(payload);
  const item = asRecord(root.product || root.data || root.result || root);
  if (!hasUsefulWineIdentity(item)) return null;

  const country = normalizeCountry(firstText(
    item.country_of_origin, item.origin_country, item.country, item.countries,
    item.origins, item.country_name,
  ));
  const categories = firstText(item.category, item.categories, item.product_type, item.type);
  const name = firstText(item.product_name, item.name, item.product, item.title, item.display_name);
  const producer = firstText(item.brand, item.brands, item.manufacturer, item.producer);
  const grapesText = firstText(item.grapes, item.varieties, item.variety);
  return {
    name,
    producer,
    countryName: country.name,
    countryIso2: country.iso2,
    wineType: normalizeWineType(categories, name),
    region: firstText(item.region, item.appellation),
    grapes: grapesText ? grapesText.split(/[,;|]/).map(v => v.trim()).filter(Boolean) : [],
    imageUrl: imageFrom(item),
    sources: ['ProductGuru'],
  };
}

function parseOpenFoodFacts(payload: unknown): WineCatalogResult | null {
  const root = asRecord(payload);
  const status = root.status;
  // API v3 usa status textual ("success"); status numérico 1 é legado.
  const success = status === 'success' || status === 1 || status === '1';
  const product = asRecord(root.product);
  if (!success || !hasUsefulWineIdentity(product)) return null;

  const country = normalizeCountry(firstText(
    product.origins_tags, product.origins, product.countries_tags,
    product.countries, product.origin,
  ).split(',')[0]);
  const categories = `${asText(product.categories)} ${asText(product.categories_tags)}`;
  const name = firstText(product.product_name_pt, product.product_name, product.product_name_en);
  const grapesText = firstText(product.grapes, product.variety);
  return {
    name,
    producer: firstText(product.brands).split(',')[0].trim(),
    countryName: country.name,
    countryIso2: country.iso2,
    wineType: normalizeWineType(categories, name),
    region: firstText(product.origins, product.producer_location),
    grapes: grapesText ? grapesText.split(/[,;|]/).map(v => v.trim()).filter(Boolean) : [],
    imageUrl: imageFrom(product.image_front_url || product.image_url),
    sources: ['Open Food Facts'],
  };
}

async function enrichWithElid(base: WineCatalogResult): Promise<WineCatalogResult> {
  if (!base.name) return base;
  try {
    const payload = asRecord(await getJson('/api/catalog/elid/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        raw: [base.producer, base.name].filter(Boolean).join(' '),
        top_n: 3,
        ...(base.countryIso2 ? { country_code: base.countryIso2 } : {}),
        ...(base.wineType ? { drink_type: ({
          'Tinto': 'red', 'Branco': 'white', 'Rosé': 'rosé',
          'Espumante': 'sparkling', 'Laranja': 'orange',
        } as Record<string, string>)[base.wineType] || undefined } : {}),
      }),
    }, 9000));
    const matches = Array.isArray(payload.data) ? payload.data : [];
    const candidate = asRecord(matches[0]);
    const score = Number(candidate.score || 0);
    // ELID score is a ranking score, not a probability. Only use high-ranked matches
    // and only fill missing fields; never overwrite the barcode source's identity.
    if (!candidate.elid || score < 0.75) return base;

    const country = normalizeCountry(candidate.country);
    const enriched: WineCatalogResult = {
      ...base,
      name: base.name || firstText(candidate.display_name, candidate.wine),
      producer: base.producer || firstText(candidate.producer_name),
      countryName: base.countryName || country.name,
      countryIso2: base.countryIso2 || country.iso2,
      wineType: base.wineType || normalizeWineType(candidate.colour, candidate.type, candidate.sub_type),
      region: base.region || firstText(candidate.region, candidate.sub_region, candidate.designation),
      sources: [...base.sources, 'ELID.wine'],
    };

    // ELID's wine endpoint can supply structured facts. It is a wine identity source,
    // not an image catalog; preserve any existing image URL.
    const detailPayload = asRecord(await getJson(
      `/api/catalog/elid/wines/${encodeURIComponent(String(candidate.elid))}`,
      undefined, 9000,
    ));
    const detail = asRecord(detailPayload.data);
    const facts = Array.isArray(detail.facts) ? asRecord(detail.facts[0]) : {};
    const variety = firstText(facts.variety_blend, detail.variety_code);
    if (!enriched.grapes.length && variety) {
      enriched.grapes = variety.split(/[,;|]/).map(v => v.trim()).filter(Boolean);
    }
    return enriched;
  } catch {
    // Enrichment is optional. A failure must not discard a valid barcode match.
    return base;
  }
}

/**
 * Barcode resolution order:
 * 1) caller checks the user's own Supabase catalog before calling this module.
 * 2) ProductGuru EAN lookup.
 * 3) Open Food Facts v3 EAN lookup.
 * 4) ELID wine identity enrichment by name, only after an EAN source identifies a wine.
 *
 * ProductGuru's general barcode endpoint is an additional candidate source; its
 * response schema and browser CORS behavior are treated defensively because its
 * public product endpoint is less fully documented than its recall API.
 */
export async function resolveWineBarcode(code: string): Promise<WineCatalogResult | null> {
  let productGuruResult: WineCatalogResult | null = null;
  let openFoodFactsResult: WineCatalogResult | null = null;

  // Query both EAN catalogs. ProductGuru can aggregate OFF data, but it may also
  // return fields that OFF does not have; merging keeps the best available fields.
  try {
    const pgPayload = await getJson(
      `/api/catalog/productguru/${encodeURIComponent(code)}.json`,
      undefined,
      8000,
    );
    productGuruResult = parseProductGuru(pgPayload);
  } catch {
    // Continue to Open Food Facts if ProductGuru is unavailable.
  }

  try {
    const fields = [
      'code','product_name','product_name_pt','product_name_en','brands',
      'origins','origins_tags','countries','countries_tags','image_front_url',
      'image_url','categories','categories_tags','quantity','alcohol_value',
      'grapes','producer_location',
    ].join(',');
    const offPayload = await getJson(
      `/api/catalog/off/api/v3/product/${encodeURIComponent(code)}.json?fields=${encodeURIComponent(fields)}`,
      undefined,
      9000,
    );
    openFoodFactsResult = parseOpenFoodFacts(offPayload);
  } catch {
    // If OFF is unavailable, a ProductGuru result may still be useful.
  }

  if (!productGuruResult && !openFoodFactsResult) return null;
  if (productGuruResult && !openFoodFactsResult) return enrichWithElid(productGuruResult);
  if (!productGuruResult && openFoodFactsResult) return enrichWithElid(openFoodFactsResult);

  const pg = productGuruResult!;
  const off = openFoodFactsResult!;
  const merged: WineCatalogResult = {
    name: pg.name || off.name,
    producer: pg.producer || off.producer,
    countryName: pg.countryName || off.countryName,
    countryIso2: pg.countryIso2 || off.countryIso2,
    wineType: pg.wineType || off.wineType,
    region: pg.region || off.region,
    grapes: pg.grapes.length ? pg.grapes : off.grapes,
    imageUrl: pg.imageUrl || off.imageUrl,
    sources: [...pg.sources, ...off.sources],
  };
  return enrichWithElid(merged);
}
