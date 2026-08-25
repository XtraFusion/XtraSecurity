const fs = require('fs');
const path = require('path');
const { MongoMemoryReplSet } = require('mongodb-memory-server');

module.exports = async function globalSetup() {
  if (!process.env.DATABASE_URL) {
    const replSet = await MongoMemoryReplSet.create({
      instanceOpts: [
        {
          launchTimeout: 120000,
        }
      ],
      replSet: {
        count: 1,
        storageEngine: 'wiredTiger',
      },
    });
    await replSet.waitUntilRunning();
    const uri = replSet.getUri('xtra_security_test');
    process.env.DATABASE_URL = uri;
    global.__MONGO_REPL_SET__ = replSet;
    fs.writeFileSync(path.join(__dirname, '.test-db-uri'), uri, 'utf8');
  }
};
