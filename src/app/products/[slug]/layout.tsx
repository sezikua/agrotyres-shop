import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { availabilityInfo, detectBrand, importerHeadline, sanitizeDescription } from '@/lib/productMeta';

type ProductApiResponse = {
  data: {
    id: number;
    sku: string;
    product_name: string;
    model: string;
    size: string;
    description: string | null;
    product_image: string | null;
    Category: string;
    Segment: string;
    regular_price: string;
    discount_price: string | null;
    warehouse: string;
    slug?: string;
    brand?: string | null;
  } | null;
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
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const baseUrl = await getBaseUrl();

  let product: ProductApiResponse['data'] = null;
  try {
    const res = await fetch(`${baseUrl}/api/products/slug/${encodeURIComponent(slug)}`, { next: { revalidate: 300 } });
    if (res.ok) {
      const json: ProductApiResponse = await res.json();
      product = json.data;
    }
  } catch {}

  const brand = detectBrand(product?.brand, product?.product_name);
  const headline = importerHeadline(brand);
  const availability = availabilityInfo(product?.warehouse);
  const details = [
    product?.model ? `Модель ${product.model}` : null,
    product?.size ? `Розмір ${product.size}` : null,
  ].filter(Boolean).join(', ');

  const title = product
    ? `${headline} | ${product.product_name}`
    : `${headline} | Преміальні шини`;

  const fallbackDescription = product
    ? `Купити ${product.product_name}${details ? ` (${details})` : ''} ${availability.phrase}. Бренд ${brand}.`
    : `${headline}. Каталог сільськогосподарських шин із гарантією виробника.`;

  const description = product?.description
    ? sanitizeDescription(product.description).slice(0, 220) || fallbackDescription
    : fallbackDescription;

  const keywords = product
    ? [product.product_name, product.model, product.size, product.Category, product.Segment, brand, 'шини', 'Agro-Solar']
        .filter(Boolean)
        .join(', ')
    : `Agro-Solar, ${brand}, сільськогосподарські шини`;

  const canonical = `${baseUrl}/products/${encodeURIComponent(slug)}`;
  const ogImage = product?.product_image ? `${baseUrl}/api/assets/${product.product_image}` : `${baseUrl}/placeholder-image.svg`;

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
      images: [
        {
          url: ogImage,
          secureUrl: ogImage,
          width: 1200,
          height: 630,
          alt: product?.product_name || headline,
        },
      ],
      siteName: brand,
      locale: 'uk_UA',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return children;
}


