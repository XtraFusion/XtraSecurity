import axios from 'axios';

export interface ThreatTelemetry {
    projectId: string;
    environment: string;
    requestCount: number;
    timeWindowMs: number;
    secretKeys: string[];
    clientIp?: string;
    userIdentifier?: string;
}

export interface ThreatAssessment {
    isAnomalous: boolean;
    riskScore: number; // 0.0 to 1.0
    reason: string;
    recommendedAction: 'ALLOW' | 'ALERT' | 'REVOKE_AND_ROTATE';
    evaluatedBy: 'groq-ai' | 'heuristic-fallback';
}

export class XtraSentinel {
    private groqApiKey?: string;
    private requestHistory: { timestamp: number; keysCount: number }[] = [];

    constructor(groqApiKey?: string) {
        this.groqApiKey = groqApiKey || process.env.GROQ_API_KEY;
    }

    /**
     * Evaluates threat risk using Groq AI API (llama-3.3-70b-versatile) with heuristic fallback.
     */
    async evaluateThreat(telemetry: ThreatTelemetry): Promise<ThreatAssessment> {
        // Record telemetry in local sliding window
        const now = Date.now();
        this.requestHistory.push({ timestamp: now, keysCount: telemetry.secretKeys.length });
        this.requestHistory = this.requestHistory.filter(r => now - r.timestamp < 10000); // 10s window

        const totalRecentRequests = this.requestHistory.length;
        const totalRecentKeys = this.requestHistory.reduce((sum, r) => sum + r.keysCount, 0);

        // Attempt Groq AI evaluation if API key present
        if (this.groqApiKey) {
            try {
                const groqResponse = await axios.post(
                    'https://api.groq.com/openai/v1/chat/completions',
                    {
                        model: 'llama-3.3-70b-versatile',
                        messages: [
                            {
                                role: 'system',
                                content: `You are an AI Security Threat Analyzer for XtraSecurity Vault. 
Analyze the secret access telemetry and respond ONLY in valid JSON format matching this schema:
{
  "isAnomalous": boolean,
  "riskScore": number (0.0 to 1.0),
  "reason": "short explanation",
  "recommendedAction": "ALLOW" | "ALERT" | "REVOKE_AND_ROTATE"
}`
                            },
                            {
                                role: 'user',
                                content: `Telemetry Data:
- Project ID: ${telemetry.projectId}
- Environment: ${telemetry.environment}
- Recent Request Rate (10s): ${totalRecentRequests} requests
- Total Secrets Fetched (10s): ${totalRecentKeys} secrets
- Current Batch Keys: ${telemetry.secretKeys.join(', ')}
- Client IP: ${telemetry.clientIp || '127.0.0.1'}
- User Identity: ${telemetry.userIdentifier || 'service-account'}`
                            }
                        ],
                        response_format: { type: 'json_object' },
                        temperature: 0.1
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${this.groqApiKey}`,
                            'Content-Type': 'application/json'
                        },
                        timeout: 3000
                    }
                );

                const aiResult = JSON.parse(groqResponse.data.choices[0].message.content);
                return {
                    isAnomalous: Boolean(aiResult.isAnomalous),
                    riskScore: Number(aiResult.riskScore || 0.5),
                    reason: aiResult.reason || 'Groq AI threat analysis completed.',
                    recommendedAction: aiResult.recommendedAction || (aiResult.isAnomalous ? 'REVOKE_AND_ROTATE' : 'ALLOW'),
                    evaluatedBy: 'groq-ai'
                };
            } catch (error) {
                // Fallback to local heuristic engine if API call fails
            }
        }

        // Heuristic Fallback Engine
        return this.evaluateHeuristic(totalRecentRequests, totalRecentKeys, telemetry);
    }

    private evaluateHeuristic(recentRequests: number, recentKeys: number, telemetry: ThreatTelemetry): ThreatAssessment {
        // High-frequency mass harvesting detection (> 15 requests in 10s or > 50 secrets in 10s)
        if (recentRequests > 15 || recentKeys > 50) {
            return {
                isAnomalous: true,
                riskScore: 0.95,
                reason: `Mass secret harvesting detected (${recentRequests} requests / ${recentKeys} keys in 10s window).`,
                recommendedAction: 'REVOKE_AND_ROTATE',
                evaluatedBy: 'heuristic-fallback'
            };
        }

        if (recentRequests > 8 || recentKeys > 20) {
            return {
                isAnomalous: true,
                riskScore: 0.70,
                reason: `Elevated secret access rate (${recentRequests} requests in 10s window).`,
                recommendedAction: 'ALERT',
                evaluatedBy: 'heuristic-fallback'
            };
        }

        return {
            isAnomalous: false,
            riskScore: 0.05,
            reason: 'Normal secret access pattern.',
            recommendedAction: 'ALLOW',
            evaluatedBy: 'heuristic-fallback'
        };
    }
}
