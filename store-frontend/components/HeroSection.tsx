import Link from 'next/link';
import { Hero } from '@/types';
import { getStrapiMedia } from '@/lib/api';

export default function HeroSection({ hero }: { hero: Hero }) {
    const { title, subtitle, buttonText, buttonLink, image } = hero;
    const imageUrl = getStrapiMedia(image?.url || '');

    return (
        <div className="relative isolate pt-32 pb-24 overflow-hidden">
            {/* 3D Floating Blobs Background */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
                <div className="absolute top-[20%] -left-[10%] h-[60vh] w-[60vh] rounded-full bg-[#8B5CF6] opacity-10 blur-3xl animate-float"></div>
                <div className="absolute top-[10%] -right-[10%] h-[50vh] w-[50vh] rounded-full bg-[#EC4899] opacity-10 blur-3xl animate-float-delayed"></div>
                <div className="absolute -bottom-[20%] left-[20%] h-[70vh] w-[70vh] rounded-full bg-[#0EA5E9] opacity-10 blur-3xl animate-float-slow"></div>
            </div>

            <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
                <div className="mx-auto max-w-2xl text-center">
                    <h1 className="text-5xl sm:text-7xl font-black font-display tracking-tight text-[#332F3A] mb-8 leading-[1.1]">
                        {title}
                    </h1>
                    <p className="mt-6 text-xl sm:text-2xl leading-relaxed text-[#635F69] font-medium max-w-3xl mx-auto">
                        {subtitle}
                    </p>
                    <div className="mt-12 flex items-center justify-center gap-x-6">
                        <Link
                            href={buttonLink || '/store'}
                            className="clay-button px-10 text-lg hover:px-12"
                        >
                            {buttonText}
                        </Link>
                        <Link href="#features" className="text-lg font-bold leading-6 text-[#635F69] hover:text-[#7C3AED] transition-colors py-3 px-6 rounded-2xl hover:bg-white/50">
                            Learn more <span aria-hidden="true">→</span>
                        </Link>
                    </div>
                </div>

                {/* Hero Image Container */}
                {imageUrl && (
                    <div className="mt-20 flow-root sm:mt-24">
                        <div className="clay-card p-4 lg:p-6 !rounded-[48px] -m-2 lg:-m-4 hover:scale-[1.02] transition-transform duration-700 ease-out animate-float-slow">
                            <img
                                src={imageUrl}
                                alt="App screenshot"
                                width={2432}
                                height={1442}
                                className="rounded-[32px] shadow-2xl ring-1 ring-gray-900/10 w-full object-cover"
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
