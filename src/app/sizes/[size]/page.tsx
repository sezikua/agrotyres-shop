'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { fetchProductsBySize, Product } from '@/lib/api';
import ProductCard from '@/components/ProductCard';
import ProductFilters from '@/components/ProductFilters';
import { Loader2, Package } from 'lucide-react';
import Link from 'next/link';
import { deriveSizeSeoData } from '@/lib/sizeSeo';
import { useMemo } from 'react';

export default function SizePage() {
  const params = useParams();
  const [, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProducts = async () => {
      if (!params.size) return;
      
      try {
        setLoading(true);
        const size = decodeURIComponent(params.size as string);
        const data = await fetchProductsBySize(size);
        setProducts(data.data);
        setFilteredProducts(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Помилка завантаження товарів');
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [params.size]);

  const handleFiltersChange = (filtered: Product[]) => {
    setFilteredProducts(filtered);
  };

  const handleLoadingChange = (loading: boolean) => {
    setLoading(loading);
  };

  const rawSizeParam = params.size as string;
  const sizeName = decodeURIComponent(rawSizeParam);
  const sizeHref = `/sizes/${encodeURIComponent(sizeName)}`;
  const sizeSeo = useMemo(() => deriveSizeSeoData(filteredProducts), [filteredProducts]);
  const categoriesListForDisplay = sizeSeo.categoriesList || "різної техніки";
  const segmentsDescription = sizeSeo.segmentsDescription || "різних напрямів аграрної та індустріальної техніки";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-foreground/70">Завантаження товарів...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Package className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Помилка завантаження</h2>
          <p className="text-foreground/70 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-primary text-background px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Спробувати знову
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <nav
            aria-label="Breadcrumb"
            className="mb-4 text-sm"
            itemScope
            itemType="https://schema.org/BreadcrumbList"
          >
            <ol className="flex flex-wrap items-center gap-2 text-foreground/70">
              <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                <Link itemProp="item" href="/" className="hover:text-foreground transition-colors">
                  <span itemProp="name">Головна</span>
                </Link>
                <meta itemProp="position" content="1" />
              </li>
              <span className="text-foreground/40">/</span>
              <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                <Link itemProp="item" href="/products" className="hover:text-foreground transition-colors">
                  <span itemProp="name">Каталог шин</span>
                </Link>
                <meta itemProp="position" content="2" />
              </li>
              <span className="text-foreground/40">/</span>
              <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem" className="text-foreground">
                <Link itemProp="item" href={sizeHref} aria-current="page" className="font-semibold">
                  <span itemProp="name">Розмір {sizeName}</span>
            </Link>
                <meta itemProp="position" content="3" />
              </li>
            </ol>
          </nav>
          
          <h1 className="text-3xl font-bold text-foreground mb-2">
            На сторінці представлені шини розміру {sizeName} для {categoriesListForDisplay}
          </h1>
          <p className="text-foreground/70">
            Знайдено {filteredProducts.length} товарів розміру &ldquo;{sizeName}&rdquo;
          </p>
        </div>

        <div className="lg:grid lg:grid-cols-4 lg:gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <ProductFilters 
              onFiltersChange={handleFiltersChange}
              onLoadingChange={handleLoadingChange}
              currentSize={sizeName}
            />
          </div>

          {/* Products Grid */}
          <div className="lg:col-span-3">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 mx-auto mb-4 text-foreground/40" />
                <h3 className="text-lg font-medium text-foreground mb-2">Товари не знайдено</h3>
                <p className="text-foreground/70">
                  У цьому розмірі поки немає товарів
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
        <section className="mt-12 bg-white dark:bg-black/20 border border-black/5 dark:border-white/10 rounded-2xl p-6 sm:p-8 shadow-sm space-y-4 text-foreground/80">
          <h2 className="text-2xl font-semibold text-foreground">
            Повний гайд по шинам {sizeName}
          </h2>
          <p>
            У цьому розділі представлений повний каталог шин {sizeName}, який охоплює {segmentsDescription}. ТОВ
            &ldquo;Агро-Солар&rdquo; пропонує перевірені рішення для роботи на {categoriesListForDisplay}, гарантуючи, що
            ви знайдете оптимальні шини в розмірі {sizeName} для конкретної машини. ТОВ &ldquo;Агро-Солар&rdquo; є
            офіційним імпортером таких відомих брендів шин: CEAT, Trelleborg та Mitas, та надає офіційну гарантію на шини
            від заводу виробника.
          </p>
          <p>
            Шини {sizeName} у нашому каталозі спеціально створені для надійного зчеплення, стабільного розподілу
            навантаження та мінімального тиску на ґрунт або для стійкості на твердих поверхнях. Це критично важливо як
            для продуктивності, так і для безпеки екіпажу. Пропонуємо широкий вибір радіальних і діагональних моделей,
            що дозволяє підібрати шини розміру {sizeName} для оптимальної, продуктивної роботи техніки у вашому
            підприємстві. Детальні характеристики допомагають порівняти вантажопідйомність, рівень зчеплення та
            рекомендований тиск, тож пошук шин в розмірі {sizeName} стає виваженим і професійним.
          </p>
          <p>
            Ми регулярно оновлюємо склад, щоб ви могли знайти найвигіднішу ціну на {sizeName}. ТОВ &ldquo;Агро-Солар&rdquo;
            забезпечує комплексний сервіс: консультації, оплата по безготівковому розрахунку з ПДВ, логістичний супровід
            та офіційну гарантію виробників. Отримайте актуальні наявності та підтримку від професіоналів з великим
            досвідом роботи в галузі шин до сільськогосподарської та спеціальної техніки. Замовляйте шини {sizeName} в
            ТОВ &ldquo;Агро-Солар&rdquo; з доставкою по всій Україні та модернізуйте свій парк техніки без простоїв.
          </p>
        </section>
      </div>
    </div>
  );
}
