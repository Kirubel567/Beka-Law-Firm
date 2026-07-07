export type Locale = "en" | "am" | "om";

export interface TimelineEntry {
  year: string;
  title: string;
  text: string;
  /** "firm" — a firm milestone; "context" — a national/legal milestone woven into the line */
  kind: "firm" | "context";
}

export interface Person {
  slug: string;
  name: string;
  role: string;
  custodyOf: string;
  languages: string;
  bio: string[];
  credentials: string[];
  /** portrait uploaded via the staff portal; null renders the seal placeholder */
  image?: string | null;
}

export interface PracticeArea {
  slug: string;
  name: string;
  oneLine: string;
  detail: string[];
  representative: string[];
}

export interface Matter {
  sector: string;
  headline: string;
  facts: [string, string][];
}

export interface Article {
  slug: string;
  title: string;
  category: string;
  date: string;
  excerpt: string;
  body: string[];
}

export interface Quote {
  text: string;
  attribution: string;
}

export interface Dict {
  langName: string;
  meta: {
    siteName: string;
    titleSuffix: string;
    description: string;
  };
  nav: {
    origins: string;
    people: string;
    practice: string;
    matters: string;
    presence: string;
    insights: string;
    testimonials: string;
    discretion: string;
    careers: string;
    contact: string;
    requestConsultation: string;
    menu: string;
    close: string;
  };
  /** Chapter numerals — Roman for Latin locales, Ge'ez numerals for Amharic */
  chapters: string[];
  common: {
    firmShort: string;
    firmFull: string;
    estLine: string;
    cityLine: string;
    chapterWord: string;
    continueReading: string;
    back: string;
  };
  home: {
    kicker: string;
    heroTitle: string;
    heroLede: string;
    heroNote: string;
    scrollHint: string;
    ledger: [string, string][];
    chaptersKicker: string;
    chaptersTitle: string;
    chaptersLede: string;
    chapterIndex: { href: string; title: string; line: string }[];
    practiceKicker: string;
    practiceTitle: string;
    practiceLede: string;
    viewAllPractice: string;
    mattersKicker: string;
    mattersTitle: string;
    mattersLede: string;
    viewAllMatters: string;
    quotesKicker: string;
    quotesTitle: string;
    quotes: Quote[];
    quotesNote: string;
    viewAllQuotes: string;
    discretionKicker: string;
    discretionTitle: string;
    discretionText: string;
    discretionLink: string;
    contactKicker: string;
    contactTitle: string;
    contactText: string;
    contactCta: string;
  };
  origins: {
    kicker: string;
    title: string;
    lede: string;
    story: string[];
    principlesTitle: string;
    principles: { title: string; text: string }[];
    timelineKicker: string;
    timelineTitle: string;
    timelineLede: string;
    timeline: TimelineEntry[];
    contextLabel: string;
  };
  people: {
    kicker: string;
    title: string;
    lede: string;
    custodyLabel: string;
    languagesLabel: string;
    credentialsLabel: string;
    partners: Person[];
    directoryNote: string;
    readProfile: string;
  };
  practice: {
    kicker: string;
    title: string;
    lede: string;
    representativeLabel: string;
    areas: PracticeArea[];
    inquireCta: string;
  };
  matters: {
    kicker: string;
    title: string;
    lede: string;
    note: string;
    items: Matter[];
  };
  presence: {
    kicker: string;
    title: string;
    lede: string;
    blocks: { title: string; text: string }[];
    affiliationsTitle: string;
    affiliations: string[];
    languagesTitle: string;
    languages: string[];
    jurisdictionsTitle: string;
    jurisdictions: string[];
  };
  insights: {
    kicker: string;
    title: string;
    lede: string;
    readArticle: string;
    articles: Article[];
  };
  discretion: {
    kicker: string;
    title: string;
    lede: string;
    principles: { title: string; text: string }[];
    closing: string;
  };
  testimonials: {
    kicker: string;
    title: string;
    lede: string;
    note: string;
  };
  careers: {
    kicker: string;
    title: string;
    lede: string;
    body: string[];
    howTitle: string;
    how: string[];
    mailLine: string;
  };
  contact: {
    kicker: string;
    title: string;
    lede: string;
    form: {
      name: string;
      organization: string;
      organizationOptional: string;
      email: string;
      language: string;
      matter: string;
      matterOptions: string[];
      message: string;
      messageHint: string;
      submit: string;
      sending: string;
    };
    confirmation: {
      title: string;
      text: string;
      again: string;
    };
    office: {
      title: string;
      lines: string[];
      emailLabel: string;
      email: string;
      phoneLabel: string;
      phone: string;
      hoursLabel: string;
      hours: string;
    };
    privacyNote: string;
  };
  footer: {
    blurb: string;
    chaptersTitle: string;
    firmTitle: string;
    languagesTitle: string;
    note: string;
    rights: string;
  };
}
