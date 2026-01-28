import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { fetchAPI } from '@/lib/api';
import { Product } from '@/types';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-12-18.acacia', // Use a stable API version
});

export async function POST(request: Request) {
    try {
        const { items } = await request.json();

        if (!items || items.length === 0) {
            return NextResponse.json({ error: 'No items in cart' }, { status: 400 });
        }

        // Fetch all products from Strapi to check valid prices
        // In a production app, fetch only specific IDs for optimization
        const productsRes = await fetchAPI('/products');
        const products: Product[] = productsRes.data;

        let total = 0;
        const shipping = 500; // $5.00 shipping

        for (const item of items) {
            const product = products.find((p) => p.id === item.id);
            if (product) {
                // Stripe expects integers (cents)
                // Assume product.price is float (e.g. 129.99), convert to cents correctly
                total += Math.round(product.price * 100) * item.quantity;
            }
        }

        const amount = total + shipping;

        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount,
            currency: 'usd',
            automatic_payment_methods: {
                enabled: true,
            },
        });

        return NextResponse.json({
            clientSecret: paymentIntent.client_secret,
        });

    } catch (error: any) {
        console.error('Error creating payment intent:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
