"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Terminal } from "lucide-react";
import Link from "next/link";
import { PremiumCodeBlock } from "@/components/docs/PremiumCodeBlock";
import { PremiumCallout } from "@/components/docs/PremiumCallout";

export default function PythonSDKDocs() {
  const installCode = `pip install xtrasecurity`;
  const initCode = `import openapi_client
from openapi_client.api import secrets_api
from openapi_client.configuration import Configuration

# Setup configuration with your token
config = Configuration(
    host="https://www.xtrasecurity.in/api",
    access_token="your_api_token_here"
)

# Initialize the Secrets API
with openapi_client.ApiClient(config) as api_client:
    api = secrets_api.SecretsApi(api_client)
    
    # Fetch secrets
    secrets = api.get_secrets(project_id="prj_123456789", env="production")
    print(secrets)`;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <Link href="/docs/sdks" className="inline-block mb-6">
        <Button variant="outline" size="sm" className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to SDKs
        </Button>
      </Link>
      
      <h1 className="text-4xl font-bold mb-4">Python SDK</h1>
      <p className="text-xl text-muted-foreground mb-12">
        The official Python client for the XtraSecurity API, complete with Pydantic type hints.
      </p>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Terminal className="w-5 h-5" /> Installation
        </h2>
        <PremiumCodeBlock code={installCode} language="bash" />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Basic Usage</h2>
        <p className="mb-4 text-muted-foreground">
          The Python SDK provides raw access to all API endpoints through auto-generated service classes.
        </p>
        <PremiumCodeBlock code={initCode} language="python" />
      </section>
      
      <PremiumCallout type="warning" title="Caching">
        Unlike the Node.js wrapper, the Python SDK does not currently have built-in caching. Please implement your own caching layer if you plan to fetch secrets frequently.
      </PremiumCallout>
    </div>
  );
}
