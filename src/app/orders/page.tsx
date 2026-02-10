"use client";

import { Header } from "@/components/layout/Header";
import { OrdersTable } from "@/components/orders/OrdersTable";

export default function OrdersPage() {
    return (
        <div className="h-full">
            <Header title="Orders" />
            <OrdersTable />
        </div>
    );
}
