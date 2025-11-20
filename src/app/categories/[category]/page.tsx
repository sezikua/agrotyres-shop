'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { fetchProductsByCategory, Product } from '@/lib/api';
import { getCategoryDescription } from '@/lib/categoryDescriptions';
import { mapCategoryToApi } from '@/lib/categoryMap';
import ProductCard from '@/components/ProductCard';
import ProductFilters from '@/components/ProductFilters';
import { Loader2, Package, ArrowLeft, CheckCircle, Star, Truck } from 'lucide-react';
import Link from 'next/link';

export default function CategoryPage() {
  const params = useParams();
  const [, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProducts = async () => {
      if (!params.category) return;
      
      try {
        setLoading(true);
        const category = decodeURIComponent(params.category as string);
        const apiCategory = mapCategoryToApi(category);
        const data = await fetchProductsByCategory(apiCategory);
        setProducts(data.data);
        setFilteredProducts(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Помилка завантаження товарів');
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [params.category]);

  const handleFiltersChange = (filtered: Product[]) => {
    setFilteredProducts(filtered);
  };

  const handleLoadingChange = (loading: boolean) => {
    setLoading(loading);
  };

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
          <Link
            href="/products"
            className="bg-primary text-background px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Повернутися до магазину
          </Link>
        </div>
      </div>
    );
  }

  const categoryName = decodeURIComponent(params.category as string);
  const apiCategory = mapCategoryToApi(categoryName);
  const categoryDesc = getCategoryDescription(categoryName) || getCategoryDescription(apiCategory);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <nav className="mb-4">
            <Link
              href="/products"
              className="inline-flex items-center text-sm text-foreground/70 hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Повернутися до магазину
            </Link>
          </nav>
          
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {categoryDesc?.title || `Категорія: ${categoryName}`}
          </h1>
          <p className="text-foreground/70 text-lg mb-4">
            {categoryDesc?.description || `Знайдено ${filteredProducts.length} товарів у категорії "${categoryName}"`}
          </p>
        </div>

        {/* Category Description Section */}
        {categoryDesc && (
          <div className="mb-12 bg-white dark:bg-black/20 rounded-lg p-8 shadow-sm border border-black/10 dark:border-white/10">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Main Description */}
              <div>
                <h2 className="text-2xl font-semibold text-foreground mb-4">Про категорію</h2>
                <p className="text-foreground/80 leading-relaxed mb-6">
                  {categoryDesc.longDescription}
                </p>
                
                {/* Features */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center">
                    <Star className="w-5 h-5 mr-2 text-primary" />
                    Ключові особливості
                  </h3>
                  <ul className="space-y-2">
                    {categoryDesc.features.map((feature, index) => (
                      <li key={index} className="flex items-start text-foreground/80">
                        <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Benefits & Applications */}
              <div className="space-y-6">
                {/* Benefits */}
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center">
                    <Truck className="w-5 h-5 mr-2 text-primary" />
                    Переваги
                  </h3>
                  <ul className="space-y-2">
                    {categoryDesc.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-start text-foreground/80">
                        <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Applications */}
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">Сфери застосування</h3>
                  <div className="flex flex-wrap gap-2">
                    {categoryDesc.applications.map((app, index) => (
                      <span 
                        key={index}
                        className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                      >
                        {app}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="lg:grid lg:grid-cols-4 lg:gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <ProductFilters 
              onFiltersChange={handleFiltersChange}
              onLoadingChange={handleLoadingChange}
              currentCategory={apiCategory}
            />
          </div>

          {/* Products Grid */}
          <div className="lg:col-span-3">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 mx-auto mb-4 text-foreground/40" />
                <h3 className="text-lg font-medium text-foreground mb-2">Товари не знайдено</h3>
                <p className="text-foreground/70">
                  У цій категорії поки немає товарів
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
      </div>
    </div>
  );
}

