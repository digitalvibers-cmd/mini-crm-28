const WooCommerceRestApi = require("@woocommerce/woocommerce-rest-api").default;
require('dotenv').config({ path: '.env.local' });

const api = new WooCommerceRestApi({
    url: process.env.NEXT_PUBLIC_WOOCOMMERCE_URL,
    consumerKey: process.env.WOOCOMMERCE_CONSUMER_KEY,
    consumerSecret: process.env.WOOCOMMERCE_CONSUMER_SECRET,
    version: 'wc/v3'
});

async function debugCustomer() {
    const phone = '0643073023';
    console.log(`Searching for customer with phone: ${phone}`);

    try {
        // 1. Search by phone string
        console.log('\n--- Attempt 1: Search by phone string ---');
        const res1 = await api.get('customers', { search: phone });
        console.log(`Found ${res1.data.length} results`);
        res1.data.forEach(c => {
            console.log(`- ID: ${c.id}, Name: ${c.first_name} ${c.last_name}, Phone: ${c.billing.phone}, Email: ${c.email}, Orders: ${c.orders_count}`);
        });

        // 2. Search by email (if we knew it, but here we debug phone)

        // 3. List all and filter (to see if search is failing)
        console.log('\n--- Attempt 2: List recent customers and check phones ---');
        const res2 = await api.get('customers', { per_page: 20 });
        const found = res2.data.find(c => c.billing.phone && c.billing.phone.replace(/[\s-]/g, '') === phone);

        if (found) {
            console.log('Found in list (search might be broken):');
            console.log(`- ID: ${found.id}, Phone: ${found.billing.phone}, Orders: ${found.orders_count}`);
        } else {
            console.log('Not found in recent 20 customers');
        }

        // 4. Search in ORDERS (to see if guest)
        console.log('\n--- Attempt 3: Search in ORDERS by search term ---');
        const res3 = await api.get('orders', { search: phone, per_page: 20 });
        console.log(`Found ${res3.data.length} orders matching search term`);
        res3.data.forEach(o => {
            console.log(`- Order ID: ${o.id}, Status: ${o.status}, Billing Phone: ${o.billing.phone}, Billing Email: ${o.billing.email}, Customer ID: ${o.customer_id}`);
        });

    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

debugCustomer();
