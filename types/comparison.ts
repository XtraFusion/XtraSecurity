export interface ComparisonFeature {
  name: string;
  xtraSecurity: string | boolean;
  competitor: string | boolean;
  note?: string;
}

export interface ComparisonPage {
  id: string;
  slug: string;
  title: string;
  description: string;
  keywords: string[];
  competitorName: string;
  competitorUrl: string;
  shortDescription: string;
  features: ComparisonFeature[];
  xtraSecurityAdvantages: string[];
  useCase: string;
  dateUpdated: string;
}
