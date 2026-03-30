export interface IntegrationPage {
  id: string;
  slug: string;
  title: string;
  description: string;
  keywords: string[];
  service: string;
  icon: string;
  content: string;
  setupTime: string;
  difficulty: 'Easy' | 'Medium' | 'Advanced';
}
