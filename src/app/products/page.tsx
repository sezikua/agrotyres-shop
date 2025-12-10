'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchProducts, Product, PaginationInfo, getProductImageUrl } from '@/lib/api';
import ProductCard from '@/components/ProductCard';
import ProductFilters from '@/components/ProductFilters';
import { Loader2, Package, Grid, List, ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<string>('name');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const formatPrice = (price: string) => parseFloat(price).toLocaleString('uk-UA');

  const formatDiameterLabel = (diameter?: string | null) => {
    if (!diameter) return null;
    const num = parseFloat(diameter);
    if (Number.isNaN(num)) return `Ø${diameter}"`;
    return `Ø${num.toString()}"`;
  };

  const getWarehouseStatus = (warehouse: string, onTheWay?: boolean) => {
    if (warehouse.toLowerCase() === 'on order' && onTheWay === true) {
      return { text: 'Товар в дорозі', color: 'text-white', bg: '', customBg: '#0055aa' as string };
    }
    switch (warehouse.toLowerCase()) {
      case 'in stock':
        return { text: 'В наявності', color: 'text-background', bg: 'bg-primary', customBg: undefined };
      case 'on order':
        return { text: 'Під замовлення', color: 'text-black', bg: 'bg-yellow-400', customBg: undefined };
      case 'out of stock':
        return { text: 'Немає в наявності', color: 'text-black', bg: 'bg-red-500', customBg: undefined };
      default:
        return { text: warehouse, color: 'text-black', bg: 'bg-gray-500', customBg: undefined };
    }
  };

  const handleAddToCart = (productToAdd: Product) => {
    if (typeof window !== 'undefined') {
      const windowWithCart = window as Window & { addToCart?: (product: Product) => void };
      if (windowWithCart.addToCart) {
        windowWithCart.addToCart(productToAdd);
      }
    }
  };

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const response = await fetchProducts(currentPage, 30);
        setProducts(response.data);
        setFilteredProducts(response.data);
        setPagination(response.pagination);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Помилка завантаження товарів');
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [currentPage]);

  const handleFiltersChange = useCallback((filtered: Product[], pagination?: PaginationInfo) => {
    setFilteredProducts(filtered);
    if (pagination) {
      setPagination(pagination);
    }
  }, []);

  const handleLoadingChange = useCallback((loading: boolean) => {
    setLoading(loading);
  }, []);

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      // Якщо пошук порожній, завантажуємо всі товари
      setCurrentPage(1);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/products?search=${encodeURIComponent(query)}&limit=100`);
      const data = await response.json();
      
      if (data.data) {
        setFilteredProducts(data.data);
        setPagination(data.pagination);
        setCurrentPage(1);
      }
    } catch (error) {
      console.error('Помилка пошуку:', error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const sortProducts = (productsToSort: Product[]) => {
    const sorted = [...productsToSort];
    switch (sortBy) {
      case 'name':
        return sorted.sort((a, b) => a.product_name.localeCompare(b.product_name, 'uk'));
      case 'price-asc':
        return sorted.sort((a, b) => parseFloat(a.regular_price) - parseFloat(b.regular_price));
      case 'price-desc':
        return sorted.sort((a, b) => parseFloat(b.regular_price) - parseFloat(a.regular_price));
      case 'newest':
        return sorted.sort((a, b) => b.id - a.id);
      default:
        return sorted;
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const sortedProducts = sortProducts(filteredProducts);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-foreground/70">Завантаження товарів...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-foreground">Каталог с/г шин</h1>
          
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-foreground/50" />
              <input
                type="text"
                placeholder="Пошук товарів..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch(searchQuery);
                  }
                }}
                className="w-full pl-10 pr-10 py-3 border border-foreground/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    handleSearch('');
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-foreground/50 hover:text-foreground/70"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            {searchQuery && (
              <button
                onClick={() => handleSearch(searchQuery)}
                disabled={isSearching}
                className="mt-2 bg-primary text-background px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isSearching ? 'Пошук...' : 'Знайти'}
              </button>
            )}
          </div>
          
          <p className="text-foreground/70">
            {pagination && (
              <>
                Сторінка {pagination.page} з {pagination.totalPages} • 
                Показано {products.length} товарів з {pagination.totalItems} доступних
              </>
            )}
          </p>
        </div>

        <div className="lg:grid lg:grid-cols-4 lg:gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-20">
              <ProductFilters
                onFiltersChange={handleFiltersChange}
                onLoadingChange={handleLoadingChange}
              />
            </div>
          </div>

          {/* Products Grid */}
          <div className="lg:col-span-3">
            {/* Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              {/* Sort */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-foreground">Сортування:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-foreground/20 rounded-lg text-sm bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="name">За назвою</option>
                  <option value="price-asc">Від дешевших</option>
                  <option value="price-desc">Від дорожчих</option>
                  <option value="newest">Спочатку нові</option>
                </select>
              </div>

              {/* View Mode */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-primary/20 text-primary'
                      : 'bg-foreground/10 text-foreground/70 hover:bg-foreground/20'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'list'
                      ? 'bg-primary/20 text-primary'
                      : 'bg-foreground/10 text-foreground/70 hover:bg-foreground/20'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Products */}
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 mx-auto mb-4 text-foreground/40" />
                <h3 className="text-lg font-medium text-foreground mb-2">Товари не знайдено</h3>
                <p className="text-foreground/70">
                  Спробуйте змінити фільтри або пошуковий запит
                </p>
              </div>
            ) : (
              <>
                {viewMode === 'grid' ? (
                  <div className="grid gap-6 grid-cols-2 lg:grid-cols-3">
                    {sortedProducts.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sortedProducts.map((product) => {
                      const warehouseStatus = getWarehouseStatus(product.warehouse, product.on_the_way);
                      return (
                        <div
                          key={product.id}
                          className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 border border-foreground/10 rounded-xl bg-background shadow-sm hover:shadow-md transition-all"
                        >
                          <div className="relative h-20 w-20 bg-foreground/5 rounded-lg overflow-hidden flex-shrink-0">
                            <Image
                              src={getProductImageUrl(product.product_image)}
                              alt={product.product_name}
                              fill
                              className="object-contain"
                              sizes="80px"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/placeholder-image.svg';
                              }}
                            />
                          </div>

                          <div className="flex-1 min-w-0 w-full">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="text-xs text-foreground/70 bg-foreground/10 px-2 py-1 rounded-full">
                                {product.Category}
                              </span>
                              <span className="text-xs text-foreground/70 bg-foreground/10 px-2 py-1 rounded-full">
                                {product.Segment}
                              </span>
                              <span
                                className={`text-xs font-medium px-2 py-1 rounded-full ${warehouseStatus.bg} ${warehouseStatus.color}`}
                                style={warehouseStatus.customBg ? { backgroundColor: warehouseStatus.customBg } : undefined}
                              >
                                {warehouseStatus.text}
                              </span>
                            </div>

                            <Link href={`/products/${encodeURIComponent(product.slug || String(product.id))}`}>
                              <h3 className="font-semibold text-foreground mb-1 line-clamp-1 hover:text-primary transition-colors">
                                {product.product_name}
                              </h3>
                            </Link>

                            <div className="text-sm text-foreground/70 flex flex-wrap gap-3">
                              <span><strong className="text-foreground">Модель:</strong> {product.model}</span>
                              <span><strong className="text-foreground">Розмір:</strong> {product.size}</span>
                              {product.diameter && (
                                <span><strong className="text-foreground">Діаметр:</strong> {formatDiameterLabel(product.diameter)}</span>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col sm:items-end gap-2 w-full sm:w-auto">
                            <div className="text-right">
                              {product.discount_price ? (
                                <div className="flex flex-row sm:flex-col items-start sm:items-end gap-2">
                                  <span className="text-lg font-bold text-red-600">
                                    {formatPrice(product.discount_price)} грн
                                  </span>
                                  <span className="text-sm text-foreground/50 line-through">
                                    {formatPrice(product.regular_price)} грн
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xl font-bold text-foreground">
                                  {formatPrice(product.regular_price)} грн
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2 justify-end">
                              <button
                                onClick={() => handleAddToCart(product)}
                                disabled={product.warehouse.toLowerCase() === 'out of stock'}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                  product.warehouse.toLowerCase() === 'out of stock'
                                    ? 'bg-foreground/20 text-foreground/50 cursor-not-allowed'
                                    : 'bg-primary text-background hover:bg-primary/90'
                                }`}
                              >
                                {product.warehouse.toLowerCase() === 'out of stock' ? 'Немає в наявності' : 'Додати в кошик'}
                              </button>
                              <Link
                                href={`/products/${encodeURIComponent(product.slug || String(product.id))}`}
                                className="px-4 py-2 rounded-lg text-sm font-medium border border-foreground/20 text-foreground hover:border-primary hover:text-primary transition-colors"
                              >
                                Детальніше
                              </Link>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center">
                <nav className="flex items-center gap-2">
                  {/* Previous Page */}
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={!pagination.hasPrev}
                    className={`p-2 rounded-lg transition-colors ${
                      pagination.hasPrev
                        ? 'bg-primary/20 text-primary hover:bg-primary/30'
                        : 'bg-foreground/10 text-foreground/40 cursor-not-allowed'
                    }`}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  {/* Page Numbers */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      let pageNum;
                      if (pagination.totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            currentPage === pageNum
                              ? 'bg-primary text-background'
                              : 'bg-foreground/10 text-foreground hover:bg-foreground/20'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  {/* Next Page */}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!pagination.hasNext}
                    className={`p-2 rounded-lg transition-colors ${
                      pagination.hasNext
                        ? 'bg-primary/20 text-primary hover:bg-primary/30'
                        : 'bg-foreground/10 text-foreground/40 cursor-not-allowed'
                    }`}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </nav>
              </div>
            )}

            {/* Page Info */}
            {pagination && (
                          <div className="mt-4 text-center text-sm text-foreground/70">
              Сторінка {pagination.page} з {pagination.totalPages} • 
              Всього товарів: {pagination.totalItems}
            </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
