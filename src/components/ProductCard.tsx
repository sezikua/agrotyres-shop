'use client';

import { useState } from 'react';
import { ShoppingCart, Eye } from 'lucide-react';
import { Product, getProductImageUrl } from '@/lib/api';
import Link from 'next/link';
import Image from 'next/image';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);

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
        // Match Add-to-cart button primary color
        return { text: 'В наявності', color: 'text-background', bg: 'bg-primary', customBg: undefined };
      case 'on order':
        return { text: 'Під замовлення', color: 'text-black', bg: 'bg-yellow-400', customBg: undefined };
      case 'out of stock':
        return { text: 'Немає в наявності', color: 'text-black', bg: 'bg-red-500', customBg: undefined };
      default:
        return { text: warehouse, color: 'text-black', bg: 'bg-gray-500', customBg: undefined };
    }
  };

  const warehouseStatus = getWarehouseStatus(product.warehouse, product.on_the_way);

  const formatDiameterLabel = (diameter?: string | null) => {
    if (!diameter) return null;
    const num = parseFloat(diameter);
    if (Number.isNaN(num)) return `Ø${diameter}\"`;
    return `Ø${num.toString()}\"`;
  };

  const handleAddToCart = (productToAdd: Product) => {
    if (typeof window !== 'undefined') {
      const windowWithCart = window as Window & { addToCart?: (product: Product) => void };
      if (windowWithCart.addToCart) {
        windowWithCart.addToCart(productToAdd);
      }
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

  return (
    <div
      className="bg-background text-foreground rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group border border-foreground/10"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Clickable area to open product */}
      <Link href={`/products/${encodeURIComponent(product.slug || String(product.id))}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-foreground/5">
          <Image
            src={getProductImageUrl(product.product_image)}
            alt={product.product_name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={`object-contain transition-transform duration-300 ${
              isHovered ? 'scale-105' : 'scale-100'
            }`}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/placeholder-image.svg';
            }}
          />

          {/* Warehouse Status Badge */}
          <div 
            className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium ${warehouseStatus.bg} ${warehouseStatus.color}`}
            style={warehouseStatus.customBg ? { backgroundColor: warehouseStatus.customBg } : undefined}
          >
            {warehouseStatus.text}
          </div>

          {/* Brand Logo - top right */}
          {getBrandLogo(product.brand) && (
            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg">
              <Image
                src={getBrandLogo(product.brand)!}
                alt={product.brand || 'Brand'}
                width={40}
                height={20}
                className="object-contain"
              />
            </div>
          )}

          {/* Quick Actions (no link to avoid nested <a>) */}
          <div className={`absolute top-3 right-3 flex flex-col gap-2 transition-all duration-300 ${
            isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
          } ${getBrandLogo(product.brand) ? 'mt-12' : ''}`}>
            <div className="w-8 h-8 bg-background rounded-full shadow-lg flex items-center justify-center">
              <Eye className="w-4 h-4 text-foreground/70" />
            </div>
          </div>

          {/* Discount Badge - moved to bottom right if brand logo exists */}
          {product.discount_price && (
            <div className={`absolute bottom-3 ${getBrandLogo(product.brand) ? 'right-3' : 'left-3'} bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg`}>
              -{Math.round(((parseFloat(product.regular_price) - parseFloat(product.discount_price)) / parseFloat(product.regular_price)) * 100)}%
            </div>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="p-4">
        {/* Category & Segment */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="text-xs text-foreground/70 bg-foreground/10 px-2 py-1 rounded-full">
            {product.Category}
          </span>
          <span className="text-xs text-foreground/70 bg-foreground/10 px-2 py-1 rounded-full">
            {product.Segment}
          </span>
        </div>

        {/* Product Name */}
        <Link href={`/products/${encodeURIComponent(product.slug || String(product.id))}`} className="block">
          <h3 className="font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {product.product_name}
          </h3>
        </Link>

        {/* Model & Size */}
        <div className="flex items-center gap-2 mb-3 text-sm text-foreground/70">
          <span className="font-medium text-foreground">{product.model}</span>
          <span className="text-foreground/40">•</span>
          <span>{product.size}</span>
          {product.diameter && (
            <>
              <span className="text-foreground/40">•</span>
              <span>{formatDiameterLabel(product.diameter)}</span>
            </>
          )}
        </div>

        {/* Price */}
        <div className="flex items-center gap-3 mb-4">
          {product.discount_price ? (
            <>
              <span className="text-lg font-bold text-red-600">
                {formatPrice(product.discount_price)} грн
              </span>
              <span className="text-sm text-foreground/50 line-through">
                {formatPrice(product.regular_price)} грн
              </span>
            </>
          ) : (
            <span className="text-xl font-bold text-foreground">
              {formatPrice(product.regular_price)} грн
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => handleAddToCart(product)}
            disabled={product.warehouse.toLowerCase() === 'out of stock'}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-medium transition-colors ${
              product.warehouse.toLowerCase() === 'out of stock'
                ? 'bg-foreground/20 text-foreground/50 cursor-not-allowed'
                : 'bg-primary text-background hover:bg-primary/90'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            {product.warehouse.toLowerCase() === 'out of stock' ? 'Немає в наявності' : 'Додати в кошик'}
          </button>
        </div>

        {/* SKU */}
        <div className="mt-3 text-xs text-foreground/50 text-center">
          SKU: {product.sku}
        </div>
      </div>
    </div>
  );
}
