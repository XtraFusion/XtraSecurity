import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { isRequestSafe, filterContent, UNSAFE_RESPONSE } from "@/lib/content-filter";

// Initialize Gemini AI with API key
const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error("GEMINI_API_KEY is not set in environment variables");
}
const genAI = new GoogleGenerativeAI(API_KEY || "");

// System prompt - concise version for Gemini API
const SYSTEM_PROMPT = `You are ONLY a documentation assistant for XtraSecurity CLI commands. You ONLY answer questions using the commands and information below. Do NOT use generic knowledge.

XTRA LOGIN: xtra login [--sso|--key <key>|--email <email>]
- SSO: xtra login --sso (browser login)
- Access Key: xtra login --key xs_abc123 (CI/CD)
- Email: xtra login --email user@company.com (password prompt)
- Default: xtra login (interactive menu)

XTRA INIT: xtra init [-y] [--project <id>] [--env <env>] [--branch <br>]
Initialize project, creates .xtrarc

XTRA PROJECT: xtra project set [id] | xtra project current
Manage active project context

XTRA BRANCH: xtra branch list|create|delete|update [name]
Manage secret storage branches

XTRA CHECKOUT: xtra checkout [branch]
Switch active branch

XTRA SECRETS: xtra secrets list [options] | xtra secrets set KEY=VALUE | xtra secrets delete KEY
Manage secrets in vault

XTRA ROTATE: xtra rotate KEY [--promote] [--value <val>]
Rotate secret using shadow mode (create shadow, test, promote)

XTRA RUN: xtra run [--shell] [-e <env>] [-p <proj>] <command>
Execute command with injected secrets (core command)

XTRA WATCH: xtra watch [--interval <sec>] [-e <env>] <command>
Auto-restart when secrets change in cloud

XTRA SIMULATE: xtra simulate [--show-values] [--diff] <command>
Dry-run: show what would be injected without executing

XTRA GENERATE: xtra generate [-o <file>] [-f json|yaml] [-e <env>]
Create .env/JSON/YAML files from secrets

XTRA EXPORT: xtra export [-o <file>] [-f {env,json,csv}]
Export secrets to file

XTRA IMPORT: xtra import <file> [-e <env>] [--prefix <pre>]
Import secrets from JSON/CSV/.env file

XTRA LOCAL: xtra local on|off|status|sync [-e <env>]
Toggle cloud/offline modes, sync to .env.local

XTRA HISTORY: xtra history KEY [-e <env>]
View version history of secret

XTRA ROLLBACK: xtra rollback KEY [v<num>] [-e <env>]
Revert to previous secret version

XTRA LOGS: xtra logs [-n <num>] [--event <type>] [--since <dur>]
View local audit log

XTRA AUDIT: xtra audit verify | xtra audit export [-f json|csv]
Verify tamper-evident chain, export compliance logs

XTRA SCAN: xtra scan [--staged] [--install-hook]
Scan for hardcoded secrets and git leaks

XTRA ACCESS: xtra access request|list|approve
JIT access requests and approvals

XTRA ADMIN: xtra admin users | xtra admin set-role <email> <role>
User and role management

XTRA CI: XTRA_MACHINE_TOKEN=tok xtra ci secrets|set|export|run [-p proj] [-e env]
CI/CD headless mode

XTRA DOCTOR: xtra doctor [--json]
Diagnose setup and connectivity

XTRA STATUS: xtra status [-e <env>] [-p <proj>]
Check sync status with cloud

XTRA DIFF: xtra diff [env1] [env2] [--show]
Compare environments

XTRA PROFILE: xtra profile list|create|use|set|delete [name]
Manage configuration profiles

RULES (CRITICAL):
1. ONLY answer about XtraSecurity commands above
2. Use plain text - NO markdown (no **, ##, \`\`, __)
3. If asked about XtraBackup, XWiki, or generic Linux: "I only answer XtraSecurity CLI questions"
4. Always provide full command syntax with examples
5. Never suggest alternatives to XtraSecurity commands

RESPOND TO:
"How login?" → "Use xtra login with 3 options: --sso (browser), --key <key> (CI/CD), --email <email> (password)"
"Set up secrets?" → "xtra secrets set KEY=VALUE for single or multiple KEY1=VAL1 KEY2=VAL2"
"Run app?" → "xtra run node app.js or xtra run --shell npm start for npm scripts"
"xtra watch?" → "Auto-restarts when secrets change. Usage: xtra watch node app.js"
"Rotate?" → "xtra rotate KEY creates shadow, test it, then xtra rotate KEY --promote to make active"
"Docker?" → "xtra run -- docker build <options>"
Other → "I only have information about XtraSecurity CLI commands"`;


