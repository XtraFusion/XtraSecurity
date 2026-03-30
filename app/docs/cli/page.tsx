"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function CLIPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <Link href="/docs" className="inline-block mb-6">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Docs
          </Button>
        </Link>
        
        <h1 className="text-5xl font-bold mb-6">CLI Reference</h1>
        <p className="text-xl text-muted-foreground mb-12">
          Complete reference for all XtraSecurity CLI commands
        </p>
        
        <div className="bg-muted/50 border border-muted rounded-lg p-8 text-center">
          <p className="text-muted-foreground mb-4">The comprehensive CLI reference is available here:</p>
          <Link href="/docs">
            <Button className="gap-2">
              View Original CLI Documentation
            </Button>
          </Link>
          <p className="text-sm text-muted-foreground mt-4">
            This page contains the full list of CLI commands, options, and examples.
          </p>
        </div>
      </div>
    </div>
  );
}
