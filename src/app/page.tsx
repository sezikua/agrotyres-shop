import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { headers } from "next/headers";
import ProductCard from "@/components/ProductCard";
import HomeSizeFilter from "@/components/HomeSizeFilter";
import HeroVideoSection from "@/components/HeroVideoSection";

async function getBaseUrl(): Promise<string> {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host");
  const proto = h.get("x-forwarded-proto") || "https";
  return `${proto}://${host}`;
}

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = await getBaseUrl();
  const title = "Агро-Солар — офіційний імпортер CEAT, Trelleborg в Україні | Сільськогосподарські шини";
  const description = "Агро-Солар — офіційний імпортер CEAT, Trelleborg в Україні. Магазин шин для тракторів, комбайнів, навантажувачів, обприскувачів та причепів.";
  const canonical = `${baseUrl}/`;
  const ogImage = `${baseUrl}/cstl-logo-eu-as.avif`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
      images: [{ url: ogImage, alt: "Агро-Солар — офіційний імпортер CEAT, Trelleborg в Україні" }],
      siteName: "Агро-Солар — офіційний імпортер CEAT, Trelleborg в Україні",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

async function getDiscountedProducts() {
  try {
    // Отримуємо товари напряму з Directus API на сервері
    const directusUrl = process.env.DIRECTUS_URL || 'http://173.212.215.18:8055';
    const directusToken = process.env.DIRECTUS_TOKEN || 'wFd_KOyK9LJEZSe98DEu8Uww5wKGg1qD';
    
    // Запит саме по товарах зі знижкою (discount_price не null і менше за regular_price)
    const sortOrder = 'sort[0]=product_name';
    const url = `${directusUrl}/items/Product?filter[discount_price][_nnull]=true&filter[discount_price][_lt]=regular_price&page=1&limit=100&meta=total_count&${sortOrder}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${directusToken}`,
      },
      next: { revalidate: 300 } // Revalidate every 5 minutes
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const discountedProducts: any[] = data.data || [];
    
    // Кастомне сортування за наявністю: In stock -> On order -> out of stock
    const warehouseOrder = { 'In stock': 1, 'On order': 2, 'out of stock': 3 };
    discountedProducts.sort((a: any, b: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      const aOrder = warehouseOrder[a.warehouse as keyof typeof warehouseOrder] || 4;
      const bOrder = warehouseOrder[b.warehouse as keyof typeof warehouseOrder] || 4;
      
      if (aOrder !== bOrder) {
        return aOrder - bOrder;
      }
      
      // Якщо наявність однакова, сортуємо за назвою
      return a.product_name.localeCompare(b.product_name);
    });
    
    // Беремо перші 20
    return discountedProducts.slice(0, 20);
  } catch (error) {
    console.error('Error fetching discounted products:', error);
    return [];
  }
}

