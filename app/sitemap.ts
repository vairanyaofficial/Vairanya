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

  // Product pages - try to get actual dates from Firestore
  try {
    const products = await getAllProducts();
    
    // Import Firestore to get document update times if available
    let productPages: MetadataRoute.Sitemap = [];
    
    try {
      // Try to get products with timestamps from Firestore
      const { adminFirestore } = await import("@/lib/firebaseAdmin.server");
      if (adminFirestore) {
        const snapshot = await adminFirestore.collection("products").get();
        const productMap = new Map(
          snapshot.docs.map((doc) => {
            const data = doc.data();
            return [
              data.slug || doc.id,
              {
                updatedAt: data.updatedAt?.toDate?.() || data.createdAt?.toDate?.() || null,
                createdAt: data.createdAt?.toDate?.() || null,
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
      // Fallback: use current date if Firestore access fails
      console.warn("Could not fetch product timestamps, using current date:", error);
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

