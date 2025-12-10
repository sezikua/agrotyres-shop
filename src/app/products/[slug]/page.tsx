'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { fetchProductBySlug, Product, getProductImageUrl } from '@/lib/api';
import { ShoppingCart, ArrowLeft, Truck, Shield, Clock } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Loader2, Package } from 'lucide-react';
import SimilarProducts from '@/components/SimilarProducts';

export default function ProductPageBySlug() {
  const params = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'description' | 'specs'>('description');

  useEffect(() => {
    const loadProduct = async () => {
      const slugParam = (params as Record<string, string | string[] | undefined>).slug;
      const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;
      if (!slug) return;
      try {
        setLoading(true);
        const data = await fetchProductBySlug(slug);
        setProduct(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Помилка завантаження товару');
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [params]);

  const formatPrice = (price: string) => {
    return parseFloat(price).toLocaleString('uk-UA');
  };

  const getWarehouseStatus = (warehouse: string, onTheWay?: boolean) => {
    // Special case: "Товар в дорозі" when warehouse is "On order" and on_the_way is true
    if (warehouse.toLowerCase() === 'on order' && onTheWay === true) {
      return { text: 'Товар в дорозі', color: 'text-white', bg: '', customBg: '#0055aa', icon: '🚚' };
    }
    
    switch (warehouse.toLowerCase()) {
      case 'in stock':
        return { text: 'В наявності', color: 'text-background', bg: 'bg-primary', customBg: undefined, icon: '✓' };
      case 'on order':
        return { text: 'Під замовлення', color: 'text-black', bg: 'bg-yellow-400', customBg: undefined, icon: '⏳' };
      case 'out of stock':
        return { text: 'Немає в наявності', color: 'text-black', bg: 'bg-red-500', customBg: undefined, icon: '✗' };
      default:
        return { text: warehouse, color: 'text-black', bg: 'bg-gray-500', customBg: undefined, icon: '?' };
    }
  };

  const formatDiameter = (diameter?: string | null) => {
    if (!diameter) return '';
    const num = parseFloat(diameter);
    if (Number.isNaN(num)) return diameter;
    return num.toString();
  };

  const getBrandLogo = (brand?: string) => {
    if (!brand) return null;
    switch (brand.toUpperCase()) {
      case 'CEAT':
        return '/CEAT_Logo.svg';
      case 'TRELLEBORG':
        return '/Trelleborg_Logo.svg';
      default:
        return null;
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-foreground/70">Завантаження товару...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Package className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Товар не знайдено</h2>
          <p className="text-foreground/70 mb-4">{error || 'Товар не існує'}</p>
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

  const warehouseStatus = getWarehouseStatus(product.warehouse, product.on_the_way);
  const brandUpper = (product.brand || '').toUpperCase();
  const brandDisplay = brandUpper === 'TRELLEBORG' ? 'Trelleborg' : 'CEAT';
  const warrantyYears = brandUpper === 'TRELLEBORG' ? 6 : 7;

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="mb-8">
          <Link
            href="/products"
            className="inline-flex items-center text-sm text-foreground/70 hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Повернутися до магазину
          </Link>
        </nav>

        <div className="lg:grid lg:grid-cols-2 lg:gap-12">
          <div className="mb-8 lg:mb-0">
            <div className="aspect-square bg-background border border-foreground/10 rounded-xl shadow-lg overflow-hidden mb-4 relative">
              <Image
                src={getProductImageUrl(product.product_image)}
                alt={product.product_name}
                fill
                className="object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder-image.svg';
                }}
              />
              
              {/* Brand Logo - top right */}
              {getBrandLogo(product.brand) && (
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg">
                  <Image
                    src={getBrandLogo(product.brand)!}
                    alt={product.brand || 'Brand'}
                    width={50}
                    height={25}
                    className="object-contain"
                  />
                </div>
              )}

              {/* Warehouse Status - top left over image */}
              <div 
                className={`absolute top-3 left-3 z-10 px-2 py-1 rounded-full text-xs font-medium ${warehouseStatus.bg} ${warehouseStatus.color}`}
                style={warehouseStatus.customBg ? { backgroundColor: warehouseStatus.customBg } : undefined}
              >
                <span className="mr-1">{warehouseStatus.icon}</span>
                {warehouseStatus.text}
              </div>
            </div>
          </div>

          <div>
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                {product.brand && (
                  <div className="flex items-center gap-1 text-sm text-foreground/70 bg-yellow-100 px-2 py-1 rounded-full">
                    <Image
                      src={getBrandLogo(product.brand)!}
                      alt={product.brand}
                      width={20}
                      height={10}
                      className="object-contain"
                    />
                    <span>{product.brand}</span>
                  </div>
                )}
                <span className="text-sm text-foreground/70 bg-foreground/10 px-2 py-1 rounded-full">
                  {product.Category}
                </span>
                <span className="text-sm text-foreground/70 bg-foreground/10 px-2 py-1 rounded-full">
                  {product.Segment}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-3">
                {product.product_name}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-foreground/70">
                <span><strong className="text-foreground">Модель:</strong> <span className="text-foreground/70">{product.model}</span></span>
                <span><strong className="text-foreground">Розмір:</strong> <span className="text-foreground/70">{product.size}</span></span>
                {product.diameter && (
                  <span><strong className="text-foreground">Діаметр:</strong> <span className="text-foreground/70">{formatDiameter(product.diameter)}&quot;</span></span>
                )}
              </div>
            </div>

            <div className="mb-6">
              {product.discount_price ? (
                <div className="flex items-center gap-4">
                  <span className="text-3xl font-bold text-red-600">
                    {formatPrice(product.discount_price)} грн
                  </span>
                  <span className="text-xl text-foreground/50 line-through">
                    {formatPrice(product.regular_price)} грн
                  </span>
                  <span className="bg-red-500 text-white px-2 py-1 rounded-full text-sm font-bold">
                    -{Math.round(((parseFloat(product.regular_price) - parseFloat(product.discount_price)) / parseFloat(product.regular_price)) * 100)}%
                  </span>
                </div>
              ) : (
                <span className="text-3xl font-bold text-foreground">
                  {formatPrice(product.regular_price)} грн
                </span>
              )}
            </div>

            <div className="mb-8">
              <button
                onClick={() => handleAddToCart(product)}
                disabled={product.warehouse.toLowerCase() === 'out of stock'}
                className={`w-full flex items-center justify-center gap-3 py-4 px-6 rounded-xl font-semibold text-lg transition-colors ${
                  product.warehouse.toLowerCase() === 'out of stock'
                    ? 'bg-foreground/20 text-foreground/50 cursor-not-allowed'
                    : 'bg-primary text-background hover:bg-primary/90'
                }`}
              >
                <ShoppingCart className="w-5 h-5" />
                {product.warehouse.toLowerCase() === 'out of stock' ? 'Немає в наявності' : 'Додати в кошик'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="flex items-center gap-3 p-3 bg-foreground/5 rounded-lg">
                <Truck className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-foreground">Безкоштовна доставка</p>
                  <p className="text-xs text-foreground/70">При замовленні від 5000 грн</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-foreground/5 rounded-lg">
                <Shield className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-foreground">Гарантія якості</p>
                  <p className="text-xs text-foreground/70">Офіційна гарантія {brandDisplay} — {warrantyYears} років</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-foreground/5 rounded-lg">
                <Clock className="w-5 h5 text-orange-600" />
                <div>
                  <p className="text-sm font-medium text-foreground">Офіційний імпортер</p>
                  <p className="text-xs text-foreground/70">→ Прямі поставки від {brandDisplay}, без посередників</p>
                </div>
              </div>
            </div>

            <div className="text-sm text-foreground/70">
              <strong className="text-foreground">SKU:</strong> <span className="text-foreground/70">{product.sku}</span>
            </div>
          </div>
        </div>

        {(product.description || product.specifications) && (
          <div className="mt-16">
            <div className="flex gap-2 border-b border-foreground/10 mb-6">
              {product.description && (
                <button
                  type="button"
                  onClick={() => setActiveTab('description')}
                  className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
                    activeTab === 'description'
                      ? 'bg-foreground/10 text-foreground'
                      : 'text-foreground/70 hover:text-foreground'
                  }`}
                >
                  Опис товару
                </button>
              )}
              {product.specifications && (
                <button
                  type="button"
                  onClick={() => setActiveTab('specs')}
                  className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
                    activeTab === 'specs'
                      ? 'bg-foreground/10 text-foreground'
                      : 'text-foreground/70 hover:text-foreground'
                  }`}
                >
                  Технічні характеристики
                </button>
              )}
            </div>

            <div className="rounded-xl border border-foreground/10 p-5 bg-background/50">
              {activeTab === 'description' && product.description && (
                <div
                  className="prose prose-foreground max-w-none text-foreground"
                  dangerouslySetInnerHTML={{ __html: product.description.replace(/\n/g, '<br>') }}
                />
              )}
              {activeTab === 'specs' && product.specifications && (
                <div
                  className="prose prose-foreground max-w-none text-foreground"
                  dangerouslySetInnerHTML={{ __html: product.specifications.replace(/\n/g, '<br>') }}
                />
              )}
            </div>
          </div>
        )}

        <SimilarProducts 
          currentProductId={product.id} 
          size={product.size} 
        />
      </div>
    </div>
  );
}


