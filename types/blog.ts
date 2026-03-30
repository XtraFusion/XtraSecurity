export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  description: string;
  keywords: string[];
  content: string;
  author: string;
  date: string;
  category: string;
  readTime: number;
  featured: boolean;
  image?: string;
  canonical?: string;
}

export interface BlogMetadata {
  title: string;
  description: string;
  keywords: string[];
  date: string;
  author: string;
  category: string;
  readTime: number;
  featured?: boolean;
  image?: string;
  canonical?: string;
}