export default async function Home() {
  const discountedProducts = await getDiscountedProducts();

  return (
    <section>
      <HeroVideoSection containerClassName="pb-[3px]">
        <div className="mx-auto flex h-full w-full max-w-7xl flex-col items-center justify-center gap-8 px-4 sm:px-6 lg:px-8 pt-12 pb-14">
          <div className="max-w-3xl text-center text-white drop-shadow">
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
              Cільськогосподарські шини преміум якості від Агро-Солар
            </h1>
            <p className="mt-4 text-base sm:text-lg text-white/90">
              Надійність, зчеплення та довговічність для тракторів, комбайнів, навантажувачів,
              обприскувачів і причепів.
            </p>
            <div className="mt-8 flex items-center gap-4">
              <Link href="/products" className="inline-flex h-11 items-center rounded-md bg-[#008e4ed3] px-6 text-white shadow-sm transition hover:opacity-90">
                До каталогу шин
              </Link>
            </div>
          </div>

          <div className="relative w-full max-w-4xl mx-auto">
            <HomeSizeFilter />
          </div>
        </div>
      </HeroVideoSection>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-bold mb-6">Категорії</h2>
        <CategoriesGrid />
      </div>

      {/* Discounted Products Section */}
      {discountedProducts.length > 0 && (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 bg-foreground/5">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2">Товари зі знижкою</h2>
            <p className="text-foreground/70">Спеціальні пропозиції на шини Trelleborg, CEAT</p>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
            {discountedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

interface CategoryItem {
  title: string;
  image?: string;
  video?: string;
  href: string;
  isSpecial?: boolean;
}

function CategoryCard({ category, isMobile = false }: { category: CategoryItem; isMobile?: boolean }) {
  const hasVideo = category.video && category.isSpecial;
  
  return (
    <Link
      href={category.href}
      className="group block rounded-lg border border-black/10 dark:border-white/10 overflow-hidden hover:shadow-md transition-all hover:-translate-y-0.5 bg-white dark:bg-black/20"
    >
      <div className="relative aspect-square w-full overflow-hidden">
        {hasVideo ? (
          <>
            {/* Мобільна версія: показуємо картинку */}
            {isMobile && (
              <Image
                src={category.image!}
                alt={category.title}
                fill
                sizes={isMobile ? "100vw" : "50vw"}
                className="object-cover"
                priority
              />
            )}
            {/* Десктопна версія */}
            {!isMobile && (
              <>
                {/* Для причіпної техніки: відео 16:9 на фоні зображення, без обрізання по висоті */}
                {category.title === "Шини для причіпної техніки" ? (
                  <>
                    {/* Відео: 16:9, на всю ширину блоку, притиснуте до верху */}
                    <div className="absolute inset-x-0 top-0">
                      <div className="relative w-full aspect-video">
                        <video
                          className="absolute inset-0 h-full w-full object-cover"
                          src={category.video}
                          autoPlay
                          muted
                          loop
                          playsInline
                          preload="metadata"
                        />
                      </div>
                    </div>
                    {/* Картинка на передньому плані поверх відео */}
                    <div className="relative z-10 flex h-full w-full items-center justify-center">
                      <div className="relative w-[80%] h-[80%]">
                        <Image
                          src="/trailer-caregory-01.webp"
                          alt={category.title}
                          fill
                          sizes="50vw"
                          className="object-contain drop-shadow-xl"
                          priority
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <video
                    className="absolute inset-0 w-full h-full object-cover"
                    src={category.video}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    poster={category.image}
                  />
                )}
              </>
            )}
          </>
        ) : (
          <>
            {category.image ? (
              <Image
                src={category.image}
                alt={category.title}
                fill
                sizes={isMobile ? "100vw" : "50vw"}
                className="object-cover"
                priority
              />
            ) : (
              <div className="h-full w-full bg-[#008e4ed3]/15" />
            )}
          </>
        )}
      </div>
      <div className="p-4 text-center">
        <p className="bg-yellow-400 text-black px-3 py-1 rounded-md inline-block font-medium">
          {category.title}
        </p>
      </div>
    </Link>
  );
}

function CategoriesGrid() {
  const categories: CategoryItem[] = [
    { title: "Шини для тракторів", image: "/tractor-caregory.avif", video: "/video-tractor-Reel.mp4", href: "/categories/%D0%A2%D1%80%D0%B0%D0%BA%D1%82%D0%BE%D1%80%D0%B8%20%D0%92%D0%B5%D0%BB%D0%B8%D0%BA%D0%BE%D1%97%20%D0%9F%D0%BE%D1%82%D1%83%D0%B6%D0%BD%D0%BE%D1%81%D1%82%D1%96", isSpecial: true },
    { title: "Шини для комбайнів", image: "/harvest-caregory.avif", video: "/website-video-harvester-reel.mp4", href: "/categories/%D0%9A%D0%BE%D0%BC%D0%B1%D0%B0%D0%B9%D0%BD%D0%B8", isSpecial: true },
    { title: "Шини для навантажувачів", image: "/loader-caregory.avif", href: "/categories/THL%2FCompact%20Loader" },
    { title: "Шини для обприскувачів", image: "/splayer-caregory.avif", video: "/website-video-sprayer-reel.mp4", href: "/categories/%D0%9E%D0%B1%D0%BF%D1%80%D0%B8%D1%81%D0%BA%D1%83%D0%B2%D0%B0%D1%87%D1%96", isSpecial: true },
    // Для мобільної версії причіпної техніки використовуємо іншу картинку без відео
    { title: "Шини для причіпної техніки", image: "/trailer-caregory.webp", video: "/Video_CEAT_FLOATMAX_VF_X3.mp4", href: "/categories/%D0%9D%D0%B0%D0%B2%D1%96%D1%81%D0%BD%D0%B5%20%D1%82%D0%B0%20%D0%9F%D1%80%D0%B8%D1%87%D1%96%D0%BF%D0%BD%D0%B5%20%D0%9E%D0%B1%D0%BB%D0%B0%D0%B4%D0%BD%D0%B0%D0%BD%D0%BD%D1%8F", isSpecial: true },
  ];

  const [firstCategory, ...otherCategories] = categories;

  return (
    <div className="space-y-4">
      {/* Мобільна версія: перша категорія на всю ширину, решта по 2 */}
      <div className="lg:hidden space-y-4">
        {/* Перша категорія - на всю ширину на мобільних */}
        <CategoryCard category={firstCategory} isMobile={true} />

        {/* Решта категорій - по 2 в ряд на мобільних */}
        <div className="grid grid-cols-2 gap-4">
          {otherCategories.map((category) => (
            <CategoryCard key={category.title} category={category} isMobile={true} />
          ))}
        </div>
      </div>

      {/* Десктопна версія: всі 5 категорій в одному рядку */}
      <div className="hidden lg:grid lg:grid-cols-5 gap-4">
        {categories.map((category) => (
          <CategoryCard key={category.title} category={category} isMobile={false} />
        ))}
      </div>
    </div>
  );
}

