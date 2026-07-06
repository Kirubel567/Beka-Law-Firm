import { NextResponse } from "next/server";
import { collections } from "@/lib/cms/schema";
import { listInquiries, listItems } from "@/lib/cms/store";

/** Live counts for the portal sidebar. */
export async function GET() {
  const byCollection = Object.fromEntries(
    collections.map((c) => {
      const items = listItems(c.slug);
      return [
        c.slug,
        { total: items.length, drafts: items.filter((i) => i.status === "draft").length },
      ];
    }),
  );
  return NextResponse.json({ collections: byCollection, inquiries: listInquiries().length });
}
