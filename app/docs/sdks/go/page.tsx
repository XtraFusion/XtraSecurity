"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Terminal, Settings, Zap, BookOpen, Key, Link2 } from "lucide-react";
import Link from "next/link";
import { PremiumCodeBlock } from "@/components/docs/PremiumCodeBlock";
import { PremiumCallout } from "@/components/docs/PremiumCallout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function GoSDKDocs() {
  const installCode = `go get github.com/xtrasecurity/xtra-sdk-go`;
  const initCode = `import (
    "time"
    "github.com/xtrasecurity/xtra-sdk-go/xtra"
)

// Initialize the client
// It will automatically use os.Getenv("XTRA_TOKEN") if available
client, err := xtra.NewClient(xtra.ClientOptions{
    ProjectID: "prj_123456789",
    CacheTTL:  60 * time.Second, // Cache secrets in-memory for 60 seconds
})
if err != nil {
    panic(err)
}`;

  const getSecretsCode = `// Fetch from production (main branch)
secrets, err := client.GetSecrets("production", nil)
if err != nil {
    panic(err)
}
fmt.Println(secrets["DATABASE_URL"])

// Fetch from a specific branch and bypass cache
opts := &xtra.SecretOptions{
    Branch:  "feature/new-ui",
    NoCache: true,
}
previewSecrets, err := client.GetSecrets("staging", opts)`;

  const injectCode = `import "github.com/xtrasecurity/xtra-sdk-go/xtra"

client, _ := xtra.NewClient(xtra.ClientOptions{})

// Instantly inject secrets into os.Environ
err := client.InjectSecrets("production", &xtra.SecretOptions{
    ProjectID: "prj_123456789",
    Branch:    "feature/new-ui",
    Override:  true, // Overwrite existing local environment variables
})

// Now you can use them normally across your application
dbUrl := os.Getenv("DATABASE_URL")`;

  const advancedCode = `import (
    "context"
    "github.com/xtrasecurity/xtra-sdk-go/xtra"
)

client, _ := xtra.NewClient(xtra.ClientOptions{})

// Access the raw auto-generated API classes for advanced management
project, resp, err := client.Projects.GetProject(context.Background(), "prj_123456789")

if err != nil {
    if xtraErr, ok := err.(*xtra.Error); ok {
        fmt.Printf("XtraSecurity API Error: %s\\n", xtraErr.Message)
    }
}`;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 pb-32">
      <Link href="/docs/sdks" className="inline-block mb-6">
        <Button variant="outline" size="sm" className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to SDKs
        </Button>
      </Link>
      
      <div className="space-y-4 mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00ADD8]/10 border border-[#00ADD8]/20 text-[11px] font-semibold tracking-tight text-[#00ADD8]">
            <BookOpen className="h-3.5 w-3.5" />
            API Reference
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">Go SDK</h1>
        <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
          The official Go client for the XtraSecurity API. Built with goroutine-safe caching, strict typing, and Zero-Trust injection.
        </p>
      </div>

      {/* Installation */}
      <section className="mb-16 scroll-mt-20" id="installation">
        <h2 className="text-2xl font-bold mb-5 flex items-center gap-2 text-foreground border-b pb-2">
          <Terminal className="w-5 h-5 text-primary" /> Installation
        </h2>
        <PremiumCodeBlock options={[{ language: "bash", code: installCode }]} />
      </section>

      {/* Configuration */}
      <section className="mb-16 scroll-mt-20" id="configuration">
        <h2 className="text-2xl font-bold mb-5 flex items-center gap-2 text-foreground border-b pb-2">
          <Settings className="w-5 h-5 text-primary" /> Configuration
        </h2>
        <p className="mb-5 text-muted-foreground leading-relaxed">
          The SDK provides a primary struct, <code>Client</code>. It accepts a <code>ClientOptions</code> struct during instantiation via <code>NewClient()</code>.
        </p>
        <PremiumCodeBlock options={[{ language: "go", code: initCode }]} />
        
        <div className="mt-8 rounded-lg border bg-card overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[150px]">Option</TableHead>
                <TableHead className="w-[120px]">Type</TableHead>
                <TableHead className="w-[150px]">Default</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-sm">
              <TableRow>
                <TableCell className="font-mono text-primary font-medium">Token</TableCell>
                <TableCell><code className="text-xs bg-muted px-1 rounded">string</code></TableCell>
                <TableCell><code className="text-xs bg-muted px-1 rounded">os.Getenv("XTRA_TOKEN")</code></TableCell>
                <TableCell className="text-muted-foreground">The API Token used for authentication.</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-primary font-medium">ProjectID</TableCell>
                <TableCell><code className="text-xs bg-muted px-1 rounded">string</code></TableCell>
                <TableCell><code className="text-xs bg-muted px-1 rounded">os.Getenv("XTRA_PROJECT_ID")</code></TableCell>
                <TableCell className="text-muted-foreground">The default project ID for all secret operations.</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-primary font-medium">APIUrl</TableCell>
                <TableCell><code className="text-xs bg-muted px-1 rounded">string</code></TableCell>
                <TableCell><code className="text-xs bg-muted px-1 rounded">https://www.xtrasecurity.in/api</code></TableCell>
                <TableCell className="text-muted-foreground">Override the base URL for self-hosted Enterprise instances.</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-primary font-medium">Cache</TableCell>
                <TableCell><code className="text-xs bg-muted px-1 rounded">bool</code></TableCell>
                <TableCell><code className="text-xs bg-muted px-1 rounded">true</code></TableCell>
                <TableCell className="text-muted-foreground">Enables in-memory caching (goroutine-safe).</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-primary font-medium">CacheTTL</TableCell>
                <TableCell><code className="text-xs bg-muted px-1 rounded">time.Duration</code></TableCell>
                <TableCell><code className="text-xs bg-muted px-1 rounded">30 * time.Second</code></TableCell>
                <TableCell className="text-muted-foreground">Time-to-live for cached secrets.</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </section>

      {/* Core Methods: GetSecrets */}
      <section className="mb-16 scroll-mt-20" id="get-secrets">
        <h2 className="text-2xl font-bold mb-5 flex items-center gap-2 text-foreground border-b pb-2">
          <Key className="w-5 h-5 text-primary" /> Core Methods
        </h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold font-mono text-foreground mb-2">GetSecrets()</h3>
            <p className="text-muted-foreground mb-4">
              Fetches all secrets for a specific environment and branch, returning a <code>map[string]string</code>. This method is goroutine-safe and utilizes the RWMutex cache.
            </p>
            <PremiumCodeBlock options={[{ language: "go", code: getSecretsCode }]} />
            
            <div className="mt-6 rounded-lg border bg-card overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-[150px]">Parameter</TableHead>
                    <TableHead className="w-[120px]">Type</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="text-sm">
                  <TableRow>
                    <TableCell className="font-mono text-primary font-medium">env</TableCell>
                    <TableCell><code className="text-xs bg-muted px-1 rounded">string</code></TableCell>
                    <TableCell className="text-muted-foreground">Required. The target environment (e.g. "production").</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-primary font-medium">opts</TableCell>
                    <TableCell><code className="text-xs bg-muted px-1 rounded">*SecretOptions</code></TableCell>
                    <TableCell className="text-muted-foreground">Optional struct containing Branch, ProjectID, and NoCache settings. Pass <code>nil</code> for defaults.</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </section>

      {/* Core Methods: InjectSecrets */}
      <section className="mb-16 scroll-mt-20" id="inject-secrets">
        <h3 className="text-lg font-bold font-mono text-foreground mb-2">InjectSecrets()</h3>
        <p className="text-muted-foreground mb-4">
          A convenience method that fetches secrets and immediately populates <code>os.Environ()</code> using <code>os.Setenv()</code>.
        </p>
        <div className="mt-4">
          <PremiumCodeBlock options={[{ language: "go", code: injectCode }]} />
        </div>
      </section>

      {/* Core Methods: ClearCache */}
      <section className="mb-16 scroll-mt-20" id="clear-cache">
        <h3 className="text-lg font-bold font-mono text-foreground mb-2">ClearCache()</h3>
        <p className="text-muted-foreground mb-4">
          Safely flushes the in-memory secret cache across all goroutines.
        </p>
        <PremiumCodeBlock options={[{ language: "go", code: "client.ClearCache()" }]} />
      </section>

      {/* Advanced Usage */}
      <section className="mb-16 scroll-mt-20" id="advanced">
        <h2 className="text-2xl font-bold mb-5 flex items-center gap-2 text-foreground border-b pb-2">
          <Link2 className="w-5 h-5 text-primary" /> Advanced API Access
        </h2>
        <p className="mb-4 text-muted-foreground leading-relaxed">
          For power users building custom internal tools, <code>Client</code> exposes the raw auto-generated service classes.
        </p>
        <PremiumCodeBlock options={[{ language: "go", code: advancedCode }]} />
      </section>

      {/* Error Handling */}
      <section className="mb-12 scroll-mt-20" id="errors">
        <h2 className="text-2xl font-bold mb-5 flex items-center gap-2 text-foreground border-b pb-2">
          <Zap className="w-5 h-5 text-primary" /> Error Handling
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          The Go SDK uses standard Go error handling. Internal SDK errors can be type-asserted to <code>*xtra.Error</code>.
        </p>
      </section>
    </div>
  );
}
