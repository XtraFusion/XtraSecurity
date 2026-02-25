// Content filtering to prevent insensitive, harmful, and illegal content

const BLOCKED_PATTERNS = [
  // Illegal activities
  /\b(hack|illegal|crime|murder|theft|bomb|drug|cocaine|heroin|meth|fentanyl)\b/gi,
  /\b(buy|sell|distribute|manufacture).*(gun|weapon|explosive|drug)\b/gi,
  /\b(ddos|ransomware|malware|exploit|zero.?day)\b/gi,
  
  // Hate speech and discrimination
  /\b(racist|sexist|misogyn|homophob|xenophob|anti.?semit)\b/gi,
  /\b(f[*u]ck|sh[*i]t|b[*i]tch|a[*ss]hole)\b/gi,
  
  // Violent content
  /\b(rape|sexual assault|torture|abuse|violence)\b/gi,
  /\b(kill|murder|assassinate|stab|shoot)\b/gi,
  
  // Harmful instructions
  /\b(how to.*hurt|harm someone|injure|poison|overdose)\b/gi,
];

const SUSPICIOUS_KEYWORDS = [
  "hack",
  "bypass",
  "crack",
  "illegal",
  "crime",
  "fraud",
  "money laundering",
  "terrorist",
  "extremist",
  "drugs",
  "weapons",
  "exploit ",
];

const ALLOWED_TECHNICAL_TERMS = [
  "exploit",
  "vulnerability",
  "penetration testing",
  "ethical hacking",
  "security bypass",
  "encryption bypass",
];

export function isContentSafe(text: string): boolean {
  if (!text) return true;

  // Check for blocked patterns
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(text)) {
      return false;
    }
  }

  // Check for suspicious keywords but allow technical security terms
  const lowerText = text.toLowerCase();
  for (const keyword of SUSPICIOUS_KEYWORDS) {
    if (
      lowerText.includes(keyword) &&
      !ALLOWED_TECHNICAL_TERMS.some(term => lowerText.includes(term))
    ) {
      return false;
    }
  }

  return true;
}

export function filterContent(text: string): string {
  if (!text) return text;

  let filtered = text;

  // Replace blocked words with asterisks
  for (const pattern of BLOCKED_PATTERNS) {
    filtered = filtered.replace(pattern, match => {
      return match
        .split("")
        .map((c, i) => (i === 0 ? c : "*"))
        .join("");
    });
  }

  // Remove markdown formatting (**, __, ``, ##, etc.)
  // Replace **text** with text
  filtered = filtered.replace(/\*\*(.*?)\*\*/g, '$1');
  // Replace __text__ with text
  filtered = filtered.replace(/__(.*?)__/g, '$1');
  // Remove backticks around code
  filtered = filtered.replace(/`([^`]+)`/g, '$1');
  // Remove markdown headers (##, ###, ####)
  filtered = filtered.replace(/^#{1,6}\s+/gm, '');
  // Remove extra asterisks that are not part of sentences (stray formatting)
  filtered = filtered.replace(/\s\*\s/g, ' ');
  // Remove leading/trailing asterisks
  filtered = filtered.replace(/^\*+|\*+$/gm, '');

  return filtered;
}


export function isRequestSafe(userMessage: string): boolean {
  const message = userMessage.toLowerCase();
  
  // Block requests for illegal or harmful activities
  const blockedActivities = [
    "hack someone",
    "crack password",
    "bypass security",
    "steal credentials",
    "launch attack",
    "ddos",
    "ransomware",
    "malware",
    "exploit",
    "buy drugs",
    "sell weapons",
    "how to hurt",
    "how to kill",
    "bomb",
    "chemical weapon",
    "biological weapon",
  ];

  for (const activity of blockedActivities) {
    if (message.includes(activity)) {
      return false;
    }
  }

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /how\s+to\s+(hack|crack|exploit|bypass)/i,
    /help\s+me\s+(steal|fraud|hack|ddos)/i,
    /(buy|sell|create).*(drug|weapon|explosive)/i,
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(message)) {
      return false;
    }
  }

  return true;
}

export const UNSAFE_RESPONSE = `I can only help with XtraSecurity documentation and features. 

Please ask me about:
- XtraSecurity CLI commands (xtra login, xtra secrets, xtra run, xtra rotate, xtra watch, etc.)
- How to use XtraSecurity for secret management
- Authentication and setup
- Secret rotation with shadow mode
- Integration with CI/CD
- Troubleshooting XtraSecurity issues

If you have a question about something unrelated to XtraSecurity, I won't be able to help with that.`;
