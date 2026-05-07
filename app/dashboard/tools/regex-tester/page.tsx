"use client";

import React, { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Info, AlertCircle, CheckCircle2, Zap } from 'lucide-react';

export default function RegexTesterPage() {
  const [regex, setRegex] = useState('([a-zA-Z0-9._%-]+)@([a-zA-Z0-9.-]+)\\.([a-zA-Z]{2,6})');
  const [flags, setFlags] = useState('g');
  const [testText, setTestText] = useState('Contact us at support@xtrasecurity.in or sales@example.com');

  const results = useMemo(() => {
    if (!regex) return { matches: [], error: null };
    try {
      const re = new RegExp(regex, flags);
      const matches = Array.from(testText.matchAll(re));
      return { matches, error: null };
    } catch (e: any) {
      return { matches: [], error: e.message };
    }
  }, [regex, flags, testText]);

  return (
    <DashboardLayout>
      <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col gap-2 border-b border-border/40 pb-6">
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Zap className="h-8 w-8 text-yellow-500" />
            Regex Tester
          </h1>
          <p className="text-muted-foreground text-lg">
            Debug and validate your Regular Expressions with real-time highlighting.
          </p>
        </div>

        <Card className="border-border/60 bg-card/50 backdrop-blur-sm overflow-hidden">
          <div className="bg-primary/5 border-b border-border/40 p-4 flex gap-4">
            <div className="flex-1 space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Regular Expression</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono">/</span>
                <Input 
                  value={regex}
                  onChange={(e) => setRegex(e.target.value)}
                  className="pl-5 pr-12 font-mono bg-background border-border/40 focus:border-primary/50"
                  placeholder="pattern"
                />
                <span className="absolute right-10 top-1/2 -translate-y-1/2 text-muted-foreground font-mono">/</span>
                <input 
                  value={flags}
                  onChange={(e) => setFlags(e.target.value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-6 font-mono bg-transparent border-none focus:outline-none text-primary"
                  placeholder="g"
                />
              </div>
            </div>
          </div>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Test String</label>
                <Badge variant={results.error ? "destructive" : "default"} className="h-5 px-2 text-[10px]">
                  {results.error ? "Invalid Regex" : `${results.matches.length} Matches Found`}
                </Badge>
              </div>
              {results.error ? (
                <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {results.error}
                </div>
              ) : (
                <Textarea 
                  value={testText}
                  onChange={(e) => setTestText(e.target.value)}
                  className="min-h-[150px] font-mono text-sm bg-background/50 border-border/40"
                  placeholder="Enter text to test against..."
                />
              )}
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Search className="h-4 w-4 text-primary" />
                Match Results
              </h3>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                {results.matches.length > 0 ? (
                  results.matches.map((match, i) => (
                    <div key={i} className="p-3 rounded-lg border border-border/40 bg-muted/20 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">MATCH {i + 1}</span>
                        <span className="text-[10px] text-muted-foreground">Index: {match.index}</span>
                      </div>
                      <code className="text-sm text-foreground break-all">{match[0]}</code>
                      {match.length > 1 && (
                        <div className="grid grid-cols-1 gap-1 pl-2 border-l-2 border-primary/20">
                          {Array.from(match).slice(1).map((group, gi) => (
                            <div key={gi} className="text-[11px] text-muted-foreground">
                              Group {gi + 1}: <span className="text-foreground font-mono">{group || 'null'}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 border-2 border-dashed border-border/40 rounded-xl bg-muted/5">
                    <Info className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No matches found with the current pattern.</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
