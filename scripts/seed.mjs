// Seeds the Go backend with a demo seller, categories, and products.
// Usage: node scripts/seed.mjs [apiBase]
const API = process.argv[2] ?? "http://localhost:9000";

const SELLER = { email: "seller@verso.shop", password: "verso123", phone: "+84969650661" };

const CATEGORIES = ["Lighting", "Seating", "Tableware", "Textiles", "Stationery"];

const PRODUCTS = [
  { name: "Meridian Table Lamp", cat: "Lighting", price: 148, stock: 12, description: "A pleated cotton shade over a turned ash base. Warm 2700K bulb included. Designed to sit slightly off-centre on a desk, as all good lamps do." },
  { name: "Gnomon Floor Lamp", cat: "Lighting", price: 320, stock: 5, description: "Counterweighted steel arm, brass pivot, paper shade. Casts a reading circle precisely one armchair wide." },
  { name: "Candela Wall Sconce", cat: "Lighting", price: 96, stock: 20, description: "Vermillion-enamelled steel, hardwired or plug-in. Throws light upward like a theatre footlight in reverse." },
  { name: "Recto Reading Chair", cat: "Seating", price: 680, stock: 4, description: "Beech frame, flax upholstery, a back angle argued over for eleven prototypes. For books, not laptops." },
  { name: "Folio Stacking Stool", cat: "Seating", price: 120, stock: 30, description: "Three legs, one wedge joint, no hardware. Stacks seven high; lives best in pairs." },
  { name: "Margin Bench", cat: "Seating", price: 410, stock: 6, description: "A hall bench the width of two people and one umbrella. Oiled oak with visible joinery." },
  { name: "Quarto Dinner Plates, Set of 4", cat: "Tableware", price: 88, stock: 25, description: "Stoneware in broken-white glaze with an ink rim. Each plate is numbered on the foot like a print edition." },
  { name: "Bodoni Carafe", cat: "Tableware", price: 64, stock: 18, description: "Mouth-blown glass with a deliberate weight at the base. Pours without dripping, a rarer feat than it sounds." },
  { name: "Pica Espresso Cups, Pair", cat: "Tableware", price: 42, stock: 40, description: "Two cups, two saucers, 90ml each. Glazed moss-green inside, raw clay outside." },
  { name: "Colophon Throw Blanket", cat: "Textiles", price: 156, stock: 14, description: "Undyed lambswool with a single vermillion selvedge stripe. Woven in a mill that still answers its telephone." },
  { name: "Deckle Linen Cushion", cat: "Textiles", price: 58, stock: 22, description: "Heavy Belgian linen, feather insert, brass zip. The cover softens; the opinions it supports do not." },
  { name: "Verso Field Notebook, Set of 3", cat: "Stationery", price: 24, stock: 100, description: "90gsm paper, sewn spine, numbered pages. Grid, ruled, and blank — one of each." },
  { name: "Compositor Fountain Pen", cat: "Stationery", price: 75, stock: 35, description: "Brushed brass barrel, steel medium nib. Develops a patina that records exactly how much you write." },
  { name: "Imprimatur Desk Tray", cat: "Stationery", price: 52, stock: 16, description: "Powder-coated steel in ink black. Two compartments: urgent, and pretending-not-to-be." },
];

async function req(method, path, body, token, expectOk = true) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok && expectOk) {
    throw new Error(`${method} ${path} → ${res.status}: ${json.error ?? JSON.stringify(json)}`);
  }
  return { status: res.status, json };
}

async function main() {
  // 1. Login or register the demo seller
  let token;
  const login = await req("POST", "/user/login", { email: SELLER.email, password: SELLER.password }, null, false);
  if (login.status === 200) {
    token = login.json.data.access_token;
    console.log("✓ logged in as existing demo seller");
  } else {
    const reg = await req("POST", "/user/register", SELLER);
    token = reg.json.data.access_token;
    console.log("✓ registered demo seller", SELLER.email);
  }

  // 2. Upgrade to seller (idempotent-ish: ignore failure if already seller)
  const up = await req("POST", "/user/me/become-seller", null, token, false);
  console.log(up.status < 300 ? "✓ upgraded to seller" : `· become-seller: ${up.json.error ?? up.status}`);

  // 3. Categories (skip ones that already exist by name)
  const existing = await req("GET", "/categories");
  const byName = new Map((existing.json.data ?? []).map((c) => [c.name, c.id]));
  for (const name of CATEGORIES) {
    if (byName.has(name)) continue;
    const r = await req("POST", "/seller/category", { name }, token);
    byName.set(name, r.json.data.id);
    console.log(`✓ category: ${name} (#${r.json.data.id})`);
  }

  // 4. Products (skip if this seller already has products)
  const mine = await req("GET", "/seller/products?limit=1", null, token);
  if ((mine.json.meta?.total ?? 0) > 0) {
    console.log(`· seller already has ${mine.json.meta.total} products — skipping product seed`);
    return;
  }
  for (const p of PRODUCTS) {
    const r = await req(
      "POST",
      "/seller/product",
      { name: p.name, description: p.description, price: p.price, stock: p.stock, category_id: byName.get(p.cat) },
      token,
    );
    console.log(`✓ product: ${p.name} (#${r.json.data.id})`);
  }
  console.log("\nSeed complete.");
}

main().catch((e) => {
  console.error("✗", e.message);
  process.exit(1);
});
