"use client";

import { useCart } from '@/context/CartContext';
import { Product } from '@/types';
import { useState } from 'react';
import { ShoppingBag } from 'lucide-react';

export default function AddToCartButton({ product }: { product: Product }) {
    const { addToCart } = useCart();
    const [isAdded, setIsAdded] = useState(false);

    const handleAdd = () => {
        addToCart(product);
        setIsAdded(true);
        setTimeout(() => setIsAdded(false), 2000);
    };

    return (
        <button
            onClick={handleAdd}
            className={`flex max-w-xs flex-1 items-center justify-center font-bold text-white shadow-clay-button hover:shadow-clay-button-hover hover:-translate-y-1 active:scale-95 active:shadow-clay-pressed transition-all duration-200 rounded-[20px] h-14 sm:w-full ${isAdded ? 'bg-[#10B981]' : 'bg-linear-to-br from-[#A78BFA] to-[#7C3AED]'
                }`}
        >
            <ShoppingBag className="mr-2 h-5 w-5" />
            {isAdded ? 'Added to Cart' : 'Add to Cart'}
        </button>
    );
}
