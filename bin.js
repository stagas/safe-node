#!/usr/bin/env node-real

// this should be modified to where node_modules
// are globally installed
module.paths.push('/usr/local/lib/node_modules')

const { sync: spawnSync } = require('cross-spawn')
const patch = require.resolve('safe-node')
process.exit(spawnSync('node-real', ['-r', patch, ...process.argv.slice(2)], { stdio: 'inherit' }).status)
