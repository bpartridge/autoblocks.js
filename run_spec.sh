#!/bin/bash
#pass --debug-brk to use node-inspector, or debug to use CLI debugger

/usr/bin/osascript <<EOT
tell application "System Events" to tell process "Terminal" to keystroke "k" using command down
EOT
node $@ node_modules/jasmine-node/lib/jasmine-node/cli.js --runWithRequireJs .

