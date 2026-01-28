import { fetchAPI, getStrapiMedia } from '@/lib/api';
import { Product, StrapiResponse } from '@/types';
import { notFound } from 'next/navigation';
import AddToCartButton from '@/components/AddToCartButton';

export const dynamic = 'force-dynamic';

async function getProduct(slug: string) {
    const res = await fetchAPI('/products', {
        filters: { slug: slug },
        populate: ['image', 'category']
    });
    return res as StrapiResponse<Product[]>;
}

// Next.js 15+: params is a Promise
export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    const data = await getProduct(slug);
    const product = data?.data?.[0];

    if (!product) {
        notFound();
    }

    const { title, subtitle, description, price, currency, image, category } = product;
    const imageUrl = getStrapiMedia(image?.url || '');

    return (
        <div className="relative pt-32 pb-24 overflow-hidden min-h-screen">
            {/* 3D Floating Blobs Background */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
                <div className="absolute top-[20%] -left-[10%] h-[60vh] w-[60vh] rounded-full bg-[#8B5CF6] opacity-10 blur-3xl animate-float"></div>
                <div className="absolute top-[10%] -right-[10%] h-[50vh] w-[50vh] rounded-full bg-[#EC4899] opacity-10 blur-3xl animate-float-delayed"></div>
            </div>

            <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
                <div className="lg:grid lg:grid-cols-2 lg:gap-x-12 lg:items-start">
                    {/* Image */}
                    <div className="clay-card p-6 aspect-square w-full relative mb-10 lg:mb-0 !rounded-[48px] animate-float-slow">
                        {imageUrl ? (
                            <img src={imageUrl} alt={title} className="w-full h-full object-cover rounded-[32px] shadow-lg" />
                        ) : (
                            <div className="w-full h-full bg-[#F4F1FA] rounded-[32px] flex items-center justify-center text-[#635F69]">No Image</div>
                        )}
                    </div>

                    {/* Info */}
                    <div className="mt-10 px-4 sm:mt-0 sm:px-0 lg:ml-8">
                        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-[#332F3A] mb-4 font-display">{title}</h1>
                        {subtitle && <h2 className="text-xl text-[#635F69] font-medium mb-8">{subtitle}</h2>}

                        <div className="clay-card p-8 !rounded-[32px] mb-8">
                            <h3 className="sr-only">Description</h3>
                            <div className="space-y-6 text-lg text-[#332F3A] leading-relaxed">
                                <div>{description}</div>
                            </div>
                        </div>

                        <div className="flex items-center mb-10">
                            <p className="text-4xl font-black text-[#332F3A] tracking-tight">{currency} {price}</p>
                            {category && <span className="ml-6 inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-bold text-[#7C3AED] shadow-clay-button">{category.name}</span>}
                        </div>

                        <div className="flex">
                            <AddToCartButton product={product} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
