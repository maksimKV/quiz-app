const fs = require('fs')
const key = JSON.parse(fs.readFileSync('serviceAccountKey.json', 'utf8'))
key.private_key = key.private_key.replace(/\n/g, '\\n')
