import type { Metadata } from "next"
import { getComparisonPage, comparisonPages } from "@/lib/comparison-data"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight, Check, X, AlertCircle } from "lucide-react"

interface Props {
  params: {
    slug: string
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const comparison = getComparisonPage(params.slug)
  
  if (!comparison) {
    return {
      title: "Comparison Not Found",
    }
  }

  return {
    title: comparison.title,
    description: comparison.description,
    keywords: comparison.keywords,
    openGraph: {
      title: comparison.title,
      description: comparison.description,
      type: "website",
      url: `https://xtrasecurity.in/comparisons/${comparison.slug}`,
    },
    alternates: {
      canonical: `https://xtrasecurity.in/comparisons/${comparison.slug}`,
    },
  }
}

export function generateStaticParams() {
  return comparisonPages.map((comparison) => ({
    slug: comparison.slug,
  }))
}

function FeatureCell({ value }: { value: string | boolean }) {
  if (typeof value === 'boolean') {
    return value ? (
      <div className="flex justify-center">
        <Check className="w-5 h-5 text-success" />
      </div>
    ) : (
      <div className="flex justify-center">
        <X className="w-5 h-5 text-muted-foreground opacity-30" />
      </div>
    );
  }
  return <span>{value}</span>;
}

export default function ComparisonPage({ params }: Props) {
  const comparison = getComparisonPage(params.slug)
  
  if (!comparison) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <div className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/comparisons" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Comparisons
          </Link>
        </div>
      </div>

      {/* Header */}
      <header className="py-12 border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
              Comparison
            </Badge>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-black dark:text-white">
            {comparison.title}
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8">
            {comparison.description}
          </p>

          <div className="flex gap-4 flex-wrap">
            <Link href="/register">
              <Button size="lg" className="gap-2">
                Try XtraSecurity Free
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <a href={comparison.competitorUrl} target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="gap-2">
                Learn about {comparison.competitorName}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </a>
          </div>

          {/* Last Updated */}
          <div className="text-sm text-muted-foreground mt-8 pt-8 border-t">
            Last updated: {new Date(comparison.dateUpdated).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </header>

      {/* Feature Comparison Table */}
      <section className="py-20 border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-12">Feature Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-primary/20">
                  <th className="text-left py-4 px-4 font-bold text-base">Feature</th>
                  <th className="text-center py-4 px-4 font-bold text-base">
                    <div className="text-primary">XtraSecurity</div>
                  </th>
                  <th className="text-center py-4 px-4 font-bold text-base">
                    <div>{comparison.competitorName}</div>
                  </th>
                  <th className="text-left py-4 px-4 font-bold text-base">Notes</th>
                </tr>
              </thead>
              <tbody>
                {comparison.features.map((feature, idx) => (
                  <tr key={idx} className="border-b hover:bg-primary/5 transition-colors">
                    <td className="py-4 px-4 font-medium">{feature.name}</td>
                    <td className="py-4 px-4 text-center">
                      <FeatureCell value={feature.xtraSecurity} />
                      {typeof feature.xtraSecurity === 'string' && (
                        <div className="text-sm text-muted-foreground mt-1">{feature.xtraSecurity}</div>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <FeatureCell value={feature.competitor} />
                      {typeof feature.competitor === 'string' && (
                        <div className="text-sm text-muted-foreground mt-1">{feature.competitor}</div>
                      )}
                    </td>
                    <td className="py-4 px-4 text-sm text-muted-foreground">
                      {feature.note}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* XtraSecurity Advantages */}
      <section className="py-20 border-b bg-primary/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-12">Why Choose XtraSecurity?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {comparison.xtraSecurityAdvantages.map((advantage, idx) => (
              <Card key={idx} className="border-primary/20">
                <CardHeader>
                  <div className="flex gap-4 items-start">
                    <Check className="w-6 h-6 text-success flex-shrink-0 mt-1" />
                    <CardTitle className="text-lg">{advantage}</CardTitle>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Use Case */}
      <section className="py-20 border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="border-primary/20">
            <CardHeader>
              <div className="flex gap-4 items-start">
                <AlertCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <CardTitle className="text-2xl mb-4">When to Use Which Platform</CardTitle>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    {comparison.useCase}
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-primary/5 to-primary/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Make a Decision?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Start with XtraSecurity's free tier and experience the difference yourself.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/register">
              <Button size="lg" className="gap-2">
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="gap-2">
                Talk to Sales
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Browse Other Comparisons */}
      <section className="py-20 border-t">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-12">Other Comparisons</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {comparisonPages
              .filter(c => c.slug !== comparison.slug)
              .map((other) => (
                <Link key={other.slug} href={`/comparisons/${other.slug}`}>
                  <Card className="cursor-pointer hover:border-primary/50 transition-colors h-full">
                    <CardContent className="p-6">
                      <h3 className="text-xl font-bold mb-2">XtraSecurity vs {other.competitorName}</h3>
                      <p className="text-muted-foreground mb-4">{other.shortDescription}</p>
                      <div className="flex items-center gap-2 text-primary">
                        View Comparison <ArrowRight className="w-4 h-4" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
          </div>
        </div>
      </section>
    </div>
  )
}
