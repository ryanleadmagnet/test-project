const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:1337/api';
const API_TOKEN = '0a545cdbc497332f273b08a23749cb7cfa4467a1876f121eb314d7eef7d2bad0992e0728a34b6e439a1f95e2a3200b51b0a53e4f3b300df62d15067f44e0b048d88a2fdebbafa11a7fff39d39507a075cd7594083040dfa92a11886f6187c283d8cbf94c7ae4bfab4281f1f82ec0f5d9cc513fdc915185c493b5a8a12d26f82c';

const headers = {
    Authorization: `Bearer ${API_TOKEN}`,
};

const mapping = {
    'smart-table-clock': 'smart-table-clock.png',
    'audio-pro-g10': 'audio-pro-g10.png',
    'camera-lens-kit': 'camera-lens-kit.png',
    'travel-backpack': 'travel-backpack.png',
    'leather-case': 'leather-case.png',
};

async function uploadImage(filename) {
    const filePath = path.join(__dirname, '../assets', filename);
    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        return null;
    }

    const form = new FormData();
    form.append('files', fs.createReadStream(filePath));

    try {
        const response = await axios.post(`${API_URL}/upload`, form, {
            headers: {
                ...headers,
                ...form.getHeaders(),
            },
        });
        return response.data[0];
    } catch (error) {
        console.error(`Failed to upload ${filename}:`, error.response?.data || error.message);
        return null;
    }
}

async function updateProduct(slug, imageId) {
    try {
        const res = await axios.get(`${API_URL}/products?filters[slug][$eq]=${slug}`, { headers });
        if (res.data.data.length === 0) {
            console.log(`Product not found: ${slug}`);
            return;
        }
        const product = res.data.data[0];
        // Strapi v5 prefers documentId for updates
        const id = product.documentId || product.id;

        await axios.put(`${API_URL}/products/${id}`, {
            data: {
                image: imageId
            }
        }, { headers });
        console.log(`Updated product ${slug} with image ${imageId}`);
    } catch (error) {
        console.error(`Failed to update product ${slug}:`, error.response?.data || error.message);
    }
}

async function updateHero() {
    const filename = 'hero-background.png';
    const image = await uploadImage(filename);
    if (!image) return;

    try {
        await axios.put(`${API_URL}/hero`, {
            data: {
                image: image.id
            }
        }, { headers });
        console.log(`Updated Hero with image ${image.id}`);
    } catch (error) {
        console.error(`Failed to update Hero:`, error.response?.data || error.message);
    }
}

async function run() {
    // Products
    for (const [slug, filename] of Object.entries(mapping)) {
        console.log(`Processing ${slug}...`);
        const image = await uploadImage(filename);
        if (image) {
            await updateProduct(slug, image.id);
        }
    }

    // Hero
    console.log('Processing Hero...');
    await updateHero();
}

run();
