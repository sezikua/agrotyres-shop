import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { mapCategoryToApi } from '@/lib/categoryMap';
import { getCategoryDescription } from '@/lib/categoryDescriptions';

type PagedProducts = {
  data: Array<{ id: number; product_name: string; model: string; size: string; product_image: string | null }>;
  pagination: { totalItems: number };
};

async function getBaseUrl(): Promise<string> {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl) return envUrl.replace(/\/$/, '');
  const h = await headers();
  const host = h.get('x-forwarded-host') || h.get('host');
  const proto = h.get('x-forwarded-proto') || 'https';
  return `${proto}://${host}`;
}

export async function generateMetadata(
  { params }: { params: Promise<{ category: string }> }
): Promise<Metadata> {
  const { category } = await params;
  const baseUrl = await getBaseUrl();
  const decoded = decodeURIComponent(category);
  const apiCategory = mapCategoryToApi(decoded);
  const categoryDesc = getCategoryDescription(decoded) || getCategoryDescription(apiCategory);

  let products: PagedProducts['data'] = [];
  let total = 0;
  try {
    const res = await fetch(`${baseUrl}/api/products?category=${encodeURIComponent(apiCategory)}&limit=12`, { next: { revalidate: 300 } });
    if (res.ok) {
      const json: PagedProducts = await res.json();
      products = json.data || [];
      total = json.pagination?.totalItems || products.length;
    }
  } catch {}

  const displayName = categoryDesc?.title || `Категорія: ${decoded}`;
  const description = categoryDesc?.description || `Магазин шин у категорії "${decoded}". Доступно ${total} товарів.`;
  const keywords = categoryDesc?.keywords.join(', ') || `${decoded}, CEAT, шини, агро`;
  const title = `${displayName} — CEAT — офіційний імпортер в Україні`;
  const canonical = `${baseUrl}/categories/${encodeURIComponent(category)}`;

  const firstImage = products[0]?.product_image ? `${baseUrl}/api/assets/${products[0].product_image}` : `${baseUrl}/placeholder-image.svg`;

  return {
    title,
    description,
    keywords,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: 'website',
      url: canonical,
      images: [{ url: firstImage, alt: `Категорія: ${decoded}` }],
      siteName: 'CEAT — офіційний імпортер в Україні',
      locale: 'uk_UA',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [firstImage],
    },
  };
}

export default function CategoryLayout({ children }: { children: React.ReactNode }) {
  return children;
}


