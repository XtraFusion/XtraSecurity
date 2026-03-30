import type { Metadata } from "next"
import { getIntegrationPage, integrationPages } from "@/lib/integrations-data"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight, Clock, Zap } from "lucide-react"
import ReactMarkdown from "react-markdown"

interface Props {
  params: {
    slug: string
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const integration = getIntegrationPage(params.slug)
  
  if (!integration) {
    return {
      title: "Integration Not Found",
    }
  }

  return {
    title: integration.title,
    description: integration.description,
    keywords: integration.keywords,
    openGraph: {
      title: integration.title,
      description: integration.description,
      type: "website",
      url: `https://xtrasecurity.in/setup/${integration.slug}`,
    },
    alternates: {
      canonical: `https://xtrasecurity.in/setup/${integration.slug}`,
    },
  }
}

export function generateStaticParams() {
  return integrationPages.map((integration) => ({
    slug: integration.slug,
  }))
}

export default function SetupGuidePage({ params }: Props) {
  const integration = getIntegrationPage(params.slug)
  
  if (!integration) {
    notFound()
  }

  const relatedIntegrations = integrationPages
    .filter(i => i.slug !== integration.slug)
    .slice(0, 3)

  const difficulty = {
    Easy: 'bg-green-500/10 text-green-700 border-green-200 dark:text-green-400',
    Medium: 'bg-yellow-500/10 text-yellow-700 border-yellow-200 dark:text-yellow-400',
    Advanced: 'bg-red-500/10 text-red-700 border-red-200 dark:text-red-400',
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <div className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/setup" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Setup Guides
          </Link>
        </div>
      </div>

      {/* Header */}
      <header className="py-12 border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-start gap-6 mb-6">
            <span className="text-6xl">{integration.icon}</span>
            <div>
              <Badge className={difficulty[integration.difficulty as keyof typeof difficulty]} className="mb-4">
                {integration.difficulty}
              </Badge>
              <h1 className="text-5xl md:text-6xl font-bold mb-4 text-black dark:text-white">
                {integration.service}
              </h1>
            </div>
          </div>
          
          <p className="text-xl text-muted-foreground mb-8">
            {integration.description}
          </p>

          <div className="flex gap-6 mb-8 flex-wrap">
            <div className="flex items-center gap-2 text-lg">
              <Clock className="w-5 h-5 text-primary" />
              <span>Setup Time: {integration.setupTime}</span>
            </div>
            <div className="flex items-center gap-2 text-lg">
              <Zap className="w-5 h-5 text-primary" />
              <span>Difficulty: {integration.difficulty}</span>
            </div>
          </div>

          <div className="flex gap-4 flex-wrap">
            <Link href="/register">
              <Button size="lg" className="gap-2">
                Start Free Trial
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
      </header>

      {/* Content */}
      <div className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-invert max-w-none dark:prose-dark">
            <ReactMarkdown
              components={{
                h1: ({ ...props }) => <h1 className="text-4xl font-bold mt-8 mb-4" {...props} />,
                h2: ({ ...props }) => <h2 className="text-3xl font-bold mt-8 mb-4" {...props} />,
                h3: ({ ...props }) => <h3 className="text-2xl font-bold mt-6 mb-3" {...props} />,
                p: ({ ...props }) => <p className="text-lg leading-relaxed mb-4" {...props} />,
                ul: ({ ...props }) => <ul className="list-disc list-inside mb-4 space-y-2" {...props} />,
                ol: ({ ...props }) => <ol className="list-decimal list-inside mb-4 space-y-2" {...props} />,
                li: ({ ...props }) => <li className="text-base" {...props} />,
                code: ({ ...props }) => (
                  <code className="bg-primary/10 text-primary px-2 py-1 rounded text-sm" {...props} />
                ),
                pre: ({ ...props }) => (
                  <pre className="bg-secondary p-4 rounded-lg overflow-x-auto mb-4" {...props} />
                ),
                a: ({ ...props }) => (
                  <a className="text-primary hover:text-primary/80 underline" {...props} />
                ),
                blockquote: ({ ...props }) => (
                  <blockquote className="border-l-4 border-primary/30 pl-4 italic text-muted-foreground mb-4" {...props} />
                ),
              }}
            >
              {integration.content}
            </ReactMarkdown>
          </div>
        </div>
      </div>

      {/* Related Guides */}
      <section className="py-20 border-t bg-primary/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-12">More Setup Guides</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {relatedIntegrations.map((related) => (
              <Link key={related.slug} href={`/setup/${related.slug}`}>
                <Card className="cursor-pointer h-full hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <div className="text-4xl mb-4">{related.icon}</div>
                    <CardTitle>{related.service}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">{related.description}</p>
                    <div className="text-sm text-muted-foreground">
                      <div>{related.setupTime}</div>
                      <div>{related.difficulty}</div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-primary/5 to-primary/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Need More Help?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Check our full documentation or contact our support team for assistance.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/docs">
              <Button size="lg" variant="outline" className="gap-2">
                View Documentation
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" className="gap-2">
                Contact Support
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
