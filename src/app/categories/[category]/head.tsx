import type { Metadata } from "next";
import { headers } from 'next/headers';
import { getCategoryDescription } from '@/lib/categoryDescriptions';
import { mapCategoryToApi } from '@/lib/categoryMap';

async function getBaseUrl(): Promise<string> {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl) return envUrl.replace(/\/$/, '');
  const h = await headers();
  const host = h.get('x-forwarded-host') || h.get('host');
  const proto = h.get('x-forwarded-proto') || 'https';
  return `${proto}://${host}`;
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params;
  const baseUrl = await getBaseUrl();
  const decodedCategory = decodeURIComponent(category);
  const apiCategory = mapCategoryToApi(decodedCategory);
  const canonical = `${baseUrl}/categories/${category}`;
  
  // Отримуємо детальний опис категорії
  const categoryDesc = getCategoryDescription(decodedCategory) || getCategoryDescription(apiCategory);
  const title = categoryDesc ? `${categoryDesc.title} — CEAT — офіційний імпортер в Україні` : `${decodedCategory} — CEAT — офіційний імпортер в Україні`;
  const description = categoryDesc ? categoryDesc.description : `Шини категорії ${decodedCategory}. Високоякісні сільськогосподарські шини з офіційного складу в Україні.`;
  
  return {
    title,
    description,
    keywords: categoryDesc?.keywords.join(', ') || `${decodedCategory}, CEAT, сільгоспшини, шини для тракторів, агрошини`,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
      siteName: "CEAT — офіційний імпортер в Україні",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function Head({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const baseUrl = await getBaseUrl();
  const decoded = decodeURIComponent(category);
  const apiCategory = mapCategoryToApi(decoded);

  // ItemList JSON-LD for category page
  type ItemForList = { id: number; product_name: string };
  let items: ItemForList[] = [];
  try {
    const res = await fetch(`${baseUrl}/api/products?category=${encodeURIComponent(apiCategory)}&limit=50`, { next: { revalidate: 300 } });
    if (res.ok) {
      const json = await res.json();
      items = ((json?.data || []) as ItemForList[]).slice(0, 50);
    }
  } catch {}

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Категорія: ${decoded}`,
    itemListElement: items.map((p: ItemForList, index: number) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${baseUrl}/products/${p.id}`,
      name: p.product_name,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Головна', item: `${baseUrl}/` },
              { '@type': 'ListItem', position: 2, name: `Категорія: ${decoded}`, item: `${baseUrl}/categories/${encodeURIComponent(category)}` },
            ],
          })
        }}
      />
    </>
  );
}


