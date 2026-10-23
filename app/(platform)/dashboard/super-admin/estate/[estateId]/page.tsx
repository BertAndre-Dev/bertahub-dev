"use client";

import { useParams } from "next/navigation";
import { SuperAdminEstateDetailView } from "../components/SuperAdminEstateDetailView";

export default function SuperAdminEstateDetailPage() {
  const params = useParams<{ estateId: string }>();
  const estateId = params?.estateId ?? "";

  return <SuperAdminEstateDetailView estateId={estateId} />;
}
