export interface DocPage {
  id: string;
  slug: string;
  title: string;
  description: string;
  keywords: string[];
  category: string;
  content: string;
  order: number;
}

export interface DocCategory {
  name: string;
  slug: string;
  description: string;
  pages: DocPage[];
}
