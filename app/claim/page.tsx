"use client";

import dynamic from "next/dynamic";

const ClaimFlow = dynamic(() => import("@/components/creator/ClaimFlow"), {
  ssr: false,
});

export default function ClaimPage() {
  return <ClaimFlow />;
}
