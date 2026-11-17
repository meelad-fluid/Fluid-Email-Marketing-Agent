import { redirect } from "next/navigation";
import { currentStaff } from "@/lib/auth/staff";

export const dynamic = "force-dynamic";
export const metadata = { title: "Fluid Creatives", robots: { index: false, follow: false } };

// Every /admin page: Fluid staff only.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const staff = await currentStaff();
  if (!staff) redirect("/login");
  return (
    <>
      {staff.dev && <div className="dev-banner">Development mode: Supabase isn&apos;t connected, so data is saved in out/dev-store and anyone can open this view.</div>}
      {children}
    </>
  );
}
