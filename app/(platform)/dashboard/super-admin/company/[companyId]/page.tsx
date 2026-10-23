"use client";

import { useParams } from "next/navigation";
import { SuperAdminCompanyDetailView } from "../components/SuperAdminCompanyDetailView";

export default function SuperAdminCompanyDetailPage() {
  const params = useParams<{ companyId: string }>();
  const companyId = params?.companyId ?? "";

  return <SuperAdminCompanyDetailView companyId={companyId} />;
}
