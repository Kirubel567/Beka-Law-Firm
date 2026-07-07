import Link from "next/link";
import { getSite } from "@/lib/cms/store";
import SiteForm from "@/components/admin/SiteForm";

export const dynamic = "force-dynamic";

export default function SiteSettingsPage() {
  const site = getSite();
  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/admin" className="label-caps text-(--p-text-3) hover:text-(--p-accent)">
        ← Dashboard
      </Link>
      <h1 className="mt-2 font-display text-3xl font-medium text-(--p-text)">Site settings</h1>
      <p className="mt-2 max-w-2xl text-sm text-(--p-text-3)">
        The homepage hero image and the office contact details shown on the
        contact page and in the footer.
      </p>
      <SiteForm initial={site} />
    </div>
  );
}
