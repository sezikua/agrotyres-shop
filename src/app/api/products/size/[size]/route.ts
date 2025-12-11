import { NextResponse } from 'next/server';

type DirectusProduct = {
  warehouse?: string | null;
  product_name?: string | null;
  [key: string]: unknown;
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ size: string }> }
) {
  try {
    const { size } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '30');

    const directusUrl = process.env.DIRECTUS_URL || 'http://173.212.215.18:8055';
    const directusToken = process.env.DIRECTUS_TOKEN || 'wFd_KOyK9LJEZSe98DEu8Uww5wKGg1qD';

    const encodedSize = encodeURIComponent(size);
    
    // Отримуємо всі товари для правильного сортування
    const url = `${directusUrl}/items/Product?filter[size][_eq]=${encodedSize}&limit=-1&meta=total_count`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${directusToken}`,
      },
      next: { revalidate: 300 } // Revalidate every 5 minutes
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Кастомне сортування за наявністю: In stock -> On order -> out of stock
    const warehouseOrder = { 'In stock': 1, 'On order': 2, 'out of stock': 3 };
    const allProducts = (Array.isArray(data.data) ? data.data : []) as DirectusProduct[];
    
    allProducts.sort((a, b) => {
        const aOrder = warehouseOrder[a.warehouse as keyof typeof warehouseOrder] || 4;
        const bOrder = warehouseOrder[b.warehouse as keyof typeof warehouseOrder] || 4;
        
        if (aOrder !== bOrder) {
          return aOrder - bOrder;
        }
        
        // Якщо наявність однакова, сортуємо за назвою
      return (a.product_name ?? '').localeCompare(b.product_name ?? '');
      });
    
    // Тепер ділимо на сторінки після сортування
    const totalItems = allProducts.length;
    const totalPages = Math.ceil(totalItems / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProducts = allProducts.slice(startIndex, endIndex);
    
    return NextResponse.json({
      data: paginatedProducts,
      pagination: {
        total: totalItems,
        page,
        limit,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching products by size:', error);
    return NextResponse.json(
      { error: 'Помилка отримання товарів за розміром' },
      { status: 500 }
    );
  }
}
