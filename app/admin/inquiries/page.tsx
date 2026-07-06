import Link from "next/link";
import { listInquiries } from "@/lib/cms/store";
import InquiryDeleteButton from "@/components/admin/InquiryDeleteButton";

export const dynamic = "force-dynamic";

export default function InquiriesPage() {
  const inquiries = listInquiries();

  return (
    <>
      <Link href="/admin" className="label-caps text-parchment-200/50 hover:text-brass-300">
        ← Content
      </Link>
      <h1 className="mt-2 font-display text-3xl font-medium text-parchment-50">Inquiries</h1>
      <p className="mt-2 max-w-2xl text-sm text-parchment-200/60">
        Consultation requests from the public site, newest first. These are
        confidential correspondence — treat them accordingly.
      </p>

      <div className="mt-8 space-y-5">
        {inquiries.length === 0 && (
          <p className="border border-parchment-100/10 bg-basalt-900 p-8 text-sm text-parchment-200/50">
            No inquiries yet.
          </p>
        )}
        {inquiries.map((q) => (
          <article key={q.id} className="border border-parchment-100/10 bg-basalt-900 p-7">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="font-display text-xl text-parchment-100">
                {q.name}
                {q.organization && (
                  <span className="text-parchment-200/50"> · {q.organization}</span>
                )}
              </h2>
              <span className="text-xs text-parchment-200/40">
                {new Date(q.createdAt).toLocaleString("en-GB")}
              </span>
            </div>
            <div className="label-caps mt-2 flex flex-wrap gap-4 text-brass-400/80">
              <span>{q.matter || "Unspecified"}</span>
              <span>· reply in {q.language || "en"}</span>
              <a href={`mailto:${q.email}`} className="text-parchment-200/70 hover:text-brass-300">
                {q.email}
              </a>
            </div>
            <p className="mt-4 text-sm leading-relaxed whitespace-pre-line text-parchment-200/80">
              {q.message}
            </p>
            <div className="mt-4 flex justify-end">
              <InquiryDeleteButton id={q.id} />
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
