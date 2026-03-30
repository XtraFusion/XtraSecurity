"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Linkedin, Github, Mail, Award, Zap, Shield } from "lucide-react";
import Link from "next/link";

export default function AboutPage() {
  const teamMembers = [
    {
      name: "OM Salunke",
      title: "Founder & CEO",
      image: "🚀",
      bio: "Security engineer with 1+ years of experience building enterprise security solutions at AWS and Google. Led infrastructure security teams managing secrets for 100+ Fortune 500 companies.",
      expertise: ["AWS", "DevOps Security", "Encryption", "Key Management", "Zero Trust Architecture"],
      linkedin: "https://linkedin.com/in/om-salunke",
      email: "omsalunke.contact@gmail.com"
    },
   
  ];

  const milestones = [
    { year: "2025", title: "XtraSecurity Founded", desc: "Started with a mission to solve secrets management for modern teams" },
    { year: "2026", title: "Enterprise Ready", desc: "Launched compliance certifications and penetration testing reports" },
    { year: "2027", title: "Global Scale", desc: "Multi-region deployment with 99.99% uptime SLA" }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 border-b">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-6">
              <span className="w-2 h-2 bg-success rounded-full animate-pulse"></span>
              <span className="text-sm font-medium text-primary">About XtraSecurity</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-black dark:text-white">
              Built by Security Experts<br />
              <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                For Modern Teams
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              We're security engineers who've worked at AWS, Google, and Azure. We built XtraSecurity to solve the secrets management problems we faced at scale.
            </p>
          </div>
        </div>
      </section>

      {/* Founder Section */}
      <section className="py-20 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Meet Our Founder</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              XtraSecurity was founded by a seasoned security architect with deep experience in enterprise infrastructure
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <Card className="border hover:border-primary/50 transition-colors">
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
                  <div className="text-6xl">{teamMembers[0].image}</div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-1">{teamMembers[0].name}</h3>
                    <p className="text-primary font-semibold mb-4">{teamMembers[0].title}</p>
                    <p className="text-muted-foreground mb-6 leading-relaxed">
                      {teamMembers[0].bio}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-6">
                      {teamMembers[0].expertise.map((skill) => (
                        <Badge key={skill} variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-4">
                      <a href={teamMembers[0].linkedin} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" className="gap-2">
                          <Linkedin className="w-4 h-4" />
                          LinkedIn
                        </Button>
                      </a>
                      <a href={`mailto:${teamMembers[0].email}`}>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Mail className="w-4 h-4" />
                          Email
                        </Button>
                      </a>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Core Team */}
      <section className="py-20 border-b bg-gradient-to-b from-primary/5 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">World-Class Security Team</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Assembled from AWS, Google Cloud, and Azure—with combined expertise across DevOps, cryptography, and enterprise security
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: "AWS Security Engineers",
                desc: "Built and maintained AWS infrastructure protecting Fortune 500 companies"
              },
              {
                icon: Zap,
                title: "Google Cloud Experts",
                desc: "Architected cloud-native security systems at scale for billions of users"
              },
              {
                icon: Award,
                title: "Security Researchers",
                desc: "Published papers on encryption, key rotation, and zero-trust architecture"
              }
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <Card key={idx} className="border-primary/20 hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <Icon className="w-10 h-10 text-primary mb-4" />
                    <CardTitle className="text-xl">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why We Built This */}
      <section className="py-20 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Why We Built XtraSecurity</h2>
              <p className="text-lg text-muted-foreground mb-6">
                After years managing secrets at AWS and Google, we saw the same problems everywhere:
              </p>
              <ul className="space-y-4">
                {[
                  "Teams manually managing 1000s of secrets across environments with spreadsheets",
                  "Rotating credentials took weeks—now it takes seconds",
                  "Audit logs existed but weren't accessible to teams that needed them",
                  "Compliance audits were nightmare—weeks of manual documentation",
                  "DevOps teams had no visibility into who accessed what secret and when"
                ].map((item, idx) => (
                  <li key={idx} className="flex gap-3">
                    <span className="text-primary font-bold text-xl mt-1">✓</span>
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-gradient-card border border-primary/20 rounded-lg p-8">
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-primary font-semibold mb-2">OUR SOLUTION</p>
                  <h3 className="text-2xl font-bold mb-2">One Platform for All Secrets</h3>
                  <p className="text-muted-foreground">
                    Born from real challenges at scale, XtraSecurity simplifies secrets management for every team size.
                  </p>
                </div>
                <div className="pt-4 border-t border-primary/20">
                  <p className="text-sm text-muted-foreground mb-4">
                    Used by developers and DevOps teams managing infrastructure at:
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {["Startups", "Scale-ups", "Enterprises"].map((item) => (
                      <Badge key={item} variant="outline" className="bg-primary/5">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 border-b bg-gradient-to-b from-primary/5 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Journey</h2>
            <p className="text-muted-foreground text-lg">From solving our own problems to building a platform for the world</p>
          </div>

          <div className="max-w-3xl mx-auto">
            {milestones.map((milestone, idx) => (
              <div key={idx} className="flex gap-8 mb-12 last:mb-0">
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-primary to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {milestone.year}
                  </div>
                  {idx < milestones.length - 1 && (
                    <div className="w-1 h-20 bg-primary/20 mt-4" />
                  )}
                </div>
                <div className="pt-4 pb-8">
                  <h3 className="text-xl font-bold mb-2">{milestone.title}</h3>
                  <p className="text-muted-foreground">{milestone.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Core Values</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { title: "Security First", desc: "Every decision is evaluated for security impact first" },
              { title: "Developer Friendly", desc: "If it's not easy to use, we make it easier" },
              { title: "Transparency", desc: "You should know exactly what happens to your secrets" },
              { title: "Trust", desc: "We've been trusted with critical infrastructure—it's sacred to us" }
            ].map((value, idx) => (
              <Card key={idx} className="border-primary/20 hover:border-primary/50 transition-colors text-center">
                <CardHeader>
                  <CardTitle className="text-lg">{value.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">{value.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Join Teams Using XtraSecurity</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Trusted by developers and DevOps teams managing critical infrastructure
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="gap-2 text-base">
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="gap-2 text-base">
                Schedule Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
