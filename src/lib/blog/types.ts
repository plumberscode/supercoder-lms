export type BlogCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  order_index: number;
};

export type FaqItem = { q: string; a: string };

export type BlogPostSummary = {
  id: string;
  title: string;
  slug: string;
  headline: string | null;
  excerpt: string | null;
  meta_description: string | null;
  image_url: string | null;
  image_alt: string | null;
  author_name: string | null;
  published_at: string;
  updated_at: string;
  category: BlogCategory | null;
};

export type BlogPost = BlogPostSummary & {
  content: string;
  category_id: string | null;
  faq: FaqItem[];
  noindex: boolean;
  is_published: boolean;
  created_at: string;
};

export type TocItem = { id: string; text: string; level: 2 | 3 };
