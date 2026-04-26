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

export default function PythonSDKDocs() {
  const installCode = `pip install xtrasecurity-sdk`;
  const initCode = `from xtrasecurity import XtraClient, XtraClientOptions

# Initialize the client
# It will automatically use os.environ.get('XTRA_TOKEN') if available
client = XtraClient(XtraClientOptions(
    project_id="prj_123456789",
    cache_ttl=60 # Cache secrets in-memory for 60 seconds
))`;

  const getSecretsCode = `# Fetch from production (main branch)
secrets = client.get_secrets("production")
print(secrets.get("DATABASE_URL"))

# Fetch from a specific branch and bypass cache
preview_secrets = client.get_secrets(
    env="staging", 
    branch="feature/new-ui", 
    no_cache=True
)`;

  const injectCode = `from xtrasecurity import XtraClient
import os

client = XtraClient()

# Instantly inject secrets into os.environ
client.inject_secrets("production", project_id="prj_123456789", branch="feature/new-ui", override=True)

# Now you can use them normally across your application
print(os.environ.get("DATABASE_URL"))`;

  const advancedCode = `from xtrasecurity import XtraClient
from xtrasecurity.exceptions import XtraError

client = XtraClient()

try:
    # Access the raw auto-generated API classes for advanced management
    project_info = client.projects.get_project("prj_123456789")
    
    # Create an environment branch programmatically
    client.branches.create_branch("prj_123456789", name="hotfix/api-v2", base_env="production")
    
except XtraError as e:
    print(f"XtraSecurity Error: {e.message}")`;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 pb-32">
      <Link href="/docs/sdks" className="inline-block mb-6">
        <Button variant="outline" size="sm" className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to SDKs
        </Button>
      </Link>
      
      <div className="space-y-4 mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#3776AB]/10 border border-[#3776AB]/20 text-[11px] font-semibold tracking-tight text-[#3776AB]">
            <BookOpen className="h-3.5 w-3.5" />
            API Reference
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">Python SDK</h1>
        <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
          The official Python client for the XtraSecurity API. Built with native caching, type hints, and Zero-Trust injection.
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
          The SDK provides a primary wrapper class, <code>XtraClient</code>. It accepts an <code>XtraClientOptions</code> object during instantiation.
        </p>
        <PremiumCodeBlock options={[{ language: "python", code: initCode }]} />
        
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
                <TableCell className="font-mono text-primary font-medium">token</TableCell>
                <TableCell><code className="text-xs bg-muted px-1 rounded">str</code></TableCell>
                <TableCell><code className="text-xs bg-muted px-1 rounded">os.environ['XTRA_TOKEN']</code></TableCell>
                <TableCell className="text-muted-foreground">The API Token used for authentication.</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-primary font-medium">project_id</TableCell>
                <TableCell><code className="text-xs bg-muted px-1 rounded">str</code></TableCell>
                <TableCell><code className="text-xs bg-muted px-1 rounded">os.environ['XTRA_PROJECT_ID']</code></TableCell>
                <TableCell className="text-muted-foreground">The default project ID for all secret operations.</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-primary font-medium">api_url</TableCell>
                <TableCell><code className="text-xs bg-muted px-1 rounded">str</code></TableCell>
                <TableCell><code className="text-xs bg-muted px-1 rounded">https://www.xtrasecurity.in/api</code></TableCell>
                <TableCell className="text-muted-foreground">Override the base URL for self-hosted Enterprise instances.</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-primary font-medium">cache</TableCell>
                <TableCell><code className="text-xs bg-muted px-1 rounded">bool</code></TableCell>
                <TableCell><code className="text-xs bg-muted px-1 rounded">True</code></TableCell>
                <TableCell className="text-muted-foreground">Enables in-memory caching to prevent rate-limiting.</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-primary font-medium">cache_ttl</TableCell>
                <TableCell><code className="text-xs bg-muted px-1 rounded">int</code></TableCell>
                <TableCell><code className="text-xs bg-muted px-1 rounded">30</code></TableCell>
                <TableCell className="text-muted-foreground">Time-to-live for cached secrets in seconds.</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </section>

      {/* Core Methods: getSecrets */}
      <section className="mb-16 scroll-mt-20" id="get-secrets">
        <h2 className="text-2xl font-bold mb-5 flex items-center gap-2 text-foreground border-b pb-2">
          <Key className="w-5 h-5 text-primary" /> Core Methods
        </h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold font-mono text-foreground mb-2">get_secrets()</h3>
            <p className="text-muted-foreground mb-4">
              Fetches all secrets for a specific environment and branch, returning a standard dictionary. This method automatically utilizes the in-memory cache if enabled.
            </p>
            <PremiumCodeBlock options={[{ language: "python", code: getSecretsCode }]} />
            
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
                    <TableCell><code className="text-xs bg-muted px-1 rounded">str</code></TableCell>
                    <TableCell className="text-muted-foreground">Required. The target environment (e.g. 'production').</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-primary font-medium">project_id</TableCell>
                    <TableCell><code className="text-xs bg-muted px-1 rounded">str</code></TableCell>
                    <TableCell className="text-muted-foreground">Optional override for the default project_id.</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-primary font-medium">branch</TableCell>
                    <TableCell><code className="text-xs bg-muted px-1 rounded">str</code></TableCell>
                    <TableCell className="text-muted-foreground">Optional. Target a specific environment branch (defaults to 'main').</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-primary font-medium">no_cache</TableCell>
                    <TableCell><code className="text-xs bg-muted px-1 rounded">bool</code></TableCell>
                    <TableCell className="text-muted-foreground">Optional. If True, forces a network request bypassing the in-memory cache.</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </section>

      {/* Core Methods: inject_secrets */}
      <section className="mb-16 scroll-mt-20" id="inject-secrets">
        <h3 className="text-lg font-bold font-mono text-foreground mb-2">inject_secrets()</h3>
        <p className="text-muted-foreground mb-4">
          A convenience method that fetches secrets and immediately populates <code>os.environ</code>. This is the recommended approach for standard Python web applications like Flask or Django.
        </p>
        <div className="mt-4">
          <PremiumCodeBlock options={[{ language: "python", code: injectCode }]} />
        </div>
      </section>

      {/* Core Methods: clear_cache */}
      <section className="mb-16 scroll-mt-20" id="clear-cache">
        <h3 className="text-lg font-bold font-mono text-foreground mb-2">clear_cache()</h3>
        <p className="text-muted-foreground mb-4">
          Manually flushes the in-memory secret cache.
        </p>
        <PremiumCodeBlock options={[{ language: "python", code: "client.clear_cache()" }]} />
      </section>

      {/* Advanced Usage */}
      <section className="mb-16 scroll-mt-20" id="advanced">
        <h2 className="text-2xl font-bold mb-5 flex items-center gap-2 text-foreground border-b pb-2">
          <Link2 className="w-5 h-5 text-primary" /> Advanced API Access
        </h2>
        <p className="mb-4 text-muted-foreground leading-relaxed">
          For power users building custom internal tools, <code>XtraClient</code> exposes the raw auto-generated service classes.
        </p>
        <PremiumCodeBlock options={[{ language: "python", code: advancedCode }]} />
      </section>

      {/* Error Handling */}
      <section className="mb-12 scroll-mt-20" id="errors">
        <h2 className="text-2xl font-bold mb-5 flex items-center gap-2 text-foreground border-b pb-2">
          <Zap className="w-5 h-5 text-primary" /> Error Handling
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          All internal SDK errors are thrown as instances of the <code>XtraError</code> exception class.
        </p>
      </section>
    </div>
  );
}
