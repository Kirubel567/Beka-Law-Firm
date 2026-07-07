import Link from "next/link";
import { listInquiries } from "@/lib/cms/store";
import InquiryDeleteButton from "@/components/admin/InquiryDeleteButton";

export const dynamic = "force-dynamic";

export default function InquiriesPage() {
  const inquiries = listInquiries();

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/admin" className="label-caps text-(--p-text-3) hover:text-(--p-accent)">
        ← Dashboard
      </Link>
      <h1 className="mt-2 font-display text-3xl font-medium text-(--p-text)">Inquiries</h1>
      <p className="mt-2 max-w-2xl text-sm text-(--p-text-3)">
        Consultation requests from the public site, newest first. These are
        confidential correspondence — treat them accordingly.
      </p>

      <div className="mt-8 space-y-5">
        {inquiries.length === 0 && (
          <p className="border border-(--p-border) bg-(--p-panel) p-8 text-sm text-(--p-text-3)">
            No inquiries yet.
          </p>
        )}
        {inquiries.map((q) => (
          <article key={q.id} className="border border-(--p-border) bg-(--p-panel) p-7">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="font-display text-xl text-(--p-text)">
                {q.name}
                {q.organization && (
                  <span className="text-(--p-text-3)"> · {q.organization}</span>
                )}
              </h2>
              <span className="text-xs text-(--p-text-4)">
                {new Date(q.createdAt).toLocaleString("en-GB")}
              </span>
            </div>
            <div className="label-caps mt-2 flex flex-wrap gap-4 text-(--p-accent-2)">
              <span>{q.matter || "Unspecified"}</span>
              <span>· reply in {q.language || "en"}</span>
              <a href={`mailto:${q.email}`} className="text-(--p-text-2) hover:text-(--p-accent)">
                {q.email}
              </a>
            </div>
            <p className="mt-4 text-sm leading-relaxed whitespace-pre-line text-(--p-text-2)">
              {q.message}
            </p>
            <div className="mt-4 flex justify-end">
              <InquiryDeleteButton id={q.id} />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
