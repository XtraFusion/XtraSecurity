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

export default function NodeSDKDocs() {
  const installCode = `npm install @xtrasecurity/sdk`;
  const initCode = `import { XtraClient } from '@xtrasecurity/sdk';

// Initialize the client
const client = new XtraClient({
  projectId: 'prj_123456789',
  cacheTtl: 60000 // Cache secrets in-memory for 60 seconds
});`;

  const getSecretsCode = `// Fetch from production (main branch)
const secrets = await client.getSecrets('production');
console.log(secrets.DATABASE_URL);

// Fetch from a specific branch and bypass cache
const previewSecrets = await client.getSecrets('staging', undefined, 'feature/new-ui', true);`;

  const injectCode = `import { XtraClient } from '@xtrasecurity/sdk';

const client = new XtraClient();

// Instantly inject secrets into process.env
await client.injectSecrets('production', { 
  projectId: 'prj_123456789',
  branch: 'feature/new-ui',
  override: true // Overwrite existing local environment variables
});

// Now you can use them normally across your application
console.log(process.env.DATABASE_URL);`;

  const advancedCode = `import { XtraClient, XtraError } from '@xtrasecurity/sdk';

const client = new XtraClient();

try {
  // Access the raw auto-generated API classes for advanced management
  const projectInfo = await client.projects.getProject('prj_123456789');
  
  // Create an environment branch programmatically
  await client.branches.createBranch('prj_123456789', {
    name: 'hotfix/api-v2',
    baseEnv: 'production'
  });
} catch (error) {
  if (error instanceof XtraError) {
    console.error("XtraSecurity Error:", error.message);
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
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10 text-[11px] font-semibold tracking-tight text-primary">
            <BookOpen className="h-3.5 w-3.5" />
            API Reference
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">Node.js SDK</h1>
        <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
          The official TypeScript/Node.js client for the XtraSecurity API. Built with native caching, TypeScript definitions, and Zero-Trust injection.
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
        <PremiumCodeBlock options={[{ language: "typescript", code: initCode }]} />
        
        <div className="mt-8 rounded-lg border bg-card overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[150px]">Option</TableHead>
                <TableHead className="w-[120px]">Type</TableHead>
                <TableHead className="w-[120px]">Default</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-sm">
              <TableRow>
                <TableCell className="font-mono text-primary font-medium">token</TableCell>
                <TableCell><code className="text-xs bg-muted px-1 rounded">string</code></TableCell>
                <TableCell><code className="text-xs bg-muted px-1 rounded">process.env.XTRA_TOKEN</code></TableCell>
                <TableCell className="text-muted-foreground">The API Token used for authentication.</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-primary font-medium">projectId</TableCell>
                <TableCell><code className="text-xs bg-muted px-1 rounded">string</code></TableCell>
                <TableCell><code className="text-xs bg-muted px-1 rounded">process.env.XTRA_PROJECT_ID</code></TableCell>
                <TableCell className="text-muted-foreground">The default project ID for all secret operations.</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-primary font-medium">apiUrl</TableCell>
                <TableCell><code className="text-xs bg-muted px-1 rounded">string</code></TableCell>
                <TableCell><code className="text-xs bg-muted px-1 rounded">https://www.xtrasecurity.in/api</code></TableCell>
                <TableCell className="text-muted-foreground">Override the base URL for self-hosted Enterprise instances.</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-primary font-medium">cache</TableCell>
                <TableCell><code className="text-xs bg-muted px-1 rounded">boolean</code></TableCell>
                <TableCell><code className="text-xs bg-muted px-1 rounded">true</code></TableCell>
                <TableCell className="text-muted-foreground">Enables in-memory caching to prevent rate-limiting on high-traffic apps.</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-primary font-medium">cacheTtl</TableCell>
                <TableCell><code className="text-xs bg-muted px-1 rounded">number</code></TableCell>
                <TableCell><code className="text-xs bg-muted px-1 rounded">30000</code></TableCell>
                <TableCell className="text-muted-foreground">Time-to-live for cached secrets in milliseconds (default: 30 seconds).</TableCell>
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
            <h3 className="text-lg font-bold font-mono text-foreground mb-2">getSecrets()</h3>
            <p className="text-muted-foreground mb-4">
              Fetches all secrets for a specific environment and branch, returning a standard key-value dictionary. This method automatically utilizes the in-memory cache if enabled.
            </p>
            <PremiumCodeBlock options={[{ language: "typescript", code: getSecretsCode }]} />
            
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
                    <TableCell><code className="text-xs bg-muted px-1 rounded">'development' | 'staging' | 'production'</code></TableCell>
                    <TableCell className="text-muted-foreground">Required. The target environment.</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-primary font-medium">projectId?</TableCell>
                    <TableCell><code className="text-xs bg-muted px-1 rounded">string</code></TableCell>
                    <TableCell className="text-muted-foreground">Optional override for the default projectId.</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-primary font-medium">branch?</TableCell>
                    <TableCell><code className="text-xs bg-muted px-1 rounded">string</code></TableCell>
                    <TableCell className="text-muted-foreground">Optional. Target a specific environment branch (defaults to 'main').</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-primary font-medium">noCache?</TableCell>
                    <TableCell><code className="text-xs bg-muted px-1 rounded">boolean</code></TableCell>
                    <TableCell className="text-muted-foreground">Optional. If true, forces a network request bypassing the in-memory cache.</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </section>

      {/* Core Methods: injectSecrets */}
      <section className="mb-16 scroll-mt-20" id="inject-secrets">
        <h3 className="text-lg font-bold font-mono text-foreground mb-2">injectSecrets()</h3>
        <p className="text-muted-foreground mb-4">
          A convenience method that fetches secrets and immediately populates <code>process.env</code>. This is the recommended approach for serverless functions and Express backends.
        </p>
        <PremiumCallout type="info" title="Pro Tip">
          Call this method as early as possible in your application lifecycle (e.g., at the top of your <code>index.ts</code>).
        </PremiumCallout>
        <div className="mt-4">
          <PremiumCodeBlock options={[{ language: "typescript", code: injectCode }]} />
        </div>
      </section>

      {/* Core Methods: clearCache */}
      <section className="mb-16 scroll-mt-20" id="clear-cache">
        <h3 className="text-lg font-bold font-mono text-foreground mb-2">clearCache()</h3>
        <p className="text-muted-foreground mb-4">
          Manually flushes the in-memory secret cache. Useful when responding to webhook events notifying you of secret changes.
        </p>
        <PremiumCodeBlock options={[{ language: "typescript", code: "client.clearCache();" }]} />
      </section>

      {/* Advanced Usage */}
      <section className="mb-16 scroll-mt-20" id="advanced">
        <h2 className="text-2xl font-bold mb-5 flex items-center gap-2 text-foreground border-b pb-2">
          <Link2 className="w-5 h-5 text-primary" /> Advanced API Access
        </h2>
        <p className="mb-4 text-muted-foreground leading-relaxed">
          For power users building custom internal tools, <code>XtraClient</code> exposes the raw auto-generated service classes. You have full programmatic access to Projects, Teams, Audits, Branches, and Notifications.
        </p>
        <PremiumCodeBlock options={[{ language: "typescript", code: advancedCode }]} />
      </section>

      {/* Error Handling */}
      <section className="mb-12 scroll-mt-20" id="errors">
        <h2 className="text-2xl font-bold mb-5 flex items-center gap-2 text-foreground border-b pb-2">
          <Zap className="w-5 h-5 text-primary" /> Error Handling
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          All internal SDK errors are thrown as instances of the <code>XtraError</code> class. Network or HTTP errors from the underlying API will throw standard Axios errors containing status codes and response data.
        </p>
      </section>
    </div>
  );
}
