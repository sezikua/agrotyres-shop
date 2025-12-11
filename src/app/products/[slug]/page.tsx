'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { fetchProductBySlug, Product, getProductImageUrl } from '@/lib/api';
import { ShoppingCart, ArrowLeft, Truck, Shield, Clock } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Loader2, Package } from 'lucide-react';
import SimilarProducts from '@/components/SimilarProducts';

type CCalcEntry = {
  pressure: string;
  speed: string;
  load: string;
};

type CCalcData = {
  PermittedRims?: string;
  cclist?: CCalcEntry[];
  meta?: {
    OD?: string;
    RC?: string;
    SRI?: string;
    RimWidth?: string;
    PermittedRims?: string;
  };
};

export default function ProductPageBySlug() {
  const params = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'description' | 'specs'>('description');
  const [trelleborgHtml, setTrelleborgHtml] = useState<string | null>(null);
  const [trelleborgLoading, setTrelleborgLoading] = useState(false);
  const [trelleborgError, setTrelleborgError] = useState<string | null>(null);
  const [ccalc, setCcalc] = useState<CCalcData | null>(null);
  const [ccalcLoading, setCcalcLoading] = useState(false);
  const [ccalcError, setCcalcError] = useState<string | null>(null);
  const [selectedSpeed, setSelectedSpeed] = useState<string>('');
  const [selectedLoad, setSelectedLoad] = useState<string>('');

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

  useEffect(() => {
    const loadTable = async () => {
      if (!product) {
        setTrelleborgHtml(null);
        setTrelleborgError(null);
        setTrelleborgLoading(false);
        return;
      }

      const brand = (product.brand || '').toUpperCase();
      if (brand !== 'TRELLEBORG' || !product.sku) {
        setTrelleborgHtml(null);
        setTrelleborgError(null);
        setTrelleborgLoading(false);
        return;
      }

      try {
        setTrelleborgLoading(true);
        setTrelleborgError(null);
        const res = await fetch(`/api/trelleborg/size?sku=${encodeURIComponent(product.sku)}`);
        if (!res.ok) {
          throw new Error(`Таблицю не знайдено (код ${res.status})`);
        }
        const data = (await res.json()) as { html?: string };
        setTrelleborgHtml(data.html ?? null);
      } catch (err) {
        console.error('[product-page] failed to load Trelleborg table', err);
        setTrelleborgHtml(null);
        setTrelleborgError('Не вдалося завантажити технічну таблицю Trelleborg');
      } finally {
        setTrelleborgLoading(false);
      }
    };

    loadTable();
  }, [product]);

  useEffect(() => {
    const loadCcalc = async () => {
      if (!product) {
        setCcalc(null);
        setCcalcError(null);
        setCcalcLoading(false);
        return;
      }
      const brand = (product.brand || '').toUpperCase();
      if (brand !== 'TRELLEBORG' || !product.sku) {
        setCcalc(null);
        setCcalcError(null);
        setCcalcLoading(false);
        return;
      }

      try {
        setCcalcLoading(true);
        setCcalcError(null);
        const res = await fetch(`/api/trelleborg/ccalc?sku=${encodeURIComponent(product.sku)}`);
        if (!res.ok) {
          throw new Error(`Калькулятор не знайдено (код ${res.status})`);
        }
        const data = (await res.json()) as CCalcData;
        setCcalc(data);
        const speeds = Array.from(new Set((data.cclist ?? []).map((i) => i.speed))).sort((a, b) =>
          a.localeCompare(b, 'uk'),
        );
        setSelectedSpeed((prev) => (prev && speeds.includes(prev) ? prev : speeds[0] ?? ''));
        const loadsForFirstSpeed = (data.cclist ?? [])
          .filter((i) => i.speed === (speeds[0] ?? ''))
          .map((i) => i.load);
        setSelectedLoad((prev) =>
          prev && loadsForFirstSpeed.includes(prev) ? prev : loadsForFirstSpeed[0] ?? '',
        );
      } catch (err) {
        console.error('[product-page] failed to load Trelleborg ccalc', err);
        setCcalc(null);
        setCcalcError('Не вдалося завантажити калькулятор тиску');
      } finally {
        setCcalcLoading(false);
      }
    };

    loadCcalc();
  }, [product]);

  const parsePressure = (value: string) => {
    const num = parseFloat(value.replace(',', '.'));
    return Number.isFinite(num) ? num : null;
  };

  const parseLoad = (value: string) => {
    const clean = value.replace(/\s+/g, '').replace(/,/g, '');
    const num = parseFloat(clean);
    return Number.isFinite(num) ? num : null;
  };

  const speeds = Array.from(new Set((ccalc?.cclist ?? []).map((i) => i.speed))).sort((a, b) =>
    a.localeCompare(b, 'uk'),
  );

  const loadOptions = (ccalc?.cclist ?? [])
    .filter((i) => i.speed === selectedSpeed)
    .map((i) => i.load)
    .filter((v, idx, arr) => arr.indexOf(v) === idx);

  useEffect(() => {
    if (!selectedSpeed) return;
    const loads = loadOptions;
    setSelectedLoad((prev) => (prev && loads.includes(prev) ? prev : loads[0] ?? ''));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSpeed, ccalc]); // loadOptions depends on these

  const recommendPressure = () => {
    if (!selectedSpeed) return null;
    const targetLoad = parseLoad(selectedLoad);
    if (targetLoad === null || !ccalc?.cclist) return null;

    const candidates = ccalc.cclist
      .filter((i) => i.speed === selectedSpeed)
      .map((i) => ({
        pressureLabel: i.pressure,
        pressureValue: parsePressure(i.pressure),
        loadValue: parseLoad(i.load),
      }))
      .filter((i) => i.pressureValue !== null && i.loadValue !== null)
      .sort((a, b) => (a.pressureValue! - b.pressureValue!));

    const exact = candidates.find((i) => i.loadValue === targetLoad);
    if (exact) return exact;

    const notLess = candidates.find((i) => (i.loadValue ?? 0) >= targetLoad);
    return notLess ?? candidates[candidates.length - 1] ?? null;
  };

  const recommended = recommendPressure();

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

        {brandUpper === 'TRELLEBORG' && (
          <div className="mt-12">
            <div className="rounded-2xl border border-foreground/10 bg-[#008e4ed3] text-black shadow-lg overflow-hidden">
              <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-black/10">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <h2 className="text-2xl font-semibold">Калькулятор тиску Trelleborg</h2>
                  {ccalc?.PermittedRims && (
                    <span className="text-sm text-black/80">
                      Дозволені ободи: <strong className="text-black">{ccalc.PermittedRims}</strong>
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm text-black/80">
                  Оберіть швидкість і навантаження — отримаєте мінімальний рекомендований тиск для цієї шини.
                </p>
              </div>

              <div className="px-4 sm:px-6 py-5 sm:py-6 space-y-4">
                {ccalcLoading && (
                  <div className="flex items-center gap-2 text-sm text-black/80">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Завантаження калькулятора...</span>
                  </div>
                )}

                {ccalcError && <p className="text-sm text-red-600">{ccalcError}</p>}

                {ccalc?.cclist && ccalc.cclist.length > 0 && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-black" htmlFor="speed-select">
                          Швидкість
                        </label>
                        <select
                          id="speed-select"
                          value={selectedSpeed}
                          onChange={(e) => setSelectedSpeed(e.target.value)}
                          className="w-full rounded-lg border border-black/20 bg-white px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-black/20"
                        >
                          {speeds.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-black" htmlFor="load-select">
                          Навантаження, кг
                        </label>
                        <select
                          id="load-select"
                          value={selectedLoad}
                          onChange={(e) => setSelectedLoad(e.target.value)}
                          className="w-full rounded-lg border border-black/20 bg-white px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-black/20"
                        >
                          {loadOptions.map((load) => (
                            <option key={load} value={load}>
                              {parseLoad(load)?.toLocaleString('uk-UA') ?? load}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-black">Рекомендований тиск</label>
                        <div className="rounded-lg border border-black/20 bg-white px-3 py-3 text-sm text-black min-h-[52px] flex items-center">
                          {recommended ? (
                            <div className="flex flex-col leading-tight">
                              <span className="text-lg font-semibold">{recommended.pressureLabel}</span>
                              <span className="text-xs text-black/70">
                                Покриває {recommended.loadValue?.toLocaleString('uk-UA')} кг при {selectedSpeed}
                              </span>
                            </div>
                          ) : (
                            <span className="text-black/70 text-sm">Оберіть швидкість і навантаження</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs text-black/75">
                      <div>
                        Дані за технічними таблицями Trelleborg для цього артикулу (SKU {product.sku}). Використовуйте тиск не нижчий від
                        рекомендованого.
                      </div>
                      {(ccalc?.meta?.OD || ccalc?.meta?.RC || ccalc?.meta?.SRI || ccalc?.meta?.RimWidth || ccalc?.meta?.PermittedRims) && (
                        <ul className="space-y-1">
                          {ccalc?.meta?.OD && (
                            <li>
                              <span className="font-semibold text-black">OD:</span>{' '}
                              <span className="text-black/80">Зовнішній діаметр накачаної, не навантаженої шини — {ccalc.meta.OD}</span>
                            </li>
                          )}
                          {ccalc?.meta?.RC && (
                            <li>
                              <span className="font-semibold text-black">RC:</span>{' '}
                              <span className="text-black/80">Довжина кочення шини — {ccalc.meta.RC}</span>
                            </li>
                          )}
                          {ccalc?.meta?.SRI && (
                            <li>
                              <span className="font-semibold text-black">SRI:</span>{' '}
                              <span className="text-black/80">Індекс радіусу швидкості — {ccalc.meta.SRI}</span>
                            </li>
                          )}
                          {ccalc?.meta?.RimWidth && (
                            <li>
                              <span className="font-semibold text-black">Ширина обода:</span>{' '}
                              <span className="text-black/80">Рекомендована ширина обода — {ccalc.meta.RimWidth}</span>
                            </li>
                          )}
                          {ccalc?.meta?.PermittedRims && (
                            <li>
                              <span className="font-semibold text-black">Дозволені ободи:</span>{' '}
                              <span className="text-black/80">{ccalc.meta.PermittedRims}</span>
                            </li>
                          )}
                        </ul>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {brandUpper === 'TRELLEBORG' && (
          <div className="mt-10">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-2xl font-semibold text-foreground">Технічна таблиця Trelleborg</h2>
              <div className="text-sm text-foreground/60">
                SKU: <span className="font-medium text-foreground">{product.sku}</span>
              </div>
            </div>

            {trelleborgLoading && (
              <div className="flex items-center gap-2 text-sm text-foreground/70 mb-3">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Завантаження таблиці...</span>
              </div>
            )}

            {trelleborgError && (
              <p className="text-sm text-red-600 mb-3">{trelleborgError}</p>
            )}

            {trelleborgHtml && (
              <div className="rounded-xl border border-foreground/10 bg-white text-black shadow-sm">
                <div className="overflow-x-auto">
                  <div className="min-w-[720px] trelleborg-table-html" dangerouslySetInnerHTML={{ __html: trelleborgHtml }} />
                </div>
              </div>
            )}
          </div>
        )}

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

        <style jsx>{`
          .trelleborg-table-html table {
            width: 100% !important;
            max-width: 100%;
            height: auto;
          }
          .trelleborg-table-html {
            padding: 16px;
          }
          .trelleborg-table-html td,
          .trelleborg-table-html th {
            font-family: inherit;
          }
          @media (max-width: 640px) {
            .trelleborg-table-html {
              padding: 12px;
            }
          }
        `}</style>
      </div>
    </div>
  );
}


