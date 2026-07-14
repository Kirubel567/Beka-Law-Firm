import AssistantSources from "@/components/admin/AssistantSources";
import { currentUser } from "@/lib/users";

export const dynamic = "force-dynamic";

export default async function AssistantAdminPage() {
  const user = await currentUser();
  if (user?.role !== "admin") {
    return (
      <div className="mx-auto max-w-3xl border border-(--p-border) bg-(--p-panel) p-8">
        <h2 className="font-display text-3xl text-(--p-text)">Administrator access required</h2>
        <p className="mt-3 text-sm text-(--p-text-3)">Only administrators can approve or remove assistant sources.</p>
      </div>
    );
  }
  return <AssistantSources />;
}
