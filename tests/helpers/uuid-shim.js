const crypto = require('crypto');

function v4() {
  return crypto.randomUUID();
}

module.exports = {
  v4,
  v1: v4,
  v3: v4,
  v5: v4,
  v6: v4,
  v7: v4,
  validate: (str) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str),
  version: () => 4,
  NIL: '00000000-0000-0000-0000-000000000000',
  MAX: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
};
