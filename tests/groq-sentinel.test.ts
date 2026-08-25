import { XtraSentinel } from '../sdk/node/sentinel';
import { XtraClient, XtraError } from '../sdk/node/wrapper';
import axios from 'axios';

jest.mock('axios');

describe('Feature 2: Groq AI-Powered Anomaly & Threat Sentinel (XtraSentinel)', () => {
    const mockedAxios = axios as jest.Mocked<typeof axios>;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('XtraSentinel Unit Tests', () => {
        it('calls Groq AI API endpoint (llama-3.3-70b-versatile) with structured JSON response', async () => {
            mockedAxios.post.mockResolvedValueOnce({
                data: {
                    choices: [
                        {
                            message: {
                                content: JSON.stringify({
                                    isAnomalous: false,
                                    riskScore: 0.1,
                                    reason: 'Legitimate single service startup request.',
                                    recommendedAction: 'ALLOW'
                                })
                            }
                        }
                    ]
                }
            });

            const sentinel = new XtraSentinel('mock-groq-api-key-12345');
            const assessment = await sentinel.evaluateThreat({
                projectId: 'proj_test_ai',
                environment: 'production',
                requestCount: 1,
                timeWindowMs: 10000,
                secretKeys: ['DATABASE_URL', 'STRIPE_KEY'],
                clientIp: '192.168.1.10',
                userIdentifier: 'prod-api-worker'
            });

            expect(mockedAxios.post).toHaveBeenCalledWith(
                'https://api.groq.com/openai/v1/chat/completions',
                expect.objectContaining({
                    model: 'llama-3.3-70b-versatile',
                    response_format: { type: 'json_object' }
                }),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        Authorization: 'Bearer mock-groq-api-key-12345'
                    })
                })
            );

            expect(assessment.isAnomalous).toBe(false);
            expect(assessment.riskScore).toBe(0.1);
            expect(assessment.evaluatedBy).toBe('groq-ai');
        });

        it('falls back gracefully to heuristic threat engine when Groq API key is unconfigured', async () => {
            const sentinel = new XtraSentinel(undefined);
            const assessment = await sentinel.evaluateThreat({
                projectId: 'proj_test_ai',
                environment: 'development',
                requestCount: 1,
                timeWindowMs: 10000,
                secretKeys: ['DEV_KEY']
            });

            expect(mockedAxios.post).not.toHaveBeenCalled();
            expect(assessment.evaluatedBy).toBe('heuristic-fallback');
            expect(assessment.isAnomalous).toBe(false);
        });

        it('triggers REVOKE_AND_ROTATE recommendation on mass secret harvesting rate', async () => {
            const sentinel = new XtraSentinel(undefined);

            // Simulate high-frequency mass secret requests
            let finalAssessment;
            for (let i = 0; i < 20; i++) {
                finalAssessment = await sentinel.evaluateThreat({
                    projectId: 'proj_exfiltrate',
                    environment: 'production',
                    requestCount: 1,
                    timeWindowMs: 10000,
                    secretKeys: [`KEY_${i}`, `SECRET_${i}`]
                });
            }

            expect(finalAssessment?.isAnomalous).toBe(true);
            expect(finalAssessment?.riskScore).toBe(0.95);
            expect(finalAssessment?.recommendedAction).toBe('REVOKE_AND_ROTATE');
        });
    });

    describe('XtraClient SDK Sentinel Interception', () => {
        it('throws XtraError with GROQ AI SENTINEL ALERT when anomaly is detected', async () => {
            const client = new XtraClient({ token: 'test-token', projectId: 'proj_sentinel_sdk', enableSentinel: true });

            // Mock secrets API response
            client.secrets.getSecrets = jest.fn().mockResolvedValue({
                data: { DATABASE_URL: 'postgres://db:5432' }
            });

            // Trigger 16 rapid requests to trip Sentinel threshold
            for (let i = 0; i < 15; i++) {
                await client.getSecrets('production', 'proj_sentinel_sdk', 'main', true);
            }

            await expect(
                client.getSecrets('production', 'proj_sentinel_sdk', 'main', true)
            ).rejects.toThrow(/\[GROQ AI SENTINEL ALERT\]/);
        });
    });
});
