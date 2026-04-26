"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Terminal } from "lucide-react";
import Link from "next/link";
import { PremiumCodeBlock } from "@/components/docs/PremiumCodeBlock";

export default function GoSDKDocs() {
  const installCode = `go get github.com/xtrasecurity/xtra-go-sdk`;
  const initCode = `package main

import (
	"context"
	"fmt"
	"os"

	xtra "github.com/xtrasecurity/xtra-go-sdk"
)

func main() {
	// Configure the client
	cfg := xtra.NewConfiguration()
	cfg.AddDefaultHeader("Authorization", "Bearer "+os.Getenv("XTRA_TOKEN"))
	
	client := xtra.NewAPIClient(cfg)

	// Fetch secrets
	secrets, _, err := client.SecretsApi.GetSecrets(context.Background(), "prj_123456789", "production", nil)
	if err != nil {
		fmt.Printf("Error fetching secrets: %v\\n", err)
		return
	}

	fmt.Printf("Secrets: %v\\n", secrets)
}`;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <Link href="/docs/sdks" className="inline-block mb-6">
        <Button variant="outline" size="sm" className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to SDKs
        </Button>
      </Link>
      
      <h1 className="text-4xl font-bold mb-4">Go SDK</h1>
      <p className="text-xl text-muted-foreground mb-12">
        The official Go module for integrating XtraSecurity into your backend services.
      </p>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Terminal className="w-5 h-5" /> Installation
        </h2>
        <PremiumCodeBlock code={installCode} language="bash" />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Basic Usage</h2>
        <PremiumCodeBlock code={initCode} language="go" />
      </section>
    </div>
  );
}
