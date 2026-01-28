import { fetchAPI } from '@/lib/api';
import ProductCard from '@/components/ProductCard';
import { Product, StrapiResponse } from '@/types';

// Ensure dynamic rendering
export const dynamic = 'force-dynamic';

async function getProducts() {
    const res = await fetchAPI('/products', { populate: ['image', 'category'] });
    return res as StrapiResponse<Product[]>;
}

export default async function StorePage() {
    const data = await getProducts();
    const products = data?.data || [];

    return (
        <div className="bg-white">
            <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                <div className="flex items-baseline justify-between border-b border-gray-200 pb-6">
                    <h1 className="text-4xl font-bold tracking-tight text-gray-900">Store</h1>
                </div>

                <div className="mt-8">
                    {products.length === 0 ? (
                        <div className="text-center py-10">
                            <p className="text-gray-500">No products found.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:gap-x-8">
                            {products.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
