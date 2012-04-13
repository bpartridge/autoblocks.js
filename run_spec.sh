#!/bin/bash
#pass --debug-brk to use node-inspector, or debug to use CLI debugger

node $@ node_modules/jasmine-node/lib/jasmine-node/cli.js --runWithRequireJs .
