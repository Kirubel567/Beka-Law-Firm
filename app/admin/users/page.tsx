import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser, listUsers } from "@/lib/users";
import UsersManager from "@/components/admin/UsersManager";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const me = await currentUser();
  if (!me || me.role !== "admin") redirect("/admin");

  const users = listUsers();

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/admin" className="label-caps text-(--p-text-3) hover:text-(--p-accent)">
        ← Dashboard
      </Link>
      <h1 className="mt-2 font-display text-3xl font-medium text-(--p-text)">Staff accounts</h1>
      <p className="mt-2 max-w-2xl text-sm text-(--p-text-3)">
        Everyone signs in with their own account. Editors manage content;
        administrators additionally manage accounts and see the activity log.
        Resetting a password or disabling an account signs that person out
        everywhere immediately.
      </p>

      <UsersManager initialUsers={users} meId={me.id} />
    </div>
  );
}
