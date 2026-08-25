const fs = require('fs');
const path = require('path');
require('dotenv').config();

const uriFile = path.join(__dirname, 'tests', 'helpers', '.test-db-uri');
if (fs.existsSync(uriFile)) {
  process.env.DATABASE_URL = fs.readFileSync(uriFile, 'utf8').trim();
}

// Ensure test encryption key and secret keys are available
if (!process.env.ENCRYPTION_KEY) {
    process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
}
if (!process.env.NEXTAUTH_SECRET) {
    process.env.NEXTAUTH_SECRET = 'e2e-test-nextauth-secret-key-32-chars-long';
}
if (!process.env.NEXTAUTH_URL) {
    process.env.NEXTAUTH_URL = 'http://localhost:3000';
}
if (!process.env.NEXT_PUBLIC_APP_URL) {
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
}

// Mock email dispatcher to prevent external network calls during tests
jest.mock('@/lib/email', () => ({
  sendEmail: jest.fn().mockResolvedValue({ success: true }),
}));

// Mock BullMQ background queues to prevent Redis TCP connections during tests
jest.mock('@/lib/queue/sync-queue', () => ({
  queueSecretSync: jest.fn().mockResolvedValue(true),
  syncQueue: { add: jest.fn().mockResolvedValue(true) },
}));
jest.mock('@/lib/queue/webhook-queue', () => ({
  addWebhookJob: jest.fn().mockResolvedValue(true),
}));
jest.mock('@/lib/webhook', () => ({
  triggerWebhooks: jest.fn().mockResolvedValue(true),
}));
