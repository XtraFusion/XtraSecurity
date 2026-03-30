import type { Metadata } from "next"
import { getBlogPost, getLatestPosts, blogPosts } from "@/lib/blog-data"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight, Calendar, User, Clock, Share2 } from "lucide-react"
import ReactMarkdown from "react-markdown"

interface Props {
  params: {
    slug: string
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = getBlogPost(params.slug)
  
  if (!post) {
    return {
      title: "Blog Post Not Found",
    }
  }

  return {
    title: post.title,
    description: post.description,
    keywords: post.keywords,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      url: `https://xtrasecurity.in/blog/${post.slug}`,
      publishedTime: post.date,
      authors: [post.author],
    },
    alternates: {
      canonical: post.canonical || `https://xtrasecurity.in/blog/${post.slug}`,
    },
    article: {
      publishedTime: post.date,
      authors: [post.author],
    },
  }
}

export function generateStaticParams() {
  return blogPosts.map((post) => ({
    slug: post.slug,
  }))
}

export default function BlogPostPage({ params }: Props) {
  const post = getBlogPost(params.slug)
  
  if (!post) {
    notFound()
  }

  const relatedPosts = getLatestPosts(3).filter(p => p.slug !== post.slug)
  const prevPost = blogPosts[blogPosts.findIndex(p => p.slug === post.slug) - 1]
  const nextPost = blogPosts[blogPosts.findIndex(p => p.slug === post.slug) + 1]

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <div className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/blog" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </Link>
        </div>
      </div>

      {/* Article Header */}
      <article>
        <header className="py-12 border-b">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 mb-6">
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                {post.category}
              </Badge>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-black dark:text-white">
              {post.title}
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8">
              {post.description}
            </p>

            <div className="flex flex-wrap items-center gap-6 text-muted-foreground">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5" />
                <span>{post.author}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <span>{new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span>{post.readTime} min read</span>
              </div>
            </div>

            {/* Keywords */}
            <div className="mt-8 pt-8 border-t">
              <div className="text-sm text-muted-foreground mb-3">Keywords:</div>
              <div className="flex flex-wrap gap-2">
                {post.keywords.map((keyword) => (
                  <span key={keyword} className="px-3 py-1 bg-primary/5 text-primary text-sm rounded-full border border-primary/20">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </header>

        {/* Article Content */}
        <div className="py-12 border-b">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
                  table: ({ ...props }) => (
                    <table className="w-full border-collapse border border-primary/20 mb-4" {...props} />
                  ),
                  th: ({ ...props }) => (
                    <th className="border border-primary/20 bg-primary/5 p-2 text-left" {...props} />
                  ),
                  td: ({ ...props }) => (
                    <td className="border border-primary/20 p-2" {...props} />
                  ),
                }}
              >
                {post.content}
              </ReactMarkdown>
            </div>
          </div>
        </div>

        {/* Author Bio */}
        <div className="py-12 border-b bg-primary/5">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h3 className="text-xl font-bold mb-4">About the Author</h3>
            <Card>
              <CardContent className="p-6">
                <p className="text-lg text-muted-foreground">
                  <strong>{post.author}</strong> is a security engineer with expertise in DevOps, cloud infrastructure, and secrets management. 
                  He has helped enterprise teams secure their infrastructure on AWS, Google Cloud, and Azure.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </article>

      {/* Navigation */}
      <div className="py-12 border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {prevPost ? (
              <Link href={`/blog/${prevPost.slug}`}>
                <Card className="cursor-pointer hover:border-primary/50 transition-colors h-full">
                  <CardContent className="p-6">
                    <div className="text-sm text-muted-foreground mb-2">← Previous</div>
                    <h4 className="font-bold text-lg">{prevPost.title}</h4>
                  </CardContent>
                </Card>
              </Link>
            ) : null}
            {nextPost ? (
              <Link href={`/blog/${nextPost.slug}`}>
                <Card className="cursor-pointer hover:border-primary/50 transition-colors h-full">
                  <CardContent className="p-6">
                    <div className="text-sm text-muted-foreground mb-2 text-right">Next →</div>
                    <h4 className="font-bold text-lg text-right">{nextPost.title}</h4>
                  </CardContent>
                </Card>
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      {/* Related Posts */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-12">Related Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {relatedPosts.map((relatedPost) => (
              <Link key={relatedPost.slug} href={`/blog/${relatedPost.slug}`}>
                <Card className="cursor-pointer h-full hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 w-fit">
                      {relatedPost.category}
                    </Badge>
                    <CardTitle className="text-lg mt-2">{relatedPost.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">{relatedPost.description}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{new Date(relatedPost.date).toLocaleDateString()}</span>
                      <span>{relatedPost.readTime} min</span>
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
