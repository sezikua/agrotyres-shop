import type { Metadata } from "next";
import { headers } from "next/headers";
import { deriveSizeSeoData } from "@/lib/sizeSeo";

async function getBaseUrl(): Promise<string> {
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}

type SizeProductForSeo = {
  id: number;
  product_name: string;
  Category?: string | null;
  Segment?: string | null;
};

export async function generateMetadata({ params }: { params: Promise<{ size: string }> }): Promise<Metadata> {
  const { size } = await params;
  const baseUrl = await getBaseUrl();
  const decodedSize = decodeURIComponent(size);
  const canonical = `${baseUrl}/sizes/${size}`;

  let itemsForSeo: SizeProductForSeo[] = [];
  try {
    const res = await fetch(`${baseUrl}/api/products/size/${encodeURIComponent(decodedSize)}?limit=50`, {
      next: { revalidate: 300 },
    });
    if (res.ok) {
      const json = await res.json();
      itemsForSeo = (json?.data || []) as SizeProductForSeo[];
    }
  } catch {
    // ignore and fallback to defaults
  }

  const { categoriesList, segmentsDescription } = deriveSizeSeoData(itemsForSeo);
  const categoriesText = categoriesList || "різних типів техніки";
  const segmentsText = segmentsDescription || "різних напрямів аграрної та індустріальної техніки";
  const ogImage = `${baseUrl}/cstl-logo-eu-as.avif`;

  const title = `Купити ${decodedSize} шини для ${categoriesText} | ТОВ Агро-Солар`;
  const description = `Великий вибір ${decodedSize} для ${categoriesText}. Знаходьте ${segmentsText}. Оптимальна ціна та доставка по Україні від ТОВ Агро-Солар.`;
  const keywords = [
    `шини ${decodedSize}`,
    `резина ${decodedSize}`,
    `колеса ${decodedSize}`,
    `ціна ${decodedSize}`,
    categoriesText,
  ].join(", ");

  return {
    title,
    description,
    keywords,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
      siteName: "ТОВ Агро-Солар",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `Шини ${decodedSize} — ТОВ Агро-Солар`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function Head({ params }: { params: Promise<{ size: string }> }) {
  const { size } = await params;
  const baseUrl = await getBaseUrl();
  const decoded = decodeURIComponent(size);

  // ItemList JSON-LD for size page
  type ItemForList = { id: number; product_name: string };
  let items: ItemForList[] = [];
  try {
    const res = await fetch(`${baseUrl}/api/products/size/${encodeURIComponent(decoded)}?limit=50`, { next: { revalidate: 300 } });
    if (res.ok) {
      const json = await res.json();
      items = ((json?.data || []) as ItemForList[]).slice(0, 50);
    }
  } catch {}

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Розмір: ${decoded}`,
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
              { '@type': 'ListItem', position: 2, name: 'Каталог шин', item: `${baseUrl}/products` },
              { '@type': 'ListItem', position: 3, name: `Розмір: ${decoded}`, item: `${baseUrl}/sizes/${encodeURIComponent(size)}` },
            ],
          })
        }}
      />
    </>
  );
}
