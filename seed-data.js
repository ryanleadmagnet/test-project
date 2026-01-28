const axios = require('axios');

const API_URL = 'http://localhost:1337/api';
const API_TOKEN = '0a545cdbc497332f273b08a23749cb7cfa4467a1876f121eb314d7eef7d2bad0992e0728a34b6e439a1f95e2a3200b51b0a53e4f3b300df62d15067f44e0b048d88a2fdebbafa11a7fff39d39507a075cd7594083040dfa92a11886f6187c283d8cbf94c7ae4bfab4281f1f82ec0f5d9cc513fdc915185c493b5a8a12d26f82c';

const headers = {
    Authorization: `Bearer ${API_TOKEN}`,
    'Content-Type': 'application/json',
};

const categories = [
    { name: 'Technology', slug: 'technology' },
    { name: 'Gear', slug: 'gear' },
    { name: 'Accessory', slug: 'accessory' },
];

const products = [
    {
        title: 'Smart Table Clock',
        slug: 'smart-table-clock',
        price: 129.99,
        categoryName: 'Technology',
        description: 'A beautiful smart clock for your desk.',
    },
    {
        title: 'Audio Pro G10',
        slug: 'audio-pro-g10',
        price: 299.00,
        categoryName: 'Technology',
        description: 'High fidelity audio speaker.',
    },
    {
        title: 'Camera Lens Kit',
        slug: 'camera-lens-kit',
        price: 89.99,
        categoryName: 'Gear',
        description: 'Professional lens kit for mobile photography.',
    },
    {
        title: 'Travel Backpack',
        slug: 'travel-backpack',
        price: 149.50,
        categoryName: 'Gear',
        description: 'Durable backpack for adventures.',
    },
    {
        title: 'Leather Case',
        slug: 'leather-case',
        price: 49.99,
        categoryName: 'Accessory',
        description: 'Premium leather finish.',
    }
];

const hero = {
    title: 'Innovative Tech for Modern Life',
    subtitle: 'Discover the future of everyday essentials.',
    buttonText: 'Explore Products',
    buttonLink: '/store',
};

const features = [
    { title: 'Free Shipping', description: 'On all orders over $50', icon: 'truck' },
    { title: 'Safe Payments', description: 'Visas, Mastercard, Stripe', icon: 'lock' },
    { title: 'Free Returns', description: 'Within 30 days of purchase', icon: 'refresh' }
];

async function seed() {
    try {
        console.log('Starting seed...');

        // 1. Create Categories
        const categoryMap = {};
        for (const cat of categories) {
            // Check if exists
            const exists = await axios.get(`${API_URL}/categories?filters[slug][$eq]=${cat.slug}`, { headers });
            if (exists.data.data.length === 0) {
                const res = await axios.post(`${API_URL}/categories`, { data: cat }, { headers });
                console.log(`Created Category: ${cat.name}`);
                categoryMap[cat.name] = res.data.data.id;
            } else {
                console.log(`Category exists: ${cat.name}`);
                categoryMap[cat.name] = exists.data.data[0].id;
            }
        }

        // 2. Create Products
        for (const prod of products) {
            const exists = await axios.get(`${API_URL}/products?filters[slug][$eq]=${prod.slug}`, { headers });
            if (exists.data.data.length === 0) {
                const payload = {
                    ...prod,
                    category: categoryMap[prod.categoryName] // Relation ID
                };
                delete payload.categoryName;

                payload.description = prod.description;

                try {
                    await axios.post(`${API_URL}/products`, { data: payload }, { headers });
                    console.log(`Created Product: ${prod.title}`);
                } catch (e) {
                    console.error(`Failed to create product ${prod.title}`, e.response?.data || e.message);
                }
            } else {
                console.log(`Product exists: ${prod.title}`);
            }
        }

        // 3. Create Hero (Single Type - Update)
        try {
            await axios.put(`${API_URL}/hero`, { data: hero }, { headers });
            console.log('Updated Hero Content');
        } catch (e) {
            console.error('Hero update failed', e.response?.data);
        }

        // 4. Create Features
        for (const feat of features) {
            const exists = await axios.get(`${API_URL}/features?filters[title][$eq]=${feat.title}`, { headers });
            if (exists.data.data.length === 0) {
                await axios.post(`${API_URL}/features`, { data: feat }, { headers });
                console.log(`Created Feature: ${feat.title}`);
            } else {
                console.log(`Feature exists: ${feat.title}`);
            }
        }

        console.log('Seeding complete!');
    } catch (error) {
        console.error('Seeding failed:', error.response ? error.response.data : error.message);
    }
}

seed();
