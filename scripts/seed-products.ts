// scripts/seed-products.ts
// Seed script to populate database with sample products

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import type { Category, MetalFinish, Product } from "../lib/products-types";

// Initialize Firebase Admin directly (bypass server-only restriction)
let db: any = null;

try {
  if (getApps().length === 0) {
    const svcJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    const svcPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    
    if (svcJson) {
      try {
        const parsed = JSON.parse(svcJson);
        initializeApp({
          credential: cert(parsed),
        });
        console.log("✅ Firebase Admin initialized with FIREBASE_SERVICE_ACCOUNT_JSON");
      } catch (parseError) {
        console.error("❌ Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:", parseError);
        throw parseError;
      }
    } else if (svcPath) {
      // Try to use service account file path
      const fs = require("fs");
      const path = require("path");
      const serviceAccountPath = path.resolve(process.cwd(), svcPath);
      if (fs.existsSync(serviceAccountPath)) {
        const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
        initializeApp({
          credential: cert(serviceAccount),
        });
        console.log("✅ Firebase Admin initialized with GOOGLE_APPLICATION_CREDENTIALS");
      } else {
        throw new Error(`Service account file not found: ${serviceAccountPath}`);
      }
    } else {
      // Try to load from secrets folder (common local dev setup)
      const fs = require("fs");
      const path = require("path");
      const secretsPath = path.resolve(process.cwd(), "secrets/serviceAccountKey.json");
      if (fs.existsSync(secretsPath)) {
        const serviceAccount = JSON.parse(fs.readFileSync(secretsPath, "utf8"));
        initializeApp({
          credential: cert(serviceAccount),
        });
        console.log("✅ Firebase Admin initialized with secrets/serviceAccountKey.json");
      } else {
        // Try default initialization (uses ADC or env vars)
        initializeApp();
        console.log("✅ Firebase Admin initialized with default credentials");
      }
    }
  } else {
    console.log("✅ Using existing Firebase Admin app");
  }
  db = getFirestore();
  console.log("✅ Firestore initialized\n");
} catch (error: any) {
  console.error("❌ Failed to initialize Firebase Admin:", error.message);
  console.error("\n💡 Make sure you have one of the following set:");
  console.error("   1. FIREBASE_SERVICE_ACCOUNT_JSON environment variable");
  console.error("   2. GOOGLE_APPLICATION_CREDENTIALS pointing to service account file");
  console.error("   3. Default application credentials configured\n");
  process.exit(1);
}

