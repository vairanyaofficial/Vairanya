import { MetadataRoute } from "next";
import { getAllProducts } from "@/lib/products-server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://vairanya.in";

  // Get current date for static pages
  const now = new Date();

  // Static pages with appropriate lastModified dates
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/shipping-returns`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  // Product pages - get actual dates from MongoDB
  try {
    const products = await getAllProducts();
    
    // Get product timestamps from MongoDB if available
    let productPages: MetadataRoute.Sitemap = [];
    
    try {
      const { getMongoDB } = await import("@/lib/mongodb.server");
      const db = getMongoDB();
      
      if (db) {
        const productDocs = await db.collection("Product").find({}).toArray();
        interface ProductTimestamps {
          updatedAt: Date | null;
          createdAt: Date | null;
        }
        const productMap = new Map<string, ProductTimestamps>(
          productDocs.map((doc: any) => {
            return [
              doc.slug || doc._id?.toString(),
              {
                updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : null,
                createdAt: doc.createdAt ? new Date(doc.createdAt) : null,
              },
            ];
          })
        );

        productPages = products.map((product) => {
          const timestamps = productMap.get(product.slug);
          const lastModified = timestamps?.updatedAt || timestamps?.createdAt || now;
          
          return {
            url: `${baseUrl}/products/${product.slug}`,
            lastModified,
            changeFrequency: "weekly" as const,
            priority: 0.8,
          };
        });
      } else {
        // Fallback: use current date
        productPages = products.map((product) => ({
          url: `${baseUrl}/products/${product.slug}`,
          lastModified: now,
          changeFrequency: "weekly" as const,
          priority: 0.8,
        }));
      }
    } catch (error) {
      // Fallback: use current date if MongoDB access fails
      productPages = products.map((product) => ({
        url: `${baseUrl}/products/${product.slug}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }));
    }

    return [...staticPages, ...productPages];
  } catch (error) {
    console.error("Error generating sitemap:", error);
    // Return at least static pages if products fail to load
    return staticPages;
  }
}

