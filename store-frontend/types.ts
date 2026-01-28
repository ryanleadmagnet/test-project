import axios from "axios";
import qs from "qs";

export interface StrapiResponse<T> {
    data: T;
    meta: {
        pagination: {
            page: number;
            pageSize: number;
            pageCount: number;
            total: number;
        };
    };
}

export interface StrapiSingleResponse<T> {
    data: StrapiData<T>;
    meta: {};
}

export type StrapiData<T> = T & {
    id: number;
    documentId: string;
};


export interface Image {
    id: number;
    documentId: string;
    url: string;
    alternativeText?: string;
    width?: number;
    height?: number;
}

export interface Category {
    id: number;
    documentId: string;
    name: string;
    slug: string;
    products?: Product[];
}

export interface Product {
    id: number;
    documentId: string;
    title: string;
    slug: string;
    subtitle?: string;
    description: any;
    price: number;
    currency: string;
    image?: Image;
    category?: Category;
}

export interface Hero {
    id: number;
    documentId: string;
    title: string;
    subtitle: string;
    buttonText: string;
    buttonLink: string;
    image?: Image;
}

export interface FeatureAttributes {
    title: string;
    description: string;
    icon: string;
}

// Strapi v5 returns features as flat objects
export interface FeatureFlat {
    id: number;
    documentId: string;
    title: string;
    description: string;
    icon: string;
    createdAt: string;
    updatedAt: string;
    publishedAt: string;
}

// export type Category = StrapiData<CategoryAttributes>;
// export type Product = StrapiData<ProductAttributes>;
// export type Hero = StrapiData<HeroAttributes>;
export type Feature = FeatureFlat;
