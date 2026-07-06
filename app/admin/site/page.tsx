import Link from "next/link";
import { getSite } from "@/lib/cms/store";
import SiteForm from "@/components/admin/SiteForm";

export const dynamic = "force-dynamic";

export default function SiteSettingsPage() {
  const site = getSite();
  return (
    <>
      <Link href="/admin" className="label-caps text-parchment-200/50 hover:text-brass-300">
        ← Content
      </Link>
      <h1 className="mt-2 font-display text-3xl font-medium text-parchment-50">Site settings</h1>
      <p className="mt-2 max-w-2xl text-sm text-parchment-200/60">
        The homepage hero image and the office contact details shown on the
        contact page and in the footer.
      </p>
      <SiteForm initial={site} />
    </>
  );
}
