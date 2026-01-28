import { Feature } from '@/types';
import { Truck, Lock, RefreshCcw } from 'lucide-react';

const iconMap: Record<string, any> = {
    truck: Truck,
    lock: Lock,
    refresh: RefreshCcw,
};

export default function FeaturesSection({ features }: { features: Feature[] }) {
    if (!features || features.length === 0) return null;

    return (
        <div className="py-24 sm:py-32 relative overflow-hidden">
            {/* Background Blobs for consistency if needed, or keeping it clean on the clay background */}

            <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-2xl text-center mb-16">
                    <h2 className="text-4xl font-black font-display tracking-tight text-[#332F3A] sm:text-5xl mb-4">Why Shop With Us</h2>
                    <p className="text-lg leading-8 text-[#635F69] font-medium">
                        We prioritize your experience with premium services and guaranteed satisfaction.
                    </p>
                </div>
                <div className="mx-auto max-w-2xl lg:max-w-none">
                    <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-12 lg:max-w-none lg:grid-cols-3">
                        {features.map((feature) => {
                            if (!feature) return null;
                            const { title, description, icon, id } = feature;
                            const LucideIcon = iconMap[icon] || Truck;

                            return (
                                <div key={id} className="clay-card p-8 flex flex-col items-start !rounded-[40px] hover:-translate-y-2 transition-transform duration-300">
                                    <div className="mb-6 h-16 w-16 flex items-center justify-center rounded-[24px] bg-white text-[#7C3AED] shadow-clay-button">
                                        <LucideIcon className="h-8 w-8" aria-hidden="true" />
                                    </div>
                                    <dt className="text-xl font-bold leading-7 text-[#332F3A] font-display mb-3">
                                        {title}
                                    </dt>
                                    <dd className="text-base leading-7 text-[#635F69] font-medium">
                                        {description}
                                    </dd>
                                </div>
                            );
                        })}
                    </dl>
                </div>
            </div>
        </div>
    )
}
