import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, getCurrentProfile } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");

  const profile = await getCurrentProfile();
  if (!profile?.is_admin) redirect("/");

  return (
    <div className="mx-auto max-w-7xl px-5 sm:px-8 py-10">
      <div className="flex items-center gap-8 mb-10 border-b border-sand pb-4">
        <Link href="/admin" className="font-display text-xl">
          Admin
        </Link>
        <nav className="flex items-center gap-6 text-sm text-taupe">
          <Link href="/admin/posters" className="hover:text-clay transition-colors">
            Posters
          </Link>
          <Link href="/admin/orders" className="hover:text-clay transition-colors">
            Orders
          </Link>
        </nav>
      </div>
      {children}
    </div>
  );
}
