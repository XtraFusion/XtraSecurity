import { validatePasswordComplexity } from '../lib/validators';
import { signWebhookPayload } from '../lib/webhook-dispatcher';

const p1 = validatePasswordComplexity('weak');
console.log('Weak valid:', p1.valid, 'Errors:', p1.errors.length);

const p2 = validatePasswordComplexity('Str0ngP@ssw0rd!');
console.log('Strong valid:', p2.valid, 'Score:', p2.score, 'Entropy:', p2.entropyBits);

const sig = signWebhookPayload('{"test":true}');
console.log('Webhook sig generated:', sig.signature.startsWith('t=') && sig.signature.includes('v1='));
