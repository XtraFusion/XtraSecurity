import { XtraClient } from './wrapper';

console.log('Testing XtraClient initialization...');

try {
    const client = new XtraClient({ token: 'test-token', projectId: 'test-project' });
    console.log('XtraClient initialized successfully!');
    console.log('Available modules:', Object.keys(client).filter(k => !k.startsWith('_')));
} catch (error) {
    console.error('Failed to initialize XtraClient:', error);
    process.exit(1);
}
