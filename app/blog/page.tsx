"use client";

import { blogPosts, getFeaturedPosts, getLatestPosts } from "@/lib/blog-data";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Calendar, User, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BlogPage() {
  const featured = getFeaturedPosts();
  const all = getLatestPosts();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 border-b">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-6">
              <span className="w-2 h-2 bg-success rounded-full animate-pulse"></span>
              <span className="text-sm font-medium text-primary">DevOps Security Blog</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-black dark:text-white">
              Secrets Management & DevOps<br />
              <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                Security Tutorials
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Learn API key security, Kubernetes secrets management, CI/CD best practices, and how to prevent credential leaks.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Posts */}
      <section className="py-20 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-12">Featured Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featured.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`}>
                <Card className="cursor-pointer h-full hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-4">
                      <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                        {post.category}
                      </Badge>
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        {post.readTime} min
                      </span>
                    </div>
                    <CardTitle className="text-xl">{post.title}</CardTitle>
                    <CardDescription className="text-base">{post.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {post.author}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(post.date).toLocaleDateString()}
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* All Articles */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-12">All Articles</h2>
          <div className="space-y-6">
            {all.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`}>
                <Card className="cursor-pointer hover:border-primary/50 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-xs">
                            {post.category}
                          </Badge>
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(post.date).toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold mb-2">{post.title}</h3>
                        <p className="text-muted-foreground mb-4">{post.description}</p>
                        <div className="flex flex-wrap gap-2">
                          {post.keywords.slice(0, 3).map((keyword) => (
                            <span key={keyword} className="text-xs px-2 py-1 bg-primary/5 text-primary rounded border border-primary/20">
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {post.readTime} min
                        </span>
                        <ArrowRight className="w-5 h-5 flex-shrink-0" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 border-t bg-gradient-to-r from-primary/5 to-primary/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Stay Updated on Secrets Management</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Get weekly tutorials on API key security, DevOps best practices, and secrets management.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/contact">
              <Button size="lg" className="gap-2">
                Subscribe to Blog
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
