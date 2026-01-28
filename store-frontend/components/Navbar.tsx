"use client";

import Link from 'next/link';
import { ShoppingBag, Menu, Search } from 'lucide-react';
import { useCart } from '@/context/CartContext';

export default function Navbar() {
    const { cartCount } = useCart();

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 px-4 py-6 sm:px-6 lg:px-8">
            <div className="clay-card mx-auto max-w-7xl px-8 py-4 flex items-center justify-between !rounded-[40px] !border-white/50">
                <div className="flex items-center">
                    <Link href="/" className="text-3xl font-black font-display tracking-tight text-clay-gradient hover:scale-105 transition-transform duration-200">
                        Sellifyx
                    </Link>
                </div>

                <div className="hidden md:block">
                    <div className="flex items-baseline space-x-10">
                        {['Store', 'Features', 'About'].map((item) => (
                            <Link
                                key={item}
                                href={item === 'Store' ? '/store' : `/#${item.toLowerCase()}`}
                                className="text-base font-bold text-[#635F69] hover:text-[#7C3AED] hover:-translate-y-1 transition-all duration-200 font-display"
                            >
                                {item}
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <button className="text-[#635F69] hover:text-[#7C3AED] transition-colors hover:scale-110 duration-200">
                        <Search className="h-6 w-6" />
                    </button>
                    <Link href="/cart" className="relative text-[#635F69] hover:text-[#7C3AED] transition-all hover:scale-110 duration-200">
                        <ShoppingBag className="h-6 w-6" />
                        {cartCount > 0 && (
                            <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-[#EC4899] text-[11px] font-black text-white flex items-center justify-center animate-in zoom-in duration-200 shadow-md">
                                {cartCount}
                            </span>
                        )}
                    </Link>
                    <button className="md:hidden text-[#635F69]">
                        <Menu className="h-7 w-7" />
                    </button>
                </div>
            </div>
        </nav>
    );
}
