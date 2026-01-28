"use client";

import { useCart } from '@/context/CartContext';
import { getStrapiMedia } from '@/lib/api';
import Link from 'next/link';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CartPage() {
    const { cartItems, updateQuantity, removeFromCart, cartTotal } = useCart();
    const router = useRouter();

    if (cartItems.length === 0) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center">
                <h1 className="text-3xl font-display font-bold text-slate-900 mb-4">Your cart is empty</h1>
                <p className="text-slate-500 mb-8">Looks like you haven't added anything yet.</p>
                <Link href="/store" className="btn-primary">
                    Continue Shopping
                </Link>
            </div>
        );
    }

    return (
        <div className="pt-32 pb-24 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-5xl font-black font-display text-[#332F3A] mb-12">Shopping Cart</h1>

                <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 lg:items-start">
                    <section className="lg:col-span-7">
                        <ul className="space-y-6">
                            {cartItems.map(({ product, quantity }) => {
                                const imageUrl = getStrapiMedia(product.image?.url || '');
                                return (
                                    <li key={product.id} className="clay-card p-6 flex items-center !rounded-[32px]">
                                        <div className="flex-shrink-0">
                                            {imageUrl ? (
                                                <img
                                                    src={imageUrl}
                                                    alt={product.title}
                                                    className="h-24 w-24 rounded-[20px] object-cover object-center sm:h-32 sm:w-32 bg-[#F4F1FA]"
                                                />
                                            ) : (
                                                <div className="h-24 w-24 rounded-[20px] bg-[#F4F1FA] flex items-center justify-center text-[#635F69] text-xs">
                                                    No Image
                                                </div>
                                            )}
                                        </div>

                                        <div className="ml-6 flex flex-1 flex-col justify-between">
                                            <div className="relative pr-9 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:pr-0">
                                                <div>
                                                    <div className="flex justify-between">
                                                        <h3 className="text-xl font-bold font-display text-[#332F3A]">
                                                            <Link href={`/product/${product.slug}`} className="hover:text-[#7C3AED] transition-colors">
                                                                {product.title}
                                                            </Link>
                                                        </h3>
                                                    </div>
                                                    <p className="mt-1 text-sm font-bold text-[#635F69]">{product.category?.name}</p>
                                                    <p className="mt-2 text-xl font-black text-[#332F3A]">{product.currency} {product.price}</p>
                                                </div>

                                                <div className="mt-4 sm:mt-0 sm:pr-9 flex items-center justify-end">
                                                    <div className="flex items-center space-x-3 bg-[#EFEBF5] rounded-[16px] p-2 shadow-inner">
                                                        <button
                                                            onClick={() => updateQuantity(product.id, Math.max(1, quantity - 1))}
                                                            className="p-2 rounded-full hover:bg-white text-[#635F69] hover:text-[#332F3A] transition-all shadow-sm"
                                                        >
                                                            <Minus className="h-4 w-4" />
                                                        </button>
                                                        <span className="font-bold text-[#332F3A] w-6 text-center">{quantity}</span>
                                                        <button
                                                            onClick={() => updateQuantity(product.id, quantity + 1)}
                                                            className="p-2 rounded-full hover:bg-white text-[#635F69] hover:text-[#332F3A] transition-all shadow-sm"
                                                        >
                                                            <Plus className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                    <div className="absolute top-0 right-0">
                                                        <button
                                                            type="button"
                                                            onClick={() => removeFromCart(product.id)}
                                                            className="-m-2 p-2 inline-flex text-gray-400 hover:text-red-500 transition-colors"
                                                        >
                                                            <span className="sr-only">Remove</span>
                                                            <Trash2 className="h-5 w-5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </section>

                    {/* Order Summary */}
                    <section className="mt-16 clay-card !bg-white/80 !backdrop-blur-xl px-8 py-10 lg:col-span-5 lg:mt-0 !rounded-[40px] shadow-clay-deep border border-white/60">
                        <h2 className="text-2xl font-black font-display text-[#332F3A] mb-8">Order Summary</h2>

                        <dl className="mt-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <dt className="text-base font-bold text-[#635F69]">Subtotal</dt>
                                <dd className="text-base font-bold text-[#332F3A]">${cartTotal.toFixed(2)}</dd>
                            </div>
                            <div className="flex items-center justify-between border-t border-[#635F69]/10 pt-4">
                                <dt className="text-base font-bold text-[#635F69]">Shipping estimate</dt>
                                <dd className="text-base font-bold text-[#332F3A]">$5.00</dd>
                            </div>
                            <div className="flex items-center justify-between border-t border-[#635F69]/10 pt-4">
                                <dt className="text-xl font-black text-[#332F3A]">Order total</dt>
                                <dd className="text-xl font-black text-[#7C3AED]">${(cartTotal + 5).toFixed(2)}</dd>
                            </div>
                        </dl>

                        <div className="mt-10">
                            <button
                                onClick={() => router.push('/checkout')}
                                className="w-full clay-button text-lg"
                            >
                                Proceed to Checkout
                            </button>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
