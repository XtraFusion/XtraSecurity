"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Terminal } from "lucide-react";
import Link from "next/link";
import { PremiumCodeBlock } from "@/components/docs/PremiumCodeBlock";
import { PremiumCallout } from "@/components/docs/PremiumCallout";

export default function NodeSDKDocs() {
  const installCode = `npm install @xtrasecurity/sdk`;
  const initCode = `import { XtraClient } from '@xtrasecurity/sdk';

// Initialize the client
// It will automatically use process.env.XTRA_TOKEN if available
const client = new XtraClient({
  projectId: 'prj_123456789'
});

// Fetch secrets for production
const secrets = await client.getSecrets('production');
console.log(secrets);`;

  const injectCode = `import { XtraClient } from '@xtrasecurity/sdk';

const client = new XtraClient();

// Instantly inject secrets into process.env
await client.injectSecrets('production', { projectId: 'prj_123456789' });

// Now you can use them normally!
console.log(process.env.DATABASE_URL);`;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <Link href="/docs/sdks" className="inline-block mb-6">
        <Button variant="outline" size="sm" className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to SDKs
        </Button>
      </Link>
      
      <h1 className="text-4xl font-bold mb-4">Node.js SDK</h1>
      <p className="text-xl text-muted-foreground mb-12">
        The official TypeScript/Node.js client for the XtraSecurity API.
      </p>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Terminal className="w-5 h-5" /> Installation
        </h2>
        <PremiumCodeBlock code={installCode} language="bash" />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Initialization</h2>
        <p className="mb-4 text-muted-foreground">
          The SDK provides a wrapper class <code>XtraClient</code> that automatically handles caching and authentication.
        </p>
        <PremiumCodeBlock code={initCode} language="typescript" />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Injecting Secrets</h2>
        <PremiumCallout type="info" title="Pro Tip">
          Use the <code>injectSecrets()</code> method to quickly populate your <code>process.env</code> variables at application startup.
        </PremiumCallout>
        <div className="mt-4">
          <PremiumCodeBlock code={injectCode} language="typescript" />
        </div>
      </section>
    </div>
  );
}
