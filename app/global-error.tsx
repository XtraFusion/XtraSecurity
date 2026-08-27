"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Layout Error caught:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-muted/20 text-foreground min-h-screen flex items-center justify-center p-4 font-sans">
        <Card className="w-full max-w-md shadow-xl border-border/40 border bg-card text-center">
          <CardHeader className="pb-4">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 shadow-sm">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <Badge variant="outline" className="border-rose-500/30 text-rose-500 font-mono text-xs uppercase px-2.5 py-0.5">
                Root System Error
              </Badge>
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">
              Root Layout Exception
            </CardTitle>
            <CardDescription className="text-sm mt-1 max-w-xs mx-auto">
              An unhandled exception occurred in the root layout shell.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="rounded-lg bg-muted/50 border border-border/60 p-4 font-mono text-xs text-left text-muted-foreground">
              <p className="text-rose-500 font-semibold break-words">
                Error: {error.message || "Root layout exception."}
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex items-center justify-center gap-3 pt-2">
            <Button
              onClick={() => reset()}
              className="font-semibold bg-teal-500 hover:bg-teal-600 text-black cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button asChild variant="outline" className="border-border/60">
              <a href="/">
                <Home className="w-4 h-4 mr-2 text-teal-500" />
                Reload App
              </a>
            </Button>
          </CardFooter>
        </Card>
      </body>
    </html>
  );
}
