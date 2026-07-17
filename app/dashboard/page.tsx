"use client";

import dynamic from "next/dynamic";

const Dashboard = dynamic(() => import("@/components/creator/Dashboard"), {
  ssr: false,
});

export default function DashboardPage() {
  return <Dashboard />;
}
