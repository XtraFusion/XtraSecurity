"use client";

import { useState, useMemo } from "react";
import { PremiumCallout } from "@/components/docs/PremiumCallout";
import { PremiumCodeBlock } from "@/components/docs/PremiumCodeBlock";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, Terminal, Shield, Workflow, Key, Layers, Code2, Bolt, 
  Database, GitBranch, Search, ChevronRight, Copy, Check, Zap, 
  Activity, PlayCircle, Settings, Lock, Users, Globe as GlobeIcon, 
  Cloud, Blocks, ShieldAlert, Monitor, Info
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// Import the complete CLI reference data
import cliData from "@/../CLI_COMMANDS_REFERENCE.json";

interface CommandOption {
  flag: string;
  desc: string;
}

interface CommandExample {
  language: string;
  code: string;
}

interface CliCommand {
  name: string;
  syntax: string;
  desc: string;
  promptOutput?: string;
  explanation?: string;
  examples?: CommandExample[];
  options?: CommandOption[];
  notes?: string;
  subcommands?: any[];
}

interface CliSection {
  id: string;
  title: string;
  icon: any;
  description: string;
  commands: CliCommand[];
}

const CATEGORY_ICONS: Record<string, any> = {
  "Authentication": Key,
  "Project & Setup": Workflow,
  "Execution": PlayCircle,
  "Secrets Management": Shield,
  "Project Management": Layers,
  "Configuration": Settings,
  "Version Control": GitBranch,
  "Utilities": Zap,
  "Environment": GlobeIcon,
  "Audit & Logging": Activity,
  "Security": ShieldAlert,
  "Access Control": Lock,
  "Administration": Users,
  "CI/CD": Cloud,
  "Integrations": Blocks
};

// Process the JSON data into the format needed for the page
const CLI_SECTIONS: CliSection[] = cliData.commandReference.categories.map((cat: any) => {
  const sectionCommands = cat.commands.map((cmdName: string) => {
    const cmd = cliData.commandReference.commands.find((c: any) => c.name === cmdName);
    if (!cmd) return null;

    return {
      name: cmd.name,
      syntax: cmd.usage,
      desc: cmd.description,
      explanation: cmd.notes || "",
      examples: cmd.examples?.map((ex: string) => ({ language: "Terminal", code: ex })) || [],
      options: cmd.options || cmd.parentOptions || [],
      subcommands: cmd.subcommands || []
    };
  }).filter(Boolean);

  return {
    id: cat.id.toLowerCase().replace(/\s+/g, "-"),
    title: cat.id,
    icon: CATEGORY_ICONS[cat.id] || Terminal,
    description: cat.description,
    commands: sectionCommands
  };
});

