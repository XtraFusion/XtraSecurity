"use client";

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Copy, Trash2, Hash, Code, Type, RefreshCw } from 'lucide-react';
import { toast } from "sonner";

export default function UnicodeConverterPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'to-unicode' | 'from-unicode'>('to-unicode');

  const convertToUnicode = (text: string) => {
    return text.split('').map(char => {
      const code = char.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0');
      return `\\u${code}`;
    }).join('');
  };

  const convertFromUnicode = (text: string) => {
    try {
      return text.replace(/\\u([0-9a-fA-F]{4})/g, (match, grp) => {
        return String.fromCharCode(parseInt(grp, 16));
      });
    } catch (e) {
      return "Invalid Unicode sequence";
    }
  };

  const handleConvert = () => {
    if (mode === 'to-unicode') {
      setOutput(convertToUnicode(input));
    } else {
      setOutput(convertFromUnicode(input));
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const clear = () => {
    setInput('');
    setOutput('');
  };

  return (
    <DashboardLayout>
      <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col gap-2 border-b border-border/40 pb-6">
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Type className="h-8 w-8 text-primary" />
            Unicode Converter
          </h1>
          <p className="text-muted-foreground text-lg">
            Easily convert text to escape sequences and back for secure string handling.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-border/60 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Input Text</CardTitle>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMode(mode === 'to-unicode' ? 'from-unicode' : 'to-unicode')}>
                    <RefreshCw className={`h-4 w-4 transition-transform duration-500 ${mode === 'from-unicode' ? 'rotate-180' : ''}`} />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={clear}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardDescription>
                {mode === 'to-unicode' ? 'Enter normal text to encode' : 'Enter \\uXXXX sequences to decode'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea 
                placeholder={mode === 'to-unicode' ? "Type something..." : "\\u0048\\u0065\\u006C\\u006C\\u006F"}
                className="min-h-[200px] font-mono text-sm bg-background/50 border-border/40 focus:border-primary/50"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <Button className="w-full mt-4 shadow-lg shadow-primary/10" onClick={handleConvert}>
                {mode === 'to-unicode' ? 'Convert to Unicode' : 'Convert to Text'}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Output</CardTitle>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(output)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>Resulting conversion</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="min-h-[200px] w-full p-4 rounded-md border border-border/40 bg-muted/30 font-mono text-sm break-all">
                {output || <span className="text-muted-foreground/50">Output will appear here...</span>}
              </div>
              <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                <Badge variant="outline" className="shrink-0 bg-primary/5 text-primary border-primary/20">
                  <Code className="h-3 w-3 mr-1" /> JSON Friendly
                </Badge>
                <Badge variant="outline" className="shrink-0 bg-blue-500/5 text-blue-500 border-blue-500/20">
                  <Hash className="h-3 w-3 mr-1" /> Hex Encoded
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
