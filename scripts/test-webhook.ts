import 'dotenv/config';
import crypto from 'crypto';

const WEBHOOK_SECRET = process.env.WOOCOMMERCE_WEBHOOK_SECRET;
if (!WEBHOOK_SECRET) {
    console.error("Missing WOOCOMMERCE_WEBHOOK_SECRET");
    process.exit(1);
}
const API_URL = 'http://localhost:3000/api/webhooks/woocommerce';

// Mock Order Payload
const mockOrder = {
    id: 12345,
    status: 'processing',
    date_created: new Date().toISOString(),
    billing: {
        first_name: 'Test',
        last_name: 'Webhook',
        email: 'webhook.test@example.com',
        phone: '1234567890',
        address_1: 'Test Street 1',
        city: 'Belgrade'
    },
    customer_id: 101 // Registered user
};

async function testWebhook() {
    console.log('🚀 Testing Webhook Endpoint...');

    const body = JSON.stringify(mockOrder);

    // Generate Signature
    const signature = crypto
        .createHmac('sha256', WEBHOOK_SECRET as string)
        .update(body)
        .digest('base64');

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-wc-webhook-topic': 'order.created',
                'x-wc-webhook-signature': signature,
                'x-wc-webhook-source': 'localhost-test',
                'x-wc-webhook-id': '999'
            },
            body: body
        });

        const text = await response.text();
        console.log(`📡 Status: ${response.status}`);

        try {
            const data = JSON.parse(text);
            console.log('📄 Response JSON:', data);
        } catch (e) {
            console.error('❌ Failed to parse JSON. Raw text:', text.substring(0, 500));
        }

    } catch (error) {
        console.error('❌ Request failed:', error);
    }
}

testWebhook();
