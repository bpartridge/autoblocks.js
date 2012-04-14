requirejs = require 'requirejs'
http = require 'http'
fs = require 'fs'
express = require 'express'

config =
  baseUrl: __dirname
  paths:
    requireLib: 'lib/require'
    underscore: 'lib/underscore'
    jquery: 'lib/jquery-1.6.1-min'
    util: 'lib/fake-util'
    jasmine: 'lib/jasmine'
    "jasmine-html": 'lib/jasmine-html'
    # 'mersenne-twister': '../spec/mersenne-twister'
  name: 'requireLib'
  include: ['main']
  optimize: 'none'
  out: __dirname + '/built.js'

app = express.createServer()
app.configure ->
  app.use express.logger
    format: ':method :url => :status in :response-time'
  app.use express.cookieParser()
  app.use express.bodyParser()
  app.use express.methodOverride()
  app.use app.router
  app.use express.static(__dirname)

app.get '/autoblocks.js', (req,res) ->
  try
    requirejs.optimize config, (buildResponse) ->
      console.log buildResponse
      fs.readFile config.out, (err, content) ->
        if err
          res.contentType 'text/plain'
          res.send "Output file error", 500
        else
          res.contentType 'application/javascript'
          res.send content
  catch error
    console.error error
    res.contentType 'text/plain'
    res.send "Optimization error", 500

app.listen(3000)

require('child_process').exec __dirname + '/refresh_browser.sh'
