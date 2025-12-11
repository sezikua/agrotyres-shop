'use client';

import { useState, useEffect, useCallback } from 'react';
import { Filter, X } from 'lucide-react';
import { Product, fetchFilteredProducts, FilterOptions, PaginationInfo } from '@/lib/api';
import { loadSizeFilterData, sortDiameterValues, type SizeFilterMap } from '@/lib/sizeFilterData';

interface ProductFiltersProps {
  onFiltersChange: (filteredProducts: Product[], pagination?: PaginationInfo) => void;
  onLoadingChange?: (loading: boolean) => void;
  currentCategory?: string;
  currentSize?: string;
}

export default function ProductFilters({ onFiltersChange, onLoadingChange, currentCategory, currentSize }: ProductFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedDiameter, setSelectedDiameter] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [warehouseFilter, setWarehouseFilter] = useState<string>('all');
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [allDiameters, setAllDiameters] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableDiameters, setAvailableDiameters] = useState<string[]>([]);
  const [availableSizes, setAvailableSizes] = useState<string[]>([]);
  const [sizeFilterData, setSizeFilterData] = useState<SizeFilterMap>({});
  const [loading, setLoading] = useState(true);

  // Load all categories and diameters from API
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        setLoading(true);
        const categoriesResponse = await fetch('/api/categories');
        const sizeData = await loadSizeFilterData();

        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json();
          setAllCategories(categoriesData.categories || []);
          setAvailableCategories(categoriesData.categories || []);
        } else {
          setAllCategories([]);
          setAvailableCategories([]);
        }
          
        setSizeFilterData(sizeData);
        const sortedDiameters = sortDiameterValues(Object.keys(sizeData));
          setAllDiameters(sortedDiameters);
          setAvailableDiameters(sortedDiameters);
      } catch (error) {
        console.error('Error loading filter options:', error);
        setAllCategories([]);
        setAllDiameters([]);
        setSizeFilterData({});
        setAvailableCategories([]);
        setAvailableDiameters([]);
      } finally {
        setLoading(false);
      }
    };

    loadFilterOptions();
  }, []);

  // Initialize filters based on current category and size
  useEffect(() => {
    if (currentCategory) {
      setSelectedCategory(currentCategory);
    }
    if (currentSize) {
      setSelectedSize(currentSize);
      // Extract diameter from size (e.g., "710/70R42" -> "42")
      const diameterMatch = currentSize.match(/R(\d+)/);
      if (diameterMatch) {
        setSelectedDiameter(diameterMatch[1]);
      }
    }
  }, [currentCategory, currentSize]);

  // Update available options based on selected filters
  useEffect(() => {
    const updateAvailableOptions = async () => {
      if (!selectedCategory && !selectedDiameter) {
        setAvailableCategories(allCategories);
        setAvailableDiameters(allDiameters);
        setAvailableSizes([]);
        return;
      }

      if (!selectedCategory && selectedDiameter) {
        setAvailableCategories(allCategories);
        setAvailableDiameters(allDiameters);
        setAvailableSizes(sizeFilterData[selectedDiameter] ?? []);
        return;
      }

      if (!selectedCategory) {
        return;
      }

      try {
        setLoading(true);
        const filters: FilterOptions = {
          page: 1,
          limit: 1000,
          categories: [selectedCategory],
        };

        const response = await fetchFilteredProducts(filters);
        const products = response.data;

        const uniqueDiameters = [...new Set(products.map((p) => p.diameter).filter(Boolean))] as string[];
        const sortedDiameters = sortDiameterValues(uniqueDiameters);
          setAvailableDiameters(sortedDiameters);
        setAvailableCategories(allCategories);

        if (selectedDiameter) {
          const diameterProducts = products.filter((p) => p.diameter === selectedDiameter);
          const uniqueSizes = [...new Set(diameterProducts.map((p) => p.size).filter(Boolean))] as string[];
          setAvailableSizes(uniqueSizes.sort((a, b) => a.localeCompare(b, 'uk')));
        } else {
          setAvailableSizes([]);
        }
      } catch (error) {
        console.error('Error updating available options:', error);
        setAvailableCategories(allCategories);
        setAvailableDiameters(allDiameters);
        setAvailableSizes([]);
      } finally {
        setLoading(false);
      }
    };

    updateAvailableOptions();
  }, [selectedCategory, selectedDiameter, allCategories, allDiameters, sizeFilterData]);

  // Apply filters function (called manually)
  const applyFilters = useCallback(async () => {
    // If only category is selected and we're not already on that category page, navigate to category page
    if (selectedCategory && !selectedDiameter && !selectedSize && warehouseFilter === 'all' && selectedCategory !== currentCategory) {
      window.location.href = `/categories/${encodeURIComponent(selectedCategory)}`;
      return;
    }

    // If size is selected, navigate to size page (but not if we're already on that page)
    if (selectedSize && selectedDiameter && selectedSize !== currentSize) {
      window.location.href = `/sizes/${encodeURIComponent(selectedSize)}`;
      return;
    }

    // For any other combination, use client-side filtering
    try {
      if (onLoadingChange) {
        onLoadingChange(true);
      }

      const filters: FilterOptions = {
        page: 1,
        limit: 1000, // Get more products for filtering
      };

      if (selectedCategory) {
        filters.categories = [selectedCategory];
      }

      if (warehouseFilter !== 'all') {
        filters.warehouse = warehouseFilter;
      }

      const response = await fetchFilteredProducts(filters);
      let filteredProducts = response.data;

      // Apply diameter filter on client side since it's not in the API
      if (selectedDiameter) {
        filteredProducts = filteredProducts.filter(product => product.diameter === selectedDiameter);
      }

      // Apply size filter on client side
      if (selectedSize) {
        filteredProducts = filteredProducts.filter(product => product.size === selectedSize);
      }

      onFiltersChange(filteredProducts, response.pagination);
    } catch (error) {
      console.error('Error applying filters:', error);
      onFiltersChange([]);
    } finally {
      if (onLoadingChange) {
        onLoadingChange(false);
      }
    }
  }, [selectedCategory, selectedDiameter, selectedSize, warehouseFilter, currentCategory, currentSize, onFiltersChange, onLoadingChange]);


  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedDiameter('');
    setSelectedSize('');
    setWarehouseFilter('all');
    
    // If we're on a category or size page, navigate back to products page
    if (currentCategory || currentSize) {
      window.location.href = '/products';
    }
  };

  // Видалено інтерфейс "Наявність", тож обробник залишено порожнім на випадок майбутнього повернення
  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    // If diameter is selected and not compatible with new category, clear it
    if (value && selectedDiameter && !availableDiameters.includes(selectedDiameter)) {
      setSelectedDiameter('');
      setSelectedSize(''); // Also clear size
    }
  };

  const handleDiameterChange = (value: string) => {
    setSelectedDiameter(value);
    setSelectedSize(''); // Clear size when diameter changes
    // If category is selected and not compatible with new diameter, clear it
    if (value && selectedCategory && !availableCategories.includes(selectedCategory)) {
      setSelectedCategory('');
    }
  };

  const handleSizeChange = (value: string) => {
    setSelectedSize(value);
  };

  const activeFiltersCount = (selectedCategory ? 1 : 0) + (selectedDiameter ? 1 : 0) + 
    (selectedSize ? 1 : 0);

  const formatDiameterLabel = (value: string) => {
    const num = parseFloat(value);
    if (Number.isNaN(num)) return value + '"';
    return num.toString() + '"';
  };

  return (
    <div className="lg:sticky lg:top-4 lg:h-fit">
      {/* Mobile Filter Toggle */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 bg-[#008e4ed3] border border-white/20 rounded-lg px-4 py-2 text-sm font-medium text-white hover:bg-[#008e4ed3]/90"
        >
          <Filter className="w-4 h-4" />
          Фільтри
          {activeFiltersCount > 0 && (
            <span className="bg-white text-[#008e4ed3] text-xs rounded-full px-2 py-1">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {/* Filters Panel */}
      <div className={`lg:block ${isOpen ? 'block' : 'hidden'}`}>
        <div className="bg-[#008e4ed3] text-white border border-white/20 rounded-2xl p-6 lg:p-8 shadow-2xl backdrop-blur-md">
          {/* Header */}
          <div className="mb-6">
            <h3 className="text-2xl font-semibold text-white text-center drop-shadow">Фільтр продукції</h3>
          </div>

          {/* Diameter */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-white/90 mb-3 tracking-wide uppercase">
              Діаметр
            </label>
            <select
              value={selectedDiameter}
              onChange={(e) => handleDiameterChange(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white text-[#2d3748] border-0 shadow-md outline-none focus:ring-2 focus:ring-[#008E4E]/40 transition disabled:bg-gray-200 disabled:text-gray-400"
            >
              <option value="" className="text-black">Всі діаметри</option>
              {loading ? (
                <option value="" className="text-black">Завантаження...</option>
              ) : (
                availableDiameters.map((diameter) => (
                  <option key={diameter} value={diameter} className="text-black">
                    {formatDiameterLabel(diameter)}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Size */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-white/90 mb-3 tracking-wide uppercase">
              Розмір шини
            </label>
            <select
              value={selectedSize}
              onChange={(e) => handleSizeChange(e.target.value)}
              disabled={!selectedDiameter}
              className={`w-full px-4 py-3 rounded-xl bg-white text-[#2d3748] border-0 shadow-md outline-none focus:ring-2 focus:ring-[#008E4E]/40 transition ${
                !selectedDiameter ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              <option value="" className="text-black">
                {!selectedDiameter ? 'Виберіть діаметр' : 'Всі розміри'}
              </option>
              {loading ? (
                <option value="" className="text-black">Завантаження...</option>
              ) : (
                availableSizes.map((size) => (
                  <option key={size} value={size} className="text-black">
                    {size}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Categories */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-white/90 mb-3 tracking-wide uppercase">
              Категорія
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white text-[#2d3748] border-0 shadow-md outline-none focus:ring-2 focus:ring-[#008E4E]/40 transition"
            >
              <option value="" className="text-black">Всі категорії</option>
              {loading ? (
                <option value="" className="text-black">Завантаження...</option>
              ) : (
                availableCategories.map((category) => (
                  <option key={category} value={category} className="text-black">
                    {category}
                  </option>
                ))
              )}
            </select>
          </div>

          

          {/* Active Filters Display */}
          {activeFiltersCount > 0 && (
            <div className="mb-6 p-4 bg-white/10 rounded-xl border border-white/20 shadow-inner">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-white">
                  Застосовані фільтри ({activeFiltersCount})
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedDiameter && (
                  <span className="inline-flex items-center gap-2 bg-[#008E4E]/20 text-white text-sm px-3 py-2 rounded-xl border border-[#008E4E]/30">
                    <span className="font-medium">Діаметр:</span>
                    <span>{formatDiameterLabel(selectedDiameter)}</span>
                    <button
                      onClick={() => {
                        setSelectedDiameter('');
                        setSelectedSize('');
                      }}
                      className="hover:bg-[#008E4E]/30 rounded-full p-1 transition-colors"
                      title="Видалити фільтр"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </span>
                )}
                {selectedSize && (
                  <span className="inline-flex items-center gap-2 bg-[#008E4E]/20 text-white text-sm px-3 py-2 rounded-xl border border-[#008E4E]/30">
                    <span className="font-medium">Розмір:</span>
                    <span>{selectedSize}</span>
                    <button
                      onClick={() => setSelectedSize('')}
                      className="hover:bg-[#008E4E]/30 rounded-full p-1 transition-colors"
                      title="Видалити фільтр"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </span>
                )}
                {selectedCategory && (
                  <span className="inline-flex items-center gap-2 bg-[#008E4E]/20 text-white text-sm px-3 py-2 rounded-xl border border-[#008E4E]/30">
                    <span className="font-medium">Категорія:</span>
                    <span>{selectedCategory}</span>
                    <button
                      onClick={() => setSelectedCategory('')}
                      className="hover:bg-[#008E4E]/30 rounded-full p-1 transition-colors"
                      title="Видалити фільтр"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </span>
                )}
                
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-4 border-t border-white/20 mt-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={applyFilters}
                className="flex-1 bg-[#FFD700] text-[#2d3748] px-4 py-3 rounded-xl font-semibold shadow-md hover:bg-[#FFED4E] hover:shadow-lg transition-transform duration-200 hover:-translate-y-0.5"
              >
                Застосувати
              </button>
              <button
                onClick={clearFilters}
                className={`flex-1 px-4 py-3 rounded-xl font-semibold transition ${
                  activeFiltersCount > 0 
                    ? 'bg-white text-[#008E4E] shadow-md hover:bg-[#F7FAFC] hover:shadow-lg hover:-translate-y-0.5' 
                    : 'bg-white/60 text-white/70 cursor-not-allowed'
                }`}
                disabled={activeFiltersCount === 0}
              >
                Скинути
              </button>
            </div>
            <p className="mt-3 text-center text-sm text-[#E6F7EF] italic">Оберіть параметри для фільтрації</p>
          </div>
        </div>
      </div>
    </div>
  );
}
