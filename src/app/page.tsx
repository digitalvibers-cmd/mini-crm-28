"use client";

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { Header } from "@/components/layout/Header";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { OrdersChart } from "@/components/dashboard/OrdersChart";
import DeliveryVolumeChart from "@/components/analytics/DeliveryVolumeChart";
import { Users, UserCheck, Monitor } from "lucide-react";

// Dynamically import Map to avoid SSR issues with Leaflet
const DeliveryMap = dynamic(() => import('@/components/dashboard/DeliveryMap'), {
  loading: () => <div className="h-[300px] w-full bg-slate-50 flex items-center justify-center rounded-xl text-slate-400">Učitavanje Mape...</div>,
  ssr: false
});

interface AnalyticsData {
  totalCustomers: number;
  totalOrders: number;
  activeNow: number;
  chartData: { name: string; orders: number }[];
}

export default function Home() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/analytics');
        if (!res.ok) throw new Error("Failed to fetch");
        const json = await res.json();
        setData(json);
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <div className="h-full">
      <Header title="Zdravo Evano 👋," />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
        <StatsCard
          icon={Users}
          label="Ukupno Kupaca"
          value={loading || !data ? "..." : data.totalCustomers.toLocaleString()}
          trend={{ value: "16%", isUp: true, label: "ovog meseca" }}
          iconClassName="text-[#16c098]"
          iconContainerClassName="bg-[#d3ffe7]"
        />

        <StatsCard
          icon={UserCheck}
          label="Ukupno Porudžbina"
          value={loading || !data ? "..." : data.totalOrders.toLocaleString()}
          trend={{ value: "1%", isUp: false, label: "ovog meseca" }}
          iconClassName="text-[#16c098]"
          iconContainerClassName="bg-[#d3ffe7]"
        />

        <StatsCard
          icon={Monitor}
          label="Aktivne (Processing)"
          value={loading || !data ? "..." : data.activeNow.toLocaleString()}
          iconClassName="text-[#16c098]"
          iconContainerClassName="bg-[#d3ffe7]"
        >
          {/* Creating the avatar stack effect */}
          <div className="flex -space-x-2 mt-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <img
                key={i}
                src={`https://i.pravatar.cc/100?img=${i + 10}`}
                alt="User"
                className="w-6 h-6 rounded-full border-2 border-white"
              />
            ))}
          </div>
        </StatsCard>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[30px] shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center h-[300px] text-slate-400">Učitavanje...</div>
          ) : (
            <div className="space-y-10">
              {/* 1. Delivery Volume Section (First) */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold">Planirana Dostava</h2>
                    <p className="text-sm text-slate-400">Projekcija broja paketa (14 dana)</p>
                  </div>
                </div>
                <DeliveryVolumeChart />
              </div>

              {/* 2. Orders Trend Section (Second) */}
              <div className="border-t border-slate-100 pt-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold">Trend Porudžbina</h2>
                    <p className="text-sm text-slate-400">Dnevni broj porudžbina</p>
                  </div>
                </div>
                <OrdersChart data={data?.chartData} />
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-1 bg-white p-8 rounded-[30px] shadow-sm">
          <h2 className="text-xl font-bold mb-2">Mapa Dostave</h2>
          <p className="text-sm text-slate-400 mb-6">Zone visoke gustine dostave</p>
          <DeliveryMap />
        </div>
      </div>
    </div>
  );
}
