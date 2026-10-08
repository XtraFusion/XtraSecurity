import { NextRequest } from "next/server";
import { parse } from "ipaddr.js";

/**
 * Checks if a given IP address is allowed based on an array of IP/CIDR restrictions.
 * If the restrictions array is empty, all IPs are allowed.
 */
export function isIpAllowed(
  clientIp: string,
  restrictions: { ip: string }[]
): boolean {
  if (!restrictions || restrictions.length === 0) {
    return true; // No restrictions, allow all
  }

  // IPv4 localhost fallback
  const normalizedClientIp = clientIp === "::1" || clientIp === "::ffff:127.0.0.1" ? "127.0.0.1" : clientIp;

  try {
    const parsedClientIp = parse(normalizedClientIp);

    for (const rule of restrictions) {
      try {
        if (rule.ip.includes("/")) {
          // CIDR Notation
          const [rangeIp, bits] = rule.ip.split("/");
          const parsedRange = parse(rangeIp);
          
          if (parsedClientIp.kind() === parsedRange.kind()) {
            if (parsedClientIp.match(parsedRange, parseInt(bits, 10))) {
              return true;
            }
          }
        } else {
          // Exact IP Match
          const parsedRule = parse(rule.ip);
          if (parsedClientIp.compare(parsedRule) === 0) {
            return true;
          }
        }
      } catch (err) {
        // Ignore invalid rule parsing and continue
        console.warn(`Invalid IP rule in DB: ${rule.ip}`);
      }
    }
  } catch (err) {
    console.warn(`Could not parse client IP: ${normalizedClientIp}`);
    return false; // If client IP is invalid, deny safely
  }

  return false; // Did not match any rule
}