export default function CliDocsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter sections and commands based on search query
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return CLI_SECTIONS;
    
    const query = searchQuery.toLowerCase();
    return CLI_SECTIONS.map(section => {
      const filteredCommands = section.commands.filter(cmd => 
        cmd.name.toLowerCase().includes(query) || 
        cmd.desc.toLowerCase().includes(query) ||
        cmd.syntax.toLowerCase().includes(query)
      );
      
      return {
        ...section,
        commands: filteredCommands
      };
    }).filter(section => section.commands.length > 0);
  }, [searchQuery]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 pb-32">
      
      {/* Header Area */}
      <div className="mb-16">
        <Link href="/docs" className="inline-block mb-10">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Docs
          </Button>
        </Link>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10 text-[11px] font-semibold tracking-tight text-primary mb-4">
              <Terminal className="h-3.5 w-3.5" />
              CLI Reference
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground mb-4">
              XtraSecurity CLI
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
              Complete reference for all {cliData.commandReference.metadata.totalCommands} commands. Search below to find specific syntax, options, and usage examples.
            </p>
          </div>
          
          {/* Search Bar */}
          <div className="w-full md:w-80 relative group shrink-0">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-4 py-3 bg-muted/30 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none shadow-sm"
              placeholder="Search commands (e.g. 'rotate', 'jit')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground text-xs font-medium"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-12">
        <div className="flex-1 min-w-0">
          {/* Global Installation */}
          {!searchQuery && (
        <section className="mb-20">
          <div className="p-8 rounded-2xl bg-gradient-to-br from-card to-background border border-border shadow-sm">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Code2 className="w-5 h-5 text-primary" /> Installation
            </h2>
            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex-1 text-muted-foreground text-sm leading-relaxed space-y-4">
                <p>
                  The CLI is distributed as an npm package. You can install it globally using your preferred package manager.
                </p>
                <PremiumCallout type="info" title="Verify Installation">
                  Run <code className="text-xs font-mono font-bold text-foreground">xtra --version</code> to ensure the CLI is correctly installed.
                </PremiumCallout>
              </div>
              <div className="flex-1">
                <PremiumCodeBlock 
                  options={[
                    { language: "npm", code: "npm install -g xtra-cli", filename: "Terminal" },
                    { language: "yarn", code: "yarn global add xtra-cli", filename: "Terminal" },
                    { language: "pnpm", code: "pnpm add -g xtra-cli", filename: "Terminal" },
                  ]} 
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Results / Empty State */}
      {searchQuery && filteredSections.length === 0 && (
        <div className="py-20 text-center border border-dashed border-border rounded-2xl bg-muted/10">
          <Terminal className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-foreground mb-2">No commands found</h3>
          <p className="text-muted-foreground">Try adjusting your search query.</p>
          <Button variant="outline" className="mt-6" onClick={() => setSearchQuery("")}>Clear Search</Button>
        </div>
      )}

      {/* Dynamic Sections */}
      <div className="space-y-24">
        <AnimatePresence>
          {filteredSections.map((section) => {
            const Icon = section.icon;
            return (
              <motion.section 
                key={section.id} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="scroll-mt-24" 
                id={section.id}
              >
                <div className="mb-8 border-b border-border pb-4">
                  <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                      <Icon className="w-5 h-5" />
                    </div>
                    {section.title}
                  </h2>
                  <p className="text-muted-foreground pl-10">{section.description}</p>
                </div>
                
                <div className="grid grid-cols-1 gap-8">
                  {section.commands.map((cmd) => (
                    <div key={cmd.name} id={`cmd-${cmd.name}`} className="py-12 border-b border-border/20 last:border-0 scroll-mt-24">
                      
                      {/* Command Header */}
                      <div className="mb-6">
                        <div className="inline-flex items-center gap-2 text-foreground font-bold text-2xl mb-3">
                          xtra {cmd.name}
                        </div>
                        <p className="text-muted-foreground text-base leading-relaxed max-w-3xl">
                          {cmd.desc}
                        </p>
                      </div>

                      {/* Syntax Code Block */}
                      <div className="mb-8 max-w-4xl">
                        <PremiumCodeBlock 
                          options={[{ language: "Terminal", code: cmd.syntax }]} 
                        />
                      </div>

                      {/* Subcommands List */}
                      {cmd.subcommands && cmd.subcommands.length > 0 && (
                        <div className="mb-8 space-y-4 max-w-4xl">
                          <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                             <Layers className="w-4 h-4 text-primary" /> Available Subcommands
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                             {cmd.subcommands.map((sub: any, idx: number) => (
                               <div key={idx} className="p-3 rounded-lg border border-border bg-muted/30">
                                 <div className="font-mono text-xs font-bold text-foreground mb-1">
                                   xtra {cmd.name} {sub.name}
                                 </div>
                                 <div className="text-[11px] text-muted-foreground">
                                   {sub.description}
                                 </div>
                               </div>
                             ))}
                          </div>
                        </div>
                      )}

                      {/* Explanation */}
                      {cmd.explanation && (
                        <div className="mb-8 max-w-3xl">
                          <PremiumCallout type="note">
                            {cmd.explanation}
                          </PremiumCallout>
                        </div>
                      )}

                      {/* Options Table */}
                      {cmd.options && cmd.options.length > 0 && (
                        <div className="space-y-4 max-w-4xl">
                          <h4 className="text-sm font-bold text-foreground">Options</h4>
                          <div className="border border-border/50 rounded-xl overflow-hidden bg-card/50">
                            <Table>
                              <TableBody>
                                {cmd.options.map((opt, i) => (
                                  <TableRow key={i} className="hover:bg-muted/10 border-border/50">
                                    <TableCell className="font-mono text-xs font-semibold py-3.5 whitespace-nowrap w-[200px] text-foreground">
                                      {opt.flag}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground py-3.5">
                                      {opt.description || opt.desc}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      )}

                      {/* Examples */}
                      {cmd.examples && cmd.examples.length > 0 && (
                        <div className="mt-8 space-y-4 max-w-4xl">
                          <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                            <Monitor className="w-4 h-4 text-primary" /> Usage Examples
                          </h4>
                          <PremiumCodeBlock options={cmd.examples} />
                        </div>
                      )}

                    </div>
                  ))}
                </div>
              </motion.section>
            );
          })}
        </AnimatePresence>
      </div>
        </div>

        {/* Right Sidebar (Table of Contents) */}
        {!searchQuery && (
          <div className="hidden xl:block w-64 shrink-0 pl-6 xl:border-l border-border/50">
            <div className="sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto pr-4 pb-10 custom-scrollbar">
              <h4 className="text-sm font-bold text-foreground mb-4 uppercase tracking-widest text-[10px]">On this page</h4>
              <ul className="space-y-6 text-sm text-muted-foreground">
                {CLI_SECTIONS.map((section) => (
                  <li key={section.id}>
                    <a href={`#${section.id}`} className="hover:text-foreground font-bold transition-colors uppercase text-[11px] tracking-tight flex items-center gap-2">
                      <section.icon className="w-3.5 h-3.5 text-primary/60" />
                      {section.title}
                    </a>
                    <ul className="pl-3 mt-3 space-y-2.5 border-l border-border/50">
                      {section.commands.map((cmd) => (
                        <li key={cmd.name}>
                          <a 
                            href={`#cmd-${cmd.name}`} 
                            className="hover:text-foreground text-xs font-mono transition-colors block -ml-[1px] pl-3 border-l border-transparent hover:border-primary text-muted-foreground/80 hover:text-foreground"
                          >
                            {cmd.name}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
              
              <div className="mt-10 pt-10 border-t border-border/50">
                 <h4 className="text-[10px] font-bold text-foreground mb-4 uppercase tracking-widest">Version</h4>
                 <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 text-xs font-mono text-primary">
                    v{cliData.commandReference.metadata.version}
                 </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
