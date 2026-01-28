"use client";

import React, { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useCart } from "@/context/CartContext";
import { stripePromise } from "@/lib/stripe";
import { useRouter } from "next/navigation";

function CheckoutForm({ clientSecret }: { clientSecret: string }) {
    const stripe = useStripe();
    const elements = useElements();
    const [message, setMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { clearCart } = useCart();
    const router = useRouter();

    useEffect(() => {
        if (!stripe) {
            return;
        }

        const clientSecret = new URLSearchParams(window.location.search).get(
            "payment_intent_client_secret"
        );

        if (!clientSecret) {
            return;
        }

        stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
            switch (paymentIntent?.status) {
                case "succeeded":
                    setMessage("Payment succeeded!");
                    clearCart();
                    // Optional: redirect to success page
                    break;
                case "processing":
                    setMessage("Your payment is processing.");
                    break;
                case "requires_payment_method":
                    setMessage("Your payment was not successful, please try again.");
                    break;
                default:
                    setMessage("Something went wrong.");
                    break;
            }
        });
    }, [stripe]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setIsLoading(true);

        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                // Make sure to change this to your payment completion page
                return_url: `${window.location.origin}/store`,
            },
        });

        if (error.type === "card_error" || error.type === "validation_error") {
            setMessage(error.message || "An error occurred.");
        } else {
            setMessage("An unexpected error occurred.");
        }

        setIsLoading(false);
    };

    return (
        <form id="payment-form" onSubmit={handleSubmit} className="space-y-6">
            <h3 className="text-2xl font-bold font-display text-[#332F3A]">Payment Details</h3>
            <div className="clay-card p-6 !rounded-[24px]">
                <PaymentElement id="payment-element" options={{ layout: "tabs" }} />
            </div>

            <button
                disabled={isLoading || !stripe || !elements}
                id="submit"
                className="w-full clay-button py-4 text-lg mt-6 bg-[#7C3AED] disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <span id="button-text">
                    {isLoading ? <div className="spinner border-2 border-white w-6 h-6 rounded-full animate-spin mx-auto"></div> : "Pay now"}
                </span>
            </button>
            {message && <div id="payment-message" className="text-red-500 text-sm mt-4 font-bold bg-red-50 p-4 rounded-[16px] shadow-sm">{message}</div>}
        </form>
    );
}

export default function CheckoutPage() {
    const [clientSecret, setClientSecret] = useState("");
    const { cartItems, cartTotal } = useCart();
    const router = useRouter();

    useEffect(() => {
        if (cartItems.length === 0) {
            // Just for safety if arriving here with empty cart
            // router.push("/store"); 
            return;
        }

        // Create PaymentIntent as soon as the page loads
        fetch("/api/create-payment-intent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                items: cartItems.map(item => ({ id: item.product.id, quantity: item.quantity }))
            }),
        })
            .then((res) => res.json())
            .then((data) => setClientSecret(data.clientSecret));
    }, [cartItems]);

    const appearance = {
        theme: 'stripe' as const,
        variables: {
            colorPrimary: '#7C3AED',
            colorBackground: '#ffffff',
            colorText: '#332F3A',
            borderRadius: '16px',
        }
    };
    const options = {
        clientSecret,
        appearance,
    };

    if (cartItems.length === 0) {
        return (
            <div className="min-h-screen py-32 text-center px-4 bg-[#F4F1FA]">
                <h1 className="text-3xl font-black font-display text-[#332F3A] mb-4">Your cart is empty</h1>
                <button onClick={() => router.push('/store')} className="clay-button inline-block px-8">Return to Store</button>
            </div>
        )
    }

    return (
        <div className="min-h-screen pt-32 pb-24 overflow-hidden">
            {/* Background Blobs */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
                <div className="absolute top-[10%] -left-[10%] h-[60vh] w-[60vh] rounded-full bg-[#8B5CF6] opacity-10 blur-3xl animate-float"></div>
                <div className="absolute bottom-[10%] -right-[10%] h-[50vh] w-[50vh] rounded-full bg-[#EC4899] opacity-10 blur-3xl animate-float-delayed"></div>
            </div>

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
                <h1 className="text-5xl font-black font-display text-[#332F3A] mb-12">Checkout</h1>

                <div className="lg:grid lg:grid-cols-2 lg:gap-x-12 xl:gap-x-16">
                    {/* Order Summary */}
                    <div className="mb-10 lg:mb-0">
                        <h2 className="text-2xl font-bold font-display text-[#332F3A] mb-6">Order Summary</h2>
                        <div className="clay-card p-8 !rounded-[32px]">
                            <ul className="divide-y divide-[#635F69]/10">
                                {cartItems.map(({ product, quantity }) => (
                                    <li key={product.id} className="py-4 flex justify-between">
                                        <div>
                                            <h3 className="text-lg font-bold text-[#332F3A]">{product.title}</h3>
                                            <div className="text-sm font-bold text-[#635F69]">Qty: {quantity}</div>
                                        </div>
                                        <div className="text-lg font-black text-[#332F3A]">{product.currency} {product.price}</div>
                                    </li>
                                ))}
                            </ul>
                            <dl className="mt-6 space-y-4 border-t border-[#635F69]/10 pt-4">
                                <div className="flex items-center justify-between">
                                    <dt className="text-base font-bold text-[#635F69]">Subtotal</dt>
                                    <dd className="text-base font-bold text-[#332F3A]">${cartTotal.toFixed(2)}</dd>
                                </div>
                                <div className="flex items-center justify-between">
                                    <dt className="text-base font-bold text-[#635F69]">Shipping</dt>
                                    <dd className="text-base font-bold text-[#332F3A]">$5.00</dd>
                                </div>
                                <div className="flex items-center justify-between border-t border-[#635F69]/10 pt-4">
                                    <dt className="text-xl font-black text-[#332F3A]">Total</dt>
                                    <dd className="text-xl font-black text-[#7C3AED]">${(cartTotal + 5).toFixed(2)}</dd>
                                </div>
                            </dl>
                        </div>
                    </div>

                    {/* Stripe Form */}
                    <div>
                        {clientSecret ? (
                            <Elements options={options} stripe={stripePromise}>
                                <CheckoutForm clientSecret={clientSecret} />
                            </Elements>
                        ) : (
                            <div className="flex justify-center py-10">
                                <div className="spinner border-4 border-[#7C3AED] border-t-transparent w-10 h-10 rounded-full animate-spin"></div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
