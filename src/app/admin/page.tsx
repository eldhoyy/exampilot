import { redirect } from "next/navigation";
import { isAdminSession } from "@/lib/admin-auth";
import AdminDashboard from "./dashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAdminSession())) redirect("/admin/login");
  return <AdminDashboard />;
}