export async function POST(request: NextRequest) {
  try {
    // Validate API key is configured
    if (!API_KEY) {
      console.error("Gemini API key not configured");
      return NextResponse.json(
        { error: "Service temporarily unavailable. Please try again later." },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { messages, userMessage } = body;

    // Validate inputs
    if (!userMessage || !userMessage.trim()) {
      return NextResponse.json(
        { error: "Please enter a message" },
        { status: 400 }
      );
    }

    // Check message length (prevent spam)
    if (userMessage.length > 2000) {
      return NextResponse.json(
        { error: "Message is too long. Please keep it under 2000 characters." },
        { status: 400 }
      );
    }

    // Validate user message for safety and appropriate content
    if (!isRequestSafe(userMessage)) {
      return NextResponse.json(
        { error: UNSAFE_RESPONSE, isSafe: false },
        { status: 400 }
      );
    }

    // Get the Gemini model - using gemini-2.5-flash which is stable and widely available
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        maxOutputTokens: 1024,
        temperature: 0.7,
        topP: 0.95,
      },
    });

    // Build conversation history for context (excluding the initial greeting)
    // Filter to only include messages after the first one, and ensure valid format
    let conversationHistory: any[] = [];
    
    if (messages && messages.length > 1) {
      // Skip the initial greeting message (index 0), start from index 1
      const relevantMessages = messages.slice(1).filter((msg: any) => msg.content && msg.content.trim());
      
      // Ensure we have an even number of messages or end with a user message
      // Map to proper format
      conversationHistory = relevantMessages.map((msg: any) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      }));

      // Validate that if there's history, it starts with 'user'
      if (conversationHistory.length > 0 && conversationHistory[0].role !== "user") {
        // Remove non-user messages from the start
        while (conversationHistory.length > 0 && conversationHistory[0].role !== "user") {
          conversationHistory.shift();
        }
      }
    }

    // Initialize chat session with history (can be empty)
    const chat = model.startChat({
      systemInstruction: SYSTEM_PROMPT,
      history: conversationHistory,
      generationConfig: {
        maxOutputTokens: 1024,
        temperature: 0.7,
        topP: 0.95,
      },
    });

    // Send the message to Gemini
    let response;
    try {
      const result = await chat.sendMessage(userMessage);
      response = result.response.text();
    } catch (geminiError: any) {
      console.error("Gemini API error:", geminiError.message);
      
      if (geminiError.message?.includes("safety")) {
        return NextResponse.json(
          { 
            error: "Your message was blocked by our safety filters. Please rephrase and try again.",
            isSafe: false 
          },
          { status: 400 }
        );
      }
      
      if (geminiError.message?.includes("rate limit")) {
        return NextResponse.json(
          { error: "Too many requests. Please wait a moment and try again." },
          { status: 429 }
        );
      }

      throw geminiError;
    }

    // Validate response safety
    if (!response || !response.trim()) {
      return NextResponse.json(
        { error: "Could not generate a response. Please try again." },
        { status: 500 }
      );
    }

    // Filter response to ensure no sensitive data slipped through
    const filteredResponse = filterContent(response);

    // Final safety check on response
    if (!isRequestSafe(filteredResponse)) {
      return NextResponse.json(
        { error: "Response validation failed. Please try a different question." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      response: filteredResponse,
      isSafe: true,
    });

  } catch (error: any) {
    console.error("Chat API error:", error);

    // Handle specific error types
    if (error.message?.includes("API key")) {
      return NextResponse.json(
        { error: "API configuration error. Please contact support." },
        { status: 500 }
      );
    }

    if (error.message?.includes("network") || error.message?.includes("ECONNREFUSED")) {
      return NextResponse.json(
        { error: "Network error. Please check your connection and try again." },
        { status: 503 }
      );
    }

    // Generic error response
    return NextResponse.json(
      { error: "Failed to generate response. Please try again or contact support." },
      { status: 500 }
    );
  }
}
