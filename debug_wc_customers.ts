import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config();

const api = new WooCommerceRestApi({
    url: process.env.NEXT_PUBLIC_WOOCOMMERCE_URL!,
    consumerKey: process.env.WOOCOMMERCE_CONSUMER_KEY!,
    consumerSecret: process.env.WOOCOMMERCE_CONSUMER_SECRET!,
    version: 'wc/v3'
});

async function debugCustomers() {
    try {
        console.log("Fetching customer Vanja with context=edit...");
        const response = await api.get('customers', {
            email: 'adaktarvanja@gmail.com',
            context: 'edit'
        });

        if (response.data.length > 0) {
            const customer = response.data[0];
            console.log("Customer Found:", customer.id);
            console.log("Orders Count (with context):", customer.orders_count);
            console.log("Meta Data:", JSON.stringify(customer.meta_data, null, 2));

            // Test 2: Reports API
            try {
                console.log("--- Testing Reports API ---");
                // reports/customers is usually for all customers, filtering might be tricky
                const report = await api.get('reports/customers', { customer_id: customer.id });
                console.log("Reports Data:", JSON.stringify(report.data, null, 2));
            } catch (e) {
                console.log("Reports API failed/empty");
            }

            // Test 3: Orders API Headers
            try {
                console.log("--- Testing Orders API Headers ---");
                const ordersResponse = await api.get('orders', {
                    customer: customer.id,
                    per_page: 1
                });
                console.log("X-WP-Total (Orders Count):", ordersResponse.headers['x-wp-total']);
            } catch (e) {
                console.error("Orders API fetch failed:", e);
            }

        } else {
            console.log("Customer not found.");
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

debugCustomers();
