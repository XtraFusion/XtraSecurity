const fs = require('fs');
const path = require('path');

module.exports = async function globalTeardown() {
  const uriFile = path.join(__dirname, '.test-db-uri');
  if (fs.existsSync(uriFile)) {
    try { fs.unlinkSync(uriFile); } catch (_) {}
  }
  if (global.__MONGO_REPL_SET__) {
    await global.__MONGO_REPL_SET__.stop();
  }
};
