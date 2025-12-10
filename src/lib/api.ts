export interface Product {
  id: number;
  sku: string;
  product_name: string;
  model: string;
  size: string;
  regular_price: string;
  discount_price: string | null;
  diameter: string;
  // Directus returns UUID of the file or null
  product_image: string | null;
  description: string | null;
  specifications: string | null;
  Category: string;
  Segment: string;
  warehouse: string;
  slug?: string;
  brand?: string;
  on_the_way?: boolean;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ProductsResponse {
  data: Product[];
  pagination: PaginationInfo;
}

export async function fetchProducts(page: number = 1, limit: number = 30): Promise<ProductsResponse> {
  try {
    const response = await fetch(`/api/products?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.data || !Array.isArray(data.data)) {
      throw new Error('Invalid data format received from API');
    }

    return data;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw new Error('Помилка отримання товарів з сервера');
  }
}

export async function fetchProductById(id: number): Promise<Product | null> {
  try {
    const response = await fetch(`/api/products/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data || null;
  } catch (error) {
    console.error('Error fetching product:', error);
    throw new Error('Помилка отримання товару з сервера');
  }
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  try {
    const response = await fetch(`/api/products/slug/${encodeURIComponent(slug)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data || null;
  } catch (error) {
    console.error('Error fetching product by slug:', error);
    throw new Error('Помилка отримання товару за slug з сервера');
  }
}

export async function fetchProductsByCategory(category: string, page: number = 1, limit: number = 30): Promise<ProductsResponse> {
  try {
    const response = await fetch(`/api/products?category=${encodeURIComponent(category)}&page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.data || !Array.isArray(data.data)) {
      throw new Error('Invalid data format received from API');
    }

    return data;
  } catch (error) {
    console.error('Error fetching products by category:', error);
    throw new Error('Помилка отримання товарів за категорією');
  }
}

export async function fetchProductsBySegment(segment: string, page: number = 1, limit: number = 30): Promise<ProductsResponse> {
  try {
    const response = await fetch(`/api/products/segment/${encodeURIComponent(segment)}?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.data || !Array.isArray(data.data)) {
      throw new Error('Invalid data format received from API');
    }

    return data;
  } catch (error) {
    console.error('Error fetching products by segment:', error);
    throw new Error('Помилка отримання товарів за сегментом');
  }
}

export async function fetchProductsBySize(size: string, page: number = 1, limit: number = 30): Promise<ProductsResponse> {
  try {
    const response = await fetch(`/api/products/size/${encodeURIComponent(size)}?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.data || !Array.isArray(data.data)) {
      throw new Error('Invalid data format received from API');
    }

    return data;
  } catch (error) {
    console.error('Error fetching products by size:', error);
    throw new Error('Помилка отримання товарів за розміром');
  }
}

export interface FilterOptions {
  categories?: string[];
  segments?: string[];
  search?: string;
  minPrice?: string;
  maxPrice?: string;
  warehouse?: string;
  page?: number;
  limit?: number;
}

export async function fetchFilteredProducts(filters: FilterOptions): Promise<ProductsResponse> {
  try {
    const params = new URLSearchParams();
    
    if (filters.categories && filters.categories.length > 0) {
      params.append('categories', filters.categories.join(','));
    }
    
    if (filters.segments && filters.segments.length > 0) {
      params.append('segments', filters.segments.join(','));
    }
    
    if (filters.search) {
      params.append('search', filters.search);
    }
    
    if (filters.minPrice) {
      params.append('minPrice', filters.minPrice);
    }
    
    if (filters.maxPrice) {
      params.append('maxPrice', filters.maxPrice);
    }
    
    if (filters.warehouse) {
      params.append('warehouse', filters.warehouse);
    }
    
    params.append('page', (filters.page || 1).toString());
    params.append('limit', (filters.limit || 30).toString());

    const response = await fetch(`/api/products/filtered?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.data || !Array.isArray(data.data)) {
      throw new Error('Invalid data format received from API');
    }

    return data;
  } catch (error) {
    console.error('Error fetching filtered products:', error);
    throw new Error('Помилка отримання відфільтрованих товарів');
  }
}

// Fetch similar products by size
export async function fetchSimilarProducts(size: string): Promise<Product[]> {
  try {
    const response = await fetch(`/api/products/similar/${encodeURIComponent(size)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.data || !Array.isArray(data.data)) {
      throw new Error('Invalid data format received from API');
    }

    return data.data;
  } catch (error) {
    console.error('Error fetching similar products:', error);
    throw new Error('Помилка отримання схожих товарів');
  }
}

// Формування прямого URL до Directus Assets
export function getProductImageUrl(imageId: string | null): string {
  if (!imageId) return '/placeholder-image.svg';
  
  // Always use our API proxy for images - this ensures CORS and proper handling
  return `/api/assets/${imageId}`;
}
