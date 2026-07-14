import type { Locale } from "@/lib/content/types";

export type AssistantLocale = Locale;

export interface AssistantHistoryMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AssistantRequestBody {
  message: string;
  locale: AssistantLocale;
  session_id: string;
  history: AssistantHistoryMessage[];
}

export interface AssistantCitation {
  id: string;
  source_id: string;
  title: string;
  url: string | null;
  issuer: string | null;
  jurisdiction: string | null;
  page: number | null;
  score: number;
}

export type SourceStatus = "pending" | "approved" | "rejected";

export interface AssistantSource {
  id: string;
  kind: "website" | "public_legal";
  title: string;
  canonical_url: string | null;
  issuer: string | null;
  jurisdiction: string | null;
  language: "en";
  publication_status: SourceStatus;
  media_type: string;
  original_filename: string | null;
  chunk_count: number;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
  approved_by: string | null;
}

export interface WebsiteCorpusDocument {
  external_key: string;
  title: string;
  canonical_url: string;
  text: string;
  language: "en";
}
