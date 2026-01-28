import { fetchAPI } from '@/lib/api';
import ProductCard from '@/components/ProductCard';
import HeroSection from '@/components/HeroSection';
import FeaturesSection from '@/components/FeaturesSection';
import { Product, StrapiResponse, Feature, StrapiData, Hero } from '@/types';
import Link from 'next/link';

// Ensure dynamic rendering to fetch latest content
export const dynamic = 'force-dynamic';

async function getFeaturedProducts() {
  const res = await fetchAPI('/products', {
    pagination: { limit: 3 },
    populate: ['image', 'category']
  });
  return res as StrapiResponse<Product[]>;
}

async function getHero() {
  const res = await fetchAPI('/hero', { populate: ['image'] });
  // Single types return { data: { ... } }
  return res as { data: Hero };
}

async function getFeatures() {
  const res = await fetchAPI('/features', { populate: '*' });
  return res as StrapiResponse<Feature[]>;
}

export default async function Home() {
  const productsReq = getFeaturedProducts();
  const heroReq = getHero();
  const featuresReq = getFeatures();

  const [productsData, heroResponse, featuresData] = await Promise.all([productsReq, heroReq, featuresReq]);

  const products = productsData?.data || [];
  // Wrap hero data in StrapiData structure
  const hero: Hero | null = heroResponse?.data || null;
  const features = featuresData?.data || [];

  return (
    <div className="bg-white">
      {/* Hero */}
      <HeroSection hero={hero} />

      {/* Featured Products */}
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Featured Products</h2>
          <Link href="/store" className="hidden text-sm font-medium text-indigo-600 hover:text-indigo-500 sm:block">
            See all products <span aria-hidden="true"> &rarr;</span>
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:gap-x-8">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>

      {/* Features */}
      <FeaturesSection features={features} />
    </div>
  )
}
