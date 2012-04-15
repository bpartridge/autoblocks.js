(function() {
  var NODE_MODULES_DIR, app, config, express, fs, http, requirejs;

  requirejs = require('requirejs');

  http = require('http');

  fs = require('fs');

  express = require('express');

  NODE_MODULES_DIR = '../node_modules/';

  config = {
    baseUrl: __dirname,
    paths: {
      requireLib: NODE_MODULES_DIR + 'requirejs/require',
      underscore: 'lib/underscore',
      jquery: 'lib/jquery-1.6.1-min',
      util: 'lib/fake-util',
      jasmine: 'lib/jasmine',
      "jasmine-html": 'lib/jasmine-html'
    },
    name: 'requireLib',
    include: ['main'],
    optimize: 'none',
    out: __dirname + '/built.js'
  };

  app = express.createServer();

  app.configure(function() {
    app.use(express.logger({
      format: ':method :url => :status in :response-time'
    }));
    app.use(express.cookieParser());
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    return app.use(express.static(__dirname));
  });

  app.get('/autoblocks.js', function(req, res) {
    try {
      return requirejs.optimize(config, function(buildResponse) {
        console.log(buildResponse);
        return fs.readFile(config.out, function(err, content) {
          if (err) {
            res.contentType('text/plain');
            return res.send("Output file error", 500);
          } else {
            res.contentType('application/javascript');
            return res.send(content);
          }
        });
      });
    } catch (error) {
      console.error(error);
      res.contentType('text/plain');
      return res.send("Optimization error", 500);
    }
  });

  app.listen(3000);

  require('child_process').exec(__dirname + '/refresh_browser.sh');

}).call(this);
