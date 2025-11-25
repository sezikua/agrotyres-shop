import { headers } from 'next/headers';
import { availabilityInfo, detectBrand, importerHeadline, sanitizeDescription } from '@/lib/productMeta';

async function getBaseUrl(): Promise<string> {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl) return envUrl.replace(/\/$/, '');
  const h = await headers();
  const host = h.get('x-forwarded-host') || h.get('host');
  const proto = h.get('x-forwarded-proto') || 'https';
  return `${proto}://${host}`;
}

export default async function Head({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const baseUrl = await getBaseUrl();

  type ProductForHead = {
    id: number;
    product_name: string;
    description: string | null;
    model: string;
    size: string;
    product_image: string | null;
    sku: string;
    warehouse: string;
    regular_price: string;
    discount_price: string | null;
    brand?: string | null;
  };
  let product: ProductForHead | null = null;
  try {
    const res = await fetch(`${baseUrl}/api/products/slug/${encodeURIComponent(slug)}`, { next: { revalidate: 300 } });
    if (res.ok) {
      const json: { data: ProductForHead | null } = await res.json();
      product = json.data ?? null;
    }
  } catch {}

  const brand = detectBrand(product?.brand, product?.product_name);
  const headline = importerHeadline(brand);
  const availability = availabilityInfo(product?.warehouse);
  const details = [
    product?.model ? `Модель ${product.model}` : null,
    product?.size ? `Розмір ${product.size}` : null,
  ].filter(Boolean).join(', ');

  const jsonLd = product ? {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.product_name,
    description: sanitizeDescription(product.description) || `${product.product_name}${details ? ` (${details})` : ''}`,
    image: product.product_image ? `${baseUrl}/api/assets/${product.product_image}` : `${baseUrl}/placeholder-image.svg`,
    sku: product.sku,
    brand: { '@type': 'Brand', name: brand },
    offers: {
      '@type': 'Offer',
      availability: product.warehouse?.toLowerCase() === 'in stock'
        ? 'https://schema.org/InStock'
        : 'https://schema.org/PreOrder',
      priceCurrency: 'UAH',
      price: product.discount_price || product.regular_price,
      url: `${baseUrl}/products/${encodeURIComponent(slug)}`,
      itemCondition: 'https://schema.org/NewCondition',
      seller: {
        '@type': 'Organization',
        name: headline
      }
    },
    additionalProperty: [
      ...(details
        ? [{
            '@type': 'PropertyValue',
            name: 'Параметри',
            value: details,
          }]
        : []),
      {
        '@type': 'PropertyValue',
        name: 'Наявність',
        value: availability.short,
      },
    ],
  } : null;

  const productImageUrl = product?.product_image
    ? `${baseUrl}/api/assets/${product.product_image}`
    : `${baseUrl}/placeholder-image.svg`;

  const imageAltBase = [product?.size, brand, product?.model].filter(Boolean).join(' ').trim();
  const imageAlt = imageAltBase
    ? `Фото шини ${imageAltBase} | ТОВ Агро-Солар`
    : 'Фото шини ТОВ Агро-Солар';

  return (
    <>
      <meta property="og:image" content={productImageUrl} />
      <meta property="og:image:secure_url" content={productImageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={imageAlt} />
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      )}
      {/* BreadcrumbList JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Головна',
                item: `${baseUrl}/`
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'Товари',
                item: `${baseUrl}/products`
              },
              product ? {
                '@type': 'ListItem',
                position: 3,
                name: product.product_name,
                item: `${baseUrl}/products/${encodeURIComponent(slug)}`
              } : undefined
            ].filter(Boolean)
          })
        }}
      />
    </>
  );
}



