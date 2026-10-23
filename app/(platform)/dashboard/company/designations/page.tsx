import { redirect } from "next/navigation";

export default function CompanyDesignationsPage() {
  redirect("/dashboard/company/users?role=staff&tab=designations");
}