// Direct Firestore product creation (bypassing server-only wrapper)
async function createProductDirect(product: any): Promise<any> {
  if (!db) {
    throw new Error("Firestore not initialized");
  }

  // Check if slug already exists
  const existingSnapshot = await db
    .collection("products")
    .where("slug", "==", product.slug)
    .limit(1)
    .get();

  if (!existingSnapshot.empty) {
    throw new Error("Product with this slug already exists");
  }

  // Generate product_id if not provided
  let productId = product.product_id;
  if (!productId) {
    const allProductsSnapshot = await db.collection("products").get();
    const existingIds = allProductsSnapshot.docs.map((doc: any) => {
      const match = doc.id.match(/va-(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    });
    const nextId = Math.max(0, ...existingIds) + 1;
    productId = `va-${String(nextId).padStart(2, "0")}`;
  }

  // Generate SKU if not provided
  let sku = product.sku;
  if (!sku) {
    const allProductsSnapshot = await db.collection("products").get();
    const categoryPrefix = product.category.substring(0, 3).toUpperCase();
    const existingSKUs = allProductsSnapshot.docs
      .filter((doc: any) => doc.data().category === product.category)
      .map((doc: any) => {
        const docSku = doc.data().sku || "";
        const match = docSku.match(new RegExp(`${categoryPrefix}-(\\d+)`));
        return match ? parseInt(match[1], 10) : 0;
      });
    const nextNum = Math.max(0, ...existingSKUs) + 1;
    sku = `VA-${categoryPrefix}-${String(nextNum).padStart(3, "0")}`;
  }

  const productData = {
    ...product,
    product_id: productId,
    sku: sku,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await db.collection("products").doc(productId).set(productData);

  return { ...product, product_id: productId, sku };
}

// Helper function to generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Sample product data - 50+ products across all categories
const sampleProducts: Omit<Product, "product_id" | "sku">[] = [
  // ========== RINGS (15 products) ==========
  {
    title: "Classic Gold Solitaire Ring",
    category: "rings" as Category,
    price: 1299,
    cost_price: 650,
    stock_qty: 30,
    weight: 3.5,
    metal_finish: "gold" as MetalFinish,
    images: ["/images/ring-1.jpg"],
    description: "Timeless solitaire ring in anti-tarnish gold plating. Perfect for everyday wear. Hypoallergenic and tarnish-resistant. Care instructions: Clean with soft cloth, avoid contact with perfumes and chemicals.",
    short_description: "Timeless gold solitaire ring with anti-tarnish coating.",
    tags: ["ring", "gold", "solitaire", "classic", "everyday"],
    dimensions: { length: 2, width: 2, height: 0.5 },
    shipping_class: "standard",
    slug: "classic-gold-solitaire-ring",
    is_new: true,
    size_options: ["6", "7", "8", "9", "10"],
  },
  {
    title: "Rose Gold Vintage Band",
    category: "rings" as Category,
    price: 999,
    cost_price: 500,
    stock_qty: 25,
    weight: 2.8,
    metal_finish: "rose-gold" as MetalFinish,
    images: ["/images/ring-1.jpg"],
    description: "Elegant vintage-inspired band in rose gold finish. Comfortable fit for daily wear. Anti-tarnish protection ensures lasting shine.",
    short_description: "Vintage-inspired rose gold band ring.",
    tags: ["ring", "rose-gold", "vintage", "band"],
    dimensions: { length: 2, width: 0.3, height: 0.4 },
    shipping_class: "standard",
    slug: "rose-gold-vintage-band",
    size_options: ["6", "7", "8", "9"],
  },
  {
    title: "Silver Minimalist Ring",
    category: "rings" as Category,
    price: 799,
    cost_price: 400,
    stock_qty: 40,
    weight: 2.5,
    metal_finish: "silver" as MetalFinish,
    images: ["/images/ring-1.jpg"],
    description: "Sleek minimalist ring in silver finish. Perfect for stacking or wearing alone. Hypoallergenic and tarnish-resistant.",
    short_description: "Sleek minimalist silver ring.",
    tags: ["ring", "silver", "minimalist", "stackable"],
    dimensions: { length: 2, width: 0.2, height: 0.3 },
    shipping_class: "standard",
    slug: "silver-minimalist-ring",
    size_options: ["6", "7", "8", "9", "10", "11"],
  },
  {
    title: "Platinum Statement Ring",
    category: "rings" as Category,
    price: 2499,
    cost_price: 1250,
    stock_qty: 15,
    weight: 5.2,
    metal_finish: "platinum" as MetalFinish,
    images: ["/images/ring-1.jpg"],
    description: "Bold statement ring in premium platinum finish. Eye-catching design perfect for special occasions. Premium quality with anti-tarnish protection.",
    short_description: "Bold platinum statement ring.",
    tags: ["ring", "platinum", "statement", "premium"],
    dimensions: { length: 2.5, width: 1.5, height: 0.8 },
    shipping_class: "standard",
    slug: "platinum-statement-ring",
    is_new: true,
    size_options: ["7", "8", "9"],
  },
  {
    title: "Gold Twisted Band Ring",
    category: "rings" as Category,
    price: 1199,
    cost_price: 600,
    stock_qty: 28,
    weight: 3.2,
    metal_finish: "gold" as MetalFinish,
    images: ["/images/ring-1.jpg"],
    description: "Unique twisted band design in gold finish. Modern and elegant. Comfortable fit with anti-tarnish coating.",
    short_description: "Unique twisted gold band ring.",
    tags: ["ring", "gold", "twisted", "modern"],
    dimensions: { length: 2, width: 0.4, height: 0.5 },
    shipping_class: "standard",
    slug: "gold-twisted-band-ring",
    size_options: ["6", "7", "8", "9", "10"],
  },
  {
    title: "Rose Gold Eternity Ring",
    category: "rings" as Category,
    price: 1599,
    cost_price: 800,
    stock_qty: 20,
    weight: 4.1,
    metal_finish: "rose-gold" as MetalFinish,
    images: ["/images/ring-1.jpg"],
    description: "Beautiful eternity ring in rose gold. Symbol of everlasting love. Premium quality with lasting shine.",
    short_description: "Rose gold eternity ring.",
    tags: ["ring", "rose-gold", "eternity", "romantic"],
    dimensions: { length: 2, width: 0.5, height: 0.6 },
    shipping_class: "standard",
    slug: "rose-gold-eternity-ring",
    size_options: ["6", "7", "8", "9"],
  },
  {
    title: "Silver Geometric Ring",
    category: "rings" as Category,
    price: 899,
    cost_price: 450,
    stock_qty: 35,
    weight: 3.0,
    metal_finish: "silver" as MetalFinish,
    images: ["/images/ring-1.jpg"],
    description: "Modern geometric design in silver finish. Contemporary style with anti-tarnish protection.",
    short_description: "Modern geometric silver ring.",
    tags: ["ring", "silver", "geometric", "modern"],
    dimensions: { length: 2.2, width: 0.6, height: 0.5 },
    shipping_class: "standard",
    slug: "silver-geometric-ring",
    size_options: ["7", "8", "9", "10"],
  },
  {
    title: "Gold Nature Inspired Ring",
    category: "rings" as Category,
    price: 1399,
    cost_price: 700,
    stock_qty: 22,
    weight: 3.8,
    metal_finish: "gold" as MetalFinish,
    images: ["/images/ring-1.jpg"],
    description: "Nature-inspired design in gold finish. Organic shapes and elegant curves. Perfect for nature lovers.",
    short_description: "Nature-inspired gold ring.",
    tags: ["ring", "gold", "nature", "organic"],
    dimensions: { length: 2.3, width: 0.7, height: 0.6 },
    shipping_class: "standard",
    slug: "gold-nature-inspired-ring",
    is_new: true,
    size_options: ["6", "7", "8", "9"],
  },
  {
    title: "Platinum Classic Band",
    category: "rings" as Category,
    price: 2199,
    cost_price: 1100,
    stock_qty: 18,
    weight: 4.5,
    metal_finish: "platinum" as MetalFinish,
    images: ["/images/ring-1.jpg"],
    description: "Timeless classic band in premium platinum. Simple elegance that never goes out of style.",
    short_description: "Classic platinum band ring.",
    tags: ["ring", "platinum", "classic", "elegant"],
    dimensions: { length: 2, width: 0.4, height: 0.5 },
    shipping_class: "standard",
    slug: "platinum-classic-band",
    size_options: ["7", "8", "9", "10"],
  },
  {
    title: "Rose Gold Stackable Ring Set",
    category: "rings" as Category,
    price: 1899,
    cost_price: 950,
    stock_qty: 25,
    weight: 5.5,
    metal_finish: "rose-gold" as MetalFinish,
    images: ["/images/ring-1.jpg"],
    description: "Set of three stackable rings in rose gold. Mix and match for personalized style. Perfect for layering.",
    short_description: "Rose gold stackable ring set.",
    tags: ["ring", "rose-gold", "stackable", "set"],
    dimensions: { length: 2, width: 0.3, height: 0.4 },
    shipping_class: "standard",
    slug: "rose-gold-stackable-ring-set",
    size_options: ["6", "7", "8", "9"],
  },
  {
    title: "Silver Art Deco Ring",
    category: "rings" as Category,
    price: 1099,
    cost_price: 550,
    stock_qty: 30,
    weight: 3.6,
    metal_finish: "silver" as MetalFinish,
    images: ["/images/ring-1.jpg"],
    description: "Art Deco inspired ring in silver finish. Vintage glamour with modern durability. Anti-tarnish coating.",
    short_description: "Art Deco silver ring.",
    tags: ["ring", "silver", "art-deco", "vintage"],
    dimensions: { length: 2.4, width: 1.0, height: 0.7 },
    shipping_class: "standard",
    slug: "silver-art-deco-ring",
    size_options: ["7", "8", "9"],
  },
  {
    title: "Gold Celtic Knot Ring",
    category: "rings" as Category,
    price: 1499,
    cost_price: 750,
    stock_qty: 20,
    weight: 4.2,
    metal_finish: "gold" as MetalFinish,
    images: ["/images/ring-1.jpg"],
    description: "Intricate Celtic knot design in gold finish. Symbolic and beautiful. Perfect for those who appreciate detailed craftsmanship.",
    short_description: "Celtic knot gold ring.",
    tags: ["ring", "gold", "celtic", "intricate"],
    dimensions: { length: 2.2, width: 0.8, height: 0.6 },
    shipping_class: "standard",
    slug: "gold-celtic-knot-ring",
    size_options: ["6", "7", "8", "9"],
  },
  {
    title: "Rose Gold Infinity Ring",
    category: "rings" as Category,
    price: 1299,
    cost_price: 650,
    stock_qty: 27,
    weight: 3.4,
    metal_finish: "rose-gold" as MetalFinish,
    images: ["/images/ring-1.jpg"],
    description: "Elegant infinity symbol ring in rose gold. Perfect gift for special occasions. Lasting quality.",
    short_description: "Rose gold infinity ring.",
    tags: ["ring", "rose-gold", "infinity", "symbol"],
    dimensions: { length: 2.1, width: 0.6, height: 0.5 },
    shipping_class: "standard",
    slug: "rose-gold-infinity-ring",
    size_options: ["7", "8", "9", "10"],
  },
  {
    title: "Silver Wave Ring",
    category: "rings" as Category,
    price: 999,
    cost_price: 500,
    stock_qty: 32,
    weight: 3.1,
    metal_finish: "silver" as MetalFinish,
    images: ["/images/ring-1.jpg"],
    description: "Flowing wave design in silver finish. Ocean-inspired elegance. Comfortable and stylish.",
    short_description: "Silver wave design ring.",
    tags: ["ring", "silver", "wave", "ocean"],
    dimensions: { length: 2.3, width: 0.7, height: 0.5 },
    shipping_class: "standard",
    slug: "silver-wave-ring",
    size_options: ["6", "7", "8", "9"],
  },
  {
    title: "Gold Filigree Ring",
    category: "rings" as Category,
    price: 1699,
    cost_price: 850,
    stock_qty: 18,
    weight: 4.8,
    metal_finish: "gold" as MetalFinish,
    images: ["/images/ring-1.jpg"],
    description: "Delicate filigree work in gold finish. Intricate patterns and vintage charm. Premium quality.",
    short_description: "Gold filigree ring.",
    tags: ["ring", "gold", "filigree", "delicate"],
    dimensions: { length: 2.5, width: 1.2, height: 0.8 },
    shipping_class: "standard",
    slug: "gold-filigree-ring",
    is_new: true,
    size_options: ["7", "8", "9"],
  },

  // ========== EARRINGS (12 products) ==========
  {
    title: "Gold Hoop Earrings",
    category: "earrings" as Category,
    price: 899,
    cost_price: 450,
    stock_qty: 35,
    weight: 4.5,
    metal_finish: "gold" as MetalFinish,
    images: ["/images/earrings-1.jpg"],
    description: "Classic hoop earrings in gold finish. Timeless style that goes with everything. Hypoallergenic and lightweight.",
    short_description: "Classic gold hoop earrings.",
    tags: ["earrings", "gold", "hoop", "classic"],
    dimensions: { length: 3, width: 3, height: 0.2 },
    shipping_class: "standard",
    slug: "gold-hoop-earrings",
    is_new: true,
  },
  {
    title: "Rose Gold Stud Earrings",
    category: "earrings" as Category,
    price: 699,
    cost_price: 350,
    stock_qty: 45,
    weight: 2.0,
    metal_finish: "rose-gold" as MetalFinish,
    images: ["/images/earrings-1.jpg"],
    description: "Elegant stud earrings in rose gold. Perfect for everyday wear. Comfortable and stylish.",
    short_description: "Rose gold stud earrings.",
    tags: ["earrings", "rose-gold", "stud", "everyday"],
    dimensions: { length: 0.8, width: 0.8, height: 0.5 },
    shipping_class: "standard",
    slug: "rose-gold-stud-earrings",
  },
  {
    title: "Silver Drop Earrings",
    category: "earrings" as Category,
    price: 999,
    cost_price: 500,
    stock_qty: 30,
    weight: 5.2,
    metal_finish: "silver" as MetalFinish,
    images: ["/images/earrings-1.jpg"],
    description: "Elegant drop earrings in silver finish. Perfect for formal occasions. Lightweight and comfortable.",
    short_description: "Silver drop earrings.",
    tags: ["earrings", "silver", "drop", "formal"],
    dimensions: { length: 4, width: 1.5, height: 0.3 },
    shipping_class: "standard",
    slug: "silver-drop-earrings",
  },
  {
    title: "Platinum Chandelier Earrings",
    category: "earrings" as Category,
    price: 2499,
    cost_price: 1250,
    stock_qty: 12,
    weight: 8.5,
    metal_finish: "platinum" as MetalFinish,
    images: ["/images/earrings-1.jpg"],
    description: "Stunning chandelier earrings in platinum finish. Statement piece for special events. Premium quality.",
    short_description: "Platinum chandelier earrings.",
    tags: ["earrings", "platinum", "chandelier", "statement"],
    dimensions: { length: 6, width: 2, height: 0.5 },
    shipping_class: "standard",
    slug: "platinum-chandelier-earrings",
    is_new: true,
  },
  {
    title: "Gold Dangle Earrings",
    category: "earrings" as Category,
    price: 1199,
    cost_price: 600,
    stock_qty: 28,
    weight: 6.0,
    metal_finish: "gold" as MetalFinish,
    images: ["/images/earrings-1.jpg"],
    description: "Beautiful dangle earrings in gold finish. Modern and elegant. Perfect for parties and celebrations.",
    short_description: "Gold dangle earrings.",
    tags: ["earrings", "gold", "dangle", "party"],
    dimensions: { length: 5, width: 1.8, height: 0.4 },
    shipping_class: "standard",
    slug: "gold-dangle-earrings",
  },
  {
    title: "Rose Gold Huggie Earrings",
    category: "earrings" as Category,
    price: 799,
    cost_price: 400,
    stock_qty: 38,
    weight: 3.5,
    metal_finish: "rose-gold" as MetalFinish,
    images: ["/images/earrings-1.jpg"],
    description: "Comfortable huggie earrings in rose gold. Snug fit with modern style. Perfect for daily wear.",
    short_description: "Rose gold huggie earrings.",
    tags: ["earrings", "rose-gold", "huggie", "comfortable"],
    dimensions: { length: 2.5, width: 2.5, height: 0.3 },
    shipping_class: "standard",
    slug: "rose-gold-huggie-earrings",
  },
  {
    title: "Silver Geometric Earrings",
    category: "earrings" as Category,
    price: 849,
    cost_price: 425,
    stock_qty: 33,
    weight: 4.2,
    metal_finish: "silver" as MetalFinish,
    images: ["/images/earrings-1.jpg"],
    description: "Modern geometric design in silver finish. Contemporary style with anti-tarnish protection.",
    short_description: "Silver geometric earrings.",
    tags: ["earrings", "silver", "geometric", "modern"],
    dimensions: { length: 3.5, width: 2, height: 0.4 },
    shipping_class: "standard",
    slug: "silver-geometric-earrings",
  },
  {
    title: "Gold Tassel Earrings",
    category: "earrings" as Category,
    price: 1399,
    cost_price: 700,
    stock_qty: 22,
    weight: 7.2,
    metal_finish: "gold" as MetalFinish,
    images: ["/images/earrings-1.jpg"],
    description: "Boho-chic tassel earrings in gold finish. Fun and fashionable. Perfect for casual outings.",
    short_description: "Gold tassel earrings.",
    tags: ["earrings", "gold", "tassel", "boho"],
    dimensions: { length: 5.5, width: 2.5, height: 0.5 },
    shipping_class: "standard",
    slug: "gold-tassel-earrings",
  },
  {
    title: "Rose Gold Threader Earrings",
    category: "earrings" as Category,
    price: 949,
    cost_price: 475,
    stock_qty: 26,
    weight: 3.8,
    metal_finish: "rose-gold" as MetalFinish,
    images: ["/images/earrings-1.jpg"],
    description: "Elegant threader earrings in rose gold. Unique design with adjustable length. Modern and versatile.",
    short_description: "Rose gold threader earrings.",
    tags: ["earrings", "rose-gold", "threader", "adjustable"],
    dimensions: { length: 4.5, width: 0.5, height: 0.2 },
    shipping_class: "standard",
    slug: "rose-gold-threader-earrings",
  },
  {
    title: "Silver Cluster Earrings",
    category: "earrings" as Category,
    price: 1099,
    cost_price: 550,
    stock_qty: 29,
    weight: 5.8,
    metal_finish: "silver" as MetalFinish,
    images: ["/images/earrings-1.jpg"],
    description: "Beautiful cluster design in silver finish. Multiple elements for added elegance. Perfect for special occasions.",
    short_description: "Silver cluster earrings.",
    tags: ["earrings", "silver", "cluster", "elegant"],
    dimensions: { length: 4, width: 2.5, height: 0.6 },
    shipping_class: "standard",
    slug: "silver-cluster-earrings",
  },
  {
    title: "Gold Long Earrings",
    category: "earrings" as Category,
    price: 1299,
    cost_price: 650,
    stock_qty: 24,
    weight: 6.5,
    metal_finish: "gold" as MetalFinish,
    images: ["/images/earrings-1.jpg"],
    description: "Elegant long earrings in gold finish. Lengthening effect for face shape. Stylish and sophisticated.",
    short_description: "Gold long earrings.",
    tags: ["earrings", "gold", "long", "elegant"],
    dimensions: { length: 7, width: 1.5, height: 0.4 },
    shipping_class: "standard",
    slug: "gold-long-earrings",
  },
  {
    title: "Platinum Minimalist Studs",
    category: "earrings" as Category,
    price: 1799,
    cost_price: 900,
    stock_qty: 40,
    weight: 2.5,
    metal_finish: "platinum" as MetalFinish,
    images: ["/images/earrings-1.jpg"],
    description: "Simple and elegant studs in platinum finish. Minimalist style for everyday luxury. Premium quality.",
    short_description: "Platinum minimalist studs.",
    tags: ["earrings", "platinum", "minimalist", "luxury"],
    dimensions: { length: 0.6, width: 0.6, height: 0.4 },
    shipping_class: "standard",
    slug: "platinum-minimalist-studs",
  },

  // ========== PENDANTS (10 products) ==========
  {
    title: "Gold Heart Pendant",
    category: "pendants" as Category,
    price: 799,
    cost_price: 400,
    stock_qty: 40,
    weight: 3.2,
    metal_finish: "gold" as MetalFinish,
    images: ["/images/pendant-1.jpg"],
    description: "Romantic heart-shaped pendant in gold finish. Perfect gift for loved ones. Comes with chain.",
    short_description: "Gold heart pendant.",
    tags: ["pendant", "gold", "heart", "romantic"],
    dimensions: { length: 2, width: 2, height: 0.3 },
    shipping_class: "standard",
    slug: "gold-heart-pendant",
    is_new: true,
  },
  {
    title: "Rose Gold Tree of Life Pendant",
    category: "pendants" as Category,
    price: 1199,
    cost_price: 600,
    stock_qty: 28,
    weight: 4.5,
    metal_finish: "rose-gold" as MetalFinish,
    images: ["/images/pendant-1.jpg"],
    description: "Symbolic Tree of Life pendant in rose gold. Meaningful design with detailed craftsmanship. Includes chain.",
    short_description: "Rose gold Tree of Life pendant.",
    tags: ["pendant", "rose-gold", "tree-of-life", "symbolic"],
    dimensions: { length: 3, width: 2.5, height: 0.5 },
    shipping_class: "standard",
    slug: "rose-gold-tree-of-life-pendant",
  },
  {
    title: "Silver Infinity Pendant",
    category: "pendants" as Category,
    price: 899,
    cost_price: 450,
    stock_qty: 35,
    weight: 3.8,
    metal_finish: "silver" as MetalFinish,
    images: ["/images/pendant-1.jpg"],
    description: "Elegant infinity symbol pendant in silver finish. Timeless design. Comes with matching chain.",
    short_description: "Silver infinity pendant.",
    tags: ["pendant", "silver", "infinity", "symbol"],
    dimensions: { length: 2.5, width: 1.5, height: 0.4 },
    shipping_class: "standard",
    slug: "silver-infinity-pendant",
  },
  {
    title: "Platinum Cross Pendant",
    category: "pendants" as Category,
    price: 1599,
    cost_price: 800,
    stock_qty: 25,
    weight: 5.2,
    metal_finish: "platinum" as MetalFinish,
    images: ["/images/pendant-1.jpg"],
    description: "Elegant cross pendant in premium platinum finish. Meaningful and beautiful. Premium quality chain included.",
    short_description: "Platinum cross pendant.",
    tags: ["pendant", "platinum", "cross", "faith"],
    dimensions: { length: 3.5, width: 2, height: 0.6 },
    shipping_class: "standard",
    slug: "platinum-cross-pendant",
  },
  {
    title: "Gold Sun Pendant",
    category: "pendants" as Category,
    price: 1099,
    cost_price: 550,
    stock_qty: 30,
    weight: 4.2,
    metal_finish: "gold" as MetalFinish,
    images: ["/images/pendant-1.jpg"],
    description: "Radiant sun design pendant in gold finish. Positive energy and warmth. Beautiful detail work.",
    short_description: "Gold sun pendant.",
    tags: ["pendant", "gold", "sun", "positive"],
    dimensions: { length: 3, width: 3, height: 0.5 },
    shipping_class: "standard",
    slug: "gold-sun-pendant",
  },
  {
    title: "Rose Gold Moon Pendant",
    category: "pendants" as Category,
    price: 999,
    cost_price: 500,
    stock_qty: 32,
    weight: 3.6,
    metal_finish: "rose-gold" as MetalFinish,
    images: ["/images/pendant-1.jpg"],
    description: "Mystical moon pendant in rose gold finish. Celestial beauty. Perfect for moon lovers.",
    short_description: "Rose gold moon pendant.",
    tags: ["pendant", "rose-gold", "moon", "celestial"],
    dimensions: { length: 2.8, width: 2.8, height: 0.4 },
    shipping_class: "standard",
    slug: "rose-gold-moon-pendant",
  },
  {
    title: "Silver Feather Pendant",
    category: "pendants" as Category,
    price: 849,
    cost_price: 425,
    stock_qty: 38,
    weight: 3.4,
    metal_finish: "silver" as MetalFinish,
    images: ["/images/pendant-1.jpg"],
    description: "Delicate feather pendant in silver finish. Light as a feather design. Elegant and graceful.",
    short_description: "Silver feather pendant.",
    tags: ["pendant", "silver", "feather", "delicate"],
    dimensions: { length: 3.5, width: 1.5, height: 0.3 },
    shipping_class: "standard",
    slug: "silver-feather-pendant",
  },
  {
    title: "Gold Compass Pendant",
    category: "pendants" as Category,
    price: 1299,
    cost_price: 650,
    stock_qty: 26,
    weight: 4.8,
    metal_finish: "gold" as MetalFinish,
    images: ["/images/pendant-1.jpg"],
    description: "Adventure-inspired compass pendant in gold finish. Find your way with style. Detailed design.",
    short_description: "Gold compass pendant.",
    tags: ["pendant", "gold", "compass", "adventure"],
    dimensions: { length: 3, width: 3, height: 0.6 },
    shipping_class: "standard",
    slug: "gold-compass-pendant",
  },
  {
    title: "Rose Gold Butterfly Pendant",
    category: "pendants" as Category,
    price: 949,
    cost_price: 475,
    stock_qty: 29,
    weight: 3.9,
    metal_finish: "rose-gold" as MetalFinish,
    images: ["/images/pendant-1.jpg"],
    description: "Beautiful butterfly pendant in rose gold finish. Transformation and beauty. Delicate and elegant.",
    short_description: "Rose gold butterfly pendant.",
    tags: ["pendant", "rose-gold", "butterfly", "transformation"],
    dimensions: { length: 3.2, width: 2.8, height: 0.5 },
    shipping_class: "standard",
    slug: "rose-gold-butterfly-pendant",
  },
  {
    title: "Silver Star Pendant",
    category: "pendants" as Category,
    price: 799,
    cost_price: 400,
    stock_qty: 42,
    weight: 3.1,
    metal_finish: "silver" as MetalFinish,
    images: ["/images/pendant-1.jpg"],
    description: "Shining star pendant in silver finish. Reach for the stars. Perfect gift for dreamers.",
    short_description: "Silver star pendant.",
    tags: ["pendant", "silver", "star", "dreams"],
    dimensions: { length: 2.5, width: 2.5, height: 0.4 },
    shipping_class: "standard",
    slug: "silver-star-pendant",
    is_new: true,
  },

  // ========== BRACELETS (8 products) ==========
  {
    title: "Gold Chain Bracelet",
    category: "bracelets" as Category,
    price: 1299,
    cost_price: 650,
    stock_qty: 30,
    weight: 8.5,
    metal_finish: "gold" as MetalFinish,
    images: ["/images/bracelet-1.jpg"],
    description: "Classic chain bracelet in gold finish. Timeless elegance. Adjustable length for perfect fit.",
    short_description: "Gold chain bracelet.",
    tags: ["bracelet", "gold", "chain", "classic"],
    dimensions: { length: 18, width: 0.5, height: 0.5 },
    shipping_class: "standard",
    slug: "gold-chain-bracelet",
    size_options: ["S", "M", "L"],
  },
  {
    title: "Rose Gold Cuff Bracelet",
    category: "bracelets" as Category,
    price: 1499,
    cost_price: 750,
    stock_qty: 25,
    weight: 12.5,
    metal_finish: "rose-gold" as MetalFinish,
    images: ["/images/bracelet-1.jpg"],
    description: "Bold cuff bracelet in rose gold finish. Statement piece. Comfortable fit with adjustable sizing.",
    short_description: "Rose gold cuff bracelet.",
    tags: ["bracelet", "rose-gold", "cuff", "statement"],
    dimensions: { length: 7, width: 2, height: 0.8 },
    shipping_class: "standard",
    slug: "rose-gold-cuff-bracelet",
    size_options: ["S", "M", "L"],
  },
  {
    title: "Silver Bangle Set",
    category: "bracelets" as Category,
    price: 1699,
    cost_price: 850,
    stock_qty: 28,
    weight: 15.2,
    metal_finish: "silver" as MetalFinish,
    images: ["/images/bracelet-1.jpg"],
    description: "Set of three bangles in silver finish. Stackable design for layered look. Perfect for mixing and matching.",
    short_description: "Silver bangle set.",
    tags: ["bracelet", "silver", "bangle", "set"],
    dimensions: { length: 7, width: 0.8, height: 0.8 },
    shipping_class: "standard",
    slug: "silver-bangle-set",
    size_options: ["M", "L"],
  },
  {
    title: "Platinum Tennis Bracelet",
    category: "bracelets" as Category,
    price: 2999,
    cost_price: 1500,
    stock_qty: 15,
    weight: 10.5,
    metal_finish: "platinum" as MetalFinish,
    images: ["/images/bracelet-1.jpg"],
    description: "Elegant tennis bracelet in premium platinum finish. Luxurious and timeless. Premium quality.",
    short_description: "Platinum tennis bracelet.",
    tags: ["bracelet", "platinum", "tennis", "luxury"],
    dimensions: { length: 19, width: 0.6, height: 0.6 },
    shipping_class: "standard",
    slug: "platinum-tennis-bracelet",
    is_new: true,
    size_options: ["S", "M", "L"],
  },
  {
    title: "Gold Charm Bracelet",
    category: "bracelets" as Category,
    price: 1899,
    cost_price: 950,
    stock_qty: 22,
    weight: 14.8,
    metal_finish: "gold" as MetalFinish,
    images: ["/images/bracelet-1.jpg"],
    description: "Personalized charm bracelet in gold finish. Add your story with meaningful charms. Expandable design.",
    short_description: "Gold charm bracelet.",
    tags: ["bracelet", "gold", "charm", "personalized"],
    dimensions: { length: 18, width: 1, height: 0.8 },
    shipping_class: "standard",
    slug: "gold-charm-bracelet",
    size_options: ["M", "L"],
  },
  {
    title: "Rose Gold Bead Bracelet",
    category: "bracelets" as Category,
    price: 1199,
    cost_price: 600,
    stock_qty: 32,
    weight: 9.5,
    metal_finish: "rose-gold" as MetalFinish,
    images: ["/images/bracelet-1.jpg"],
    description: "Modern bead bracelet in rose gold finish. Contemporary style. Adjustable length.",
    short_description: "Rose gold bead bracelet.",
    tags: ["bracelet", "rose-gold", "bead", "modern"],
    dimensions: { length: 17, width: 0.8, height: 0.8 },
    shipping_class: "standard",
    slug: "rose-gold-bead-bracelet",
    size_options: ["S", "M", "L"],
  },
  {
    title: "Silver Link Bracelet",
    category: "bracelets" as Category,
    price: 1399,
    cost_price: 700,
    stock_qty: 27,
    weight: 11.2,
    metal_finish: "silver" as MetalFinish,
    images: ["/images/bracelet-1.jpg"],
    description: "Sturdy link bracelet in silver finish. Strong and stylish. Perfect for daily wear.",
    short_description: "Silver link bracelet.",
    tags: ["bracelet", "silver", "link", "sturdy"],
    dimensions: { length: 18, width: 1.2, height: 0.6 },
    shipping_class: "standard",
    slug: "silver-link-bracelet",
    size_options: ["M", "L"],
  },
  {
    title: "Gold Wrap Bracelet",
    category: "bracelets" as Category,
    price: 1599,
    cost_price: 800,
    stock_qty: 24,
    weight: 13.5,
    metal_finish: "gold" as MetalFinish,
    images: ["/images/bracelet-1.jpg"],
    description: "Elegant wrap bracelet in gold finish. Multi-wrap design for layered look. Adjustable fit.",
    short_description: "Gold wrap bracelet.",
    tags: ["bracelet", "gold", "wrap", "multi-wrap"],
    dimensions: { length: 35, width: 0.5, height: 0.5 },
    shipping_class: "standard",
    slug: "gold-wrap-bracelet",
    size_options: ["One Size"],
  },

  // ========== NECKLACES (8 products) ==========
  {
    title: "Gold Locket Necklace",
    category: "necklaces" as Category,
    price: 1799,
    cost_price: 900,
    stock_qty: 26,
    weight: 12.5,
    metal_finish: "gold" as MetalFinish,
    images: ["/images/pendant-1.jpg"],
    description: "Romantic locket necklace in gold finish. Keep memories close. Opens to hold photos. Adjustable chain.",
    short_description: "Gold locket necklace.",
    tags: ["necklace", "gold", "locket", "memories"],
    dimensions: { length: 45, width: 2.5, height: 0.8 },
    shipping_class: "standard",
    slug: "gold-locket-necklace",
    is_new: true,
  },
  {
    title: "Rose Gold Choker Necklace",
    category: "necklaces" as Category,
    price: 1299,
    cost_price: 650,
    stock_qty: 30,
    weight: 8.5,
    metal_finish: "rose-gold" as MetalFinish,
    images: ["/images/pendant-1.jpg"],
    description: "Trendy choker necklace in rose gold finish. Modern and stylish. Adjustable length for perfect fit.",
    short_description: "Rose gold choker necklace.",
    tags: ["necklace", "rose-gold", "choker", "trendy"],
    dimensions: { length: 38, width: 1, height: 0.6 },
    shipping_class: "standard",
    slug: "rose-gold-choker-necklace",
  },
  {
    title: "Silver Pendant Necklace",
    category: "necklaces" as Category,
    price: 1499,
    cost_price: 750,
    stock_qty: 28,
    weight: 10.2,
    metal_finish: "silver" as MetalFinish,
    images: ["/images/pendant-1.jpg"],
    description: "Elegant pendant necklace in silver finish. Versatile design. Perfect for both casual and formal wear.",
    short_description: "Silver pendant necklace.",
    tags: ["necklace", "silver", "pendant", "versatile"],
    dimensions: { length: 42, width: 2, height: 0.7 },
    shipping_class: "standard",
    slug: "silver-pendant-necklace",
  },
  {
    title: "Platinum Statement Necklace",
    category: "necklaces" as Category,
    price: 3499,
    cost_price: 1750,
    stock_qty: 12,
    weight: 18.5,
    metal_finish: "platinum" as MetalFinish,
    images: ["/images/pendant-1.jpg"],
    description: "Bold statement necklace in premium platinum finish. Eye-catching design for special occasions. Premium quality.",
    short_description: "Platinum statement necklace.",
    tags: ["necklace", "platinum", "statement", "luxury"],
    dimensions: { length: 40, width: 4, height: 1.2 },
    shipping_class: "standard",
    slug: "platinum-statement-necklace",
  },
  {
    title: "Gold Layered Necklace Set",
    category: "necklaces" as Category,
    price: 2499,
    cost_price: 1250,
    stock_qty: 20,
    weight: 15.8,
    metal_finish: "gold" as MetalFinish,
    images: ["/images/pendant-1.jpg"],
    description: "Set of three layered necklaces in gold finish. Mix and match for personalized style. Perfect for layering trend.",
    short_description: "Gold layered necklace set.",
    tags: ["necklace", "gold", "layered", "set"],
    dimensions: { length: 45, width: 1.5, height: 0.6 },
    shipping_class: "standard",
    slug: "gold-layered-necklace-set",
  },
  {
    title: "Rose Gold Y-Necklace",
    category: "necklaces" as Category,
    price: 1399,
    cost_price: 700,
    stock_qty: 27,
    weight: 9.5,
    metal_finish: "rose-gold" as MetalFinish,
    images: ["/images/pendant-1.jpg"],
    description: "Elegant Y-necklace in rose gold finish. Lengthening effect. Modern and sophisticated design.",
    short_description: "Rose gold Y-necklace.",
    tags: ["necklace", "rose-gold", "y-necklace", "elegant"],
    dimensions: { length: 50, width: 1.2, height: 0.5 },
    shipping_class: "standard",
    slug: "rose-gold-y-necklace",
  },
  {
    title: "Silver Chain Necklace",
    category: "necklaces" as Category,
    price: 1199,
    cost_price: 600,
    stock_qty: 35,
    weight: 11.2,
    metal_finish: "silver" as MetalFinish,
    images: ["/images/pendant-1.jpg"],
    description: "Classic chain necklace in silver finish. Timeless style. Adjustable length for versatility.",
    short_description: "Silver chain necklace.",
    tags: ["necklace", "silver", "chain", "classic"],
    dimensions: { length: 48, width: 0.8, height: 0.6 },
    shipping_class: "standard",
    slug: "silver-chain-necklace",
  },
  {
    title: "Gold Collar Necklace",
    category: "necklaces" as Category,
    price: 1699,
    cost_price: 850,
    stock_qty: 23,
    weight: 14.5,
    metal_finish: "gold" as MetalFinish,
    images: ["/images/pendant-1.jpg"],
    description: "Bold collar necklace in gold finish. Statement piece. Perfect for formal events and parties.",
    short_description: "Gold collar necklace.",
    tags: ["necklace", "gold", "collar", "bold"],
    dimensions: { length: 36, width: 3, height: 1 },
    shipping_class: "standard",
    slug: "gold-collar-necklace",
  },
];

async function seedProducts() {
  console.log("🌱 Starting product seeding...\n");

  try {
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const product of sampleProducts) {
      try {
        // Generate slug if not provided
        const slug = product.slug || generateSlug(product.title);

        // Create product with all required fields
        const productData: Product = {
          ...product,
          slug,
          product_id: "", // Will be auto-generated
          sku: "", // Will be auto-generated
        } as Product;

        const created = await createProductDirect(productData);
        console.log(`✅ Created: ${created.title} (${created.sku})`);
        successCount++;
      } catch (error: any) {
        const errorMessage = error.message || String(error);
        console.error(`❌ Failed: ${product.title} - ${errorMessage}`);
        errors.push(`${product.title}: ${errorMessage}`);
        errorCount++;

        // If product already exists, skip it
        if (errorMessage.includes("already exists")) {
          console.log(`   ⏭️  Skipping (already exists)`);
        }
      }
    }

    console.log("\n" + "=".repeat(50));
    console.log("📊 Seeding Summary:");
    console.log(`   ✅ Success: ${successCount} products`);
    console.log(`   ❌ Errors: ${errorCount} products`);

    if (errors.length > 0) {
      console.log("\n❌ Errors:");
      errors.forEach((error) => {
        console.log(`   - ${error}`);
      });
    }

    console.log("\n✨ Seeding completed!");
  } catch (error) {
    console.error("💥 Fatal error during seeding:", error);
    process.exit(1);
  }
}

// Run the seed function
if (require.main === module) {
  seedProducts()
    .then(() => {
      console.log("\n🎉 All done!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Unexpected error:", error);
      process.exit(1);
    });
}

export default seedProducts;

