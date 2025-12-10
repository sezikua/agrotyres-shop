'use client';

import { useState, useEffect } from 'react';
import { Product, fetchSimilarProducts, getProductImageUrl } from '@/lib/api';
import { ShoppingCart, Package } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';

interface SimilarProductsProps {
  currentProductId: number;
  size: string;
}

export default function SimilarProducts({ currentProductId, size }: SimilarProductsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSimilarProducts = async () => {
      try {
        setLoading(true);
        const data = await fetchSimilarProducts(size);
        // Filter out the current product
        const filteredProducts = data.filter(product => product.id !== currentProductId);
        setProducts(filteredProducts);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Помилка завантаження схожих товарів');
      } finally {
        setLoading(false);
      }
    };

    if (size) {
      loadSimilarProducts();
    }
  }, [currentProductId, size]);

  const formatPrice = (price: string) => {
    return parseFloat(price).toLocaleString('uk-UA');
  };

  const getWarehouseStatus = (warehouse: string, onTheWay?: boolean) => {
    // Special case: "Товар в дорозі" when warehouse is "On order" and on_the_way is true
    if (warehouse.toLowerCase() === 'on order' && onTheWay === true) {
      return { text: 'Товар в дорозі', color: 'text-white', bg: '', customBg: '#0055aa' };
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

  const handleAddToCart = (product: Product) => {
    if (typeof window !== 'undefined') {
      const windowWithCart = window as Window & { addToCart?: (product: Product) => void };
      if (windowWithCart.addToCart) {
        windowWithCart.addToCart(product);
      }
    }
  };

  if (loading) {
    return (
      <div className="mt-16">
        <h2 className="text-2xl font-bold text-foreground mb-6">Товари того ж розміру</h2>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-foreground/70">Завантаження схожих товарів...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-16">
        <h2 className="text-2xl font-bold text-foreground mb-6">Товари того ж розміру</h2>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Package className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <p className="text-foreground/70">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="mt-16">
        <h2 className="text-2xl font-bold text-foreground mb-6">Товари того ж розміру</h2>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Package className="w-16 h-16 mx-auto mb-4 text-foreground/30" />
            <p className="text-foreground/70">Товарів того ж розміру не знайдено</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-16">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Товари того ж розміру ({size})
        </h2>
        <p className="text-foreground/70">
          Знайдено {products.length} товарів того ж розміру, відсортованих за наявністю
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => {
          const warehouseStatus = getWarehouseStatus(product.warehouse, product.on_the_way);
          
          return (
            <div
              key={product.id}
              className="bg-background border border-foreground/10 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group"
            >
              <Link href={`/products/${encodeURIComponent(product.slug || String(product.id))}`}>
                <div className="aspect-square bg-background overflow-hidden relative">
                  <Image
                    src={getProductImageUrl(product.product_image)}
                    alt={product.product_name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder-image.svg';
                    }}
                  />
                  
                  {/* Brand Logo - top right */}
                  {getBrandLogo(product.brand) && (
                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-lg p-1.5 shadow-lg">
                      <Image
                        src={getBrandLogo(product.brand)!}
                        alt={product.brand || 'Brand'}
                        width={30}
                        height={15}
                        className="object-contain"
                      />
                    </div>
                  )}
                </div>
              </Link>

              <div className="p-4">
                {/* Warehouse Status */}
                <div 
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium mb-3 ${warehouseStatus.bg} ${warehouseStatus.color}`}
                  style={warehouseStatus.customBg ? { backgroundColor: warehouseStatus.customBg } : undefined}
                >
                  {warehouseStatus.text}
                </div>

                {/* Product Info */}
                <Link href={`/products/${encodeURIComponent(product.slug || String(product.id))}`}>
                  <h3 className="font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                    {product.product_name}
                  </h3>
                </Link>

                <div className="text-sm text-foreground/70 mb-3">
                  {product.brand && (
                    <div className="flex items-center gap-1 mb-2">
                      <Image
                        src={getBrandLogo(product.brand)!}
                        alt={product.brand}
                        width={16}
                        height={8}
                        className="object-contain"
                      />
                      <span><strong>Бренд:</strong> {product.brand}</span>
                    </div>
                  )}
                  <p><strong>Модель:</strong> {product.model}</p>
                  <p><strong>Категорія:</strong> {product.Category}</p>
                  <p><strong>Сегмент:</strong> {product.Segment}</p>
                </div>

                {/* Price */}
                <div className="mb-4">
                  {product.discount_price ? (
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-red-600">
                        {formatPrice(product.discount_price)} грн
                      </span>
                      <span className="text-sm text-foreground/50 line-through">
                        {formatPrice(product.regular_price)} грн
                      </span>
                    </div>
                  ) : (
                    <span className="text-lg font-bold text-foreground">
                      {formatPrice(product.regular_price)} грн
                    </span>
                  )}
                </div>

                {/* Add to Cart Button */}
                <button
                  onClick={() => handleAddToCart(product)}
                  disabled={product.warehouse.toLowerCase() === 'out of stock'}
                  className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-medium transition-colors ${
                    product.warehouse.toLowerCase() === 'out of stock'
                      ? 'bg-foreground/20 text-foreground/50 cursor-not-allowed'
                      : 'bg-primary text-background hover:bg-primary/90'
                  }`}
                >
                  <ShoppingCart className="w-4 h-4" />
                  {product.warehouse.toLowerCase() === 'out of stock' ? 'Немає в наявності' : 'Додати в кошик'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
