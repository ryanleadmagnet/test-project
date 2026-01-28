import Link from 'next/link';
import { Product } from '@/types';
import { getStrapiMedia } from '@/lib/api';

export default function ProductCard({ product }: { product: Product }) {
  if (!product) return null;

  const { title, price, currency, image, slug, category } = product;
  const imageUrl = getStrapiMedia(image?.url || '');

  return (
    <Link href={`/product/${slug}`} className="group clay-card block p-6 h-full">
      <div className="relative aspect-square w-full overflow-hidden rounded-[24px] bg-slate-100 mb-6">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-[#F4F1FA] text-[#635F69]">
            No Image
          </div>
        )}
      </div>

      <div className="flex flex-col">
        <h3 className="text-xl font-bold text-[#332F3A] mb-1 font-display group-hover:text-[#7C3AED] transition-colors">{title}</h3>
        <p className="text-sm font-medium text-[#635F69] mb-3">{category?.name}</p>
        <div className="flex items-center justify-between mt-auto">
          <p className="text-2xl font-black text-[#332F3A] tracking-tight">{currency} {price}</p>
          <div className="h-10 w-10 flex items-center justify-center rounded-full bg-white shadow-clay-button text-[#7C3AED] group-hover:scale-110 transition-transform duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  )
}
