'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import { loadSizeFilterData, sortDiameterValues, type SizeFilterMap } from '@/lib/sizeFilterData';

const formatDiameterLabel = (value: string) => {
  const num = parseFloat(value);
  if (Number.isNaN(num)) return value;
  return `${num}"`;
};

export default function HomeSizeFilter() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [selectedDiameter, setSelectedDiameter] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [diameterOptions, setDiameterOptions] = useState<string[]>([]);
  const [sizesMap, setSizesMap] = useState<SizeFilterMap>({});

  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await loadSizeFilterData();
        if (!mounted) return;
        setSizesMap(data);
        setDiameterOptions(sortDiameterValues(Object.keys(data)));
      } catch (error) {
        console.error('Error loading quick filter options:', error);
        if (mounted) {
          setSizesMap({});
          setDiameterOptions([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadData();
    return () => {
      mounted = false;
    };
  }, []);

  const sizeOptions = useMemo(() => {
    if (!selectedDiameter) return [];
    return sizesMap[selectedDiameter] ?? [];
  }, [selectedDiameter, sizesMap]);

  const handleDiameterChange = (value: string) => {
    setSelectedDiameter(value);
    setSelectedSize('');
  };

  const handleSubmit = () => {
    if (!selectedSize) return;
    router.push(`/sizes/${encodeURIComponent(selectedSize)}`);
  };

  return (
    <section className="w-full rounded-[26px] bg-gradient-to-r from-[#007b3a] via-[#008e4ed3] to-[#00a86b] text-white shadow-2xl border border-white/10 backdrop-blur">
      <div className="flex flex-col gap-5 p-5 sm:p-6 md:p-7">
        <div className="flex flex-col items-center gap-2 text-center">
          <h2 className="text-xl sm:text-2xl md:text-[28px] font-extrabold leading-tight">
            Пошук шин за розміром
          </h2>
        </div>

        <div className="flex flex-col lg:flex-row items-stretch lg:items-end gap-3 sm:gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <select
                value={selectedDiameter}
                onChange={(e) => handleDiameterChange(e.target.value)}
                className="w-full appearance-none rounded-2xl border border-white/20 bg-white/95 px-4 py-3 pr-10 text-[#1d1d1f] font-semibold shadow-md outline-none focus:ring-2 focus:ring-[#FFD700]"
              >
                <option value="">Виберіть діаметр шини</option>
                {loading ? (
                  <option value="">Завантаження...</option>
                ) : (
                  diameterOptions.map((diameter) => (
                    <option key={diameter} value={diameter}>
                      {formatDiameterLabel(diameter)}
                    </option>
                  ))
                )}
              </select>
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#1d1d1f]/40">
                ▼
              </span>
            </div>
          </div>

          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <select
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
                disabled={!selectedDiameter}
                className="w-full appearance-none rounded-2xl border border-white/20 bg-white/95 px-4 py-3 pr-10 text-[#1d1d1f] font-semibold shadow-md outline-none focus:ring-2 focus:ring-[#FFD700] disabled:bg-white/30 disabled:text-white/70"
              >
                <option value="">{selectedDiameter ? 'Виберіть розмір шини' : 'Спочатку оберіть діаметр'}</option>
                {sizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#1d1d1f]/40">
                ▼
              </span>
            </div>
          </div>

          <div className="w-full lg:w-auto lg:min-w-[180px] flex flex-col">
            <button
              onClick={handleSubmit}
              disabled={!selectedSize}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[#FFD700] px-5 py-3 font-semibold text-[#1d1d1f] shadow-xl transition hover:bg-white hover:-translate-y-0.5 disabled:bg-white/30 disabled:text-white/60"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              Знайти шини
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

