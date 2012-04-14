(function() {

  define(function(require) {
    var Autoblocks;
    Autoblocks = require('../src/autoblocks');
    require('jasmine');
    require('jasmine-html');
    require('../spec/autoblocks.spec');
    require('../spec/lp.spec');
    require('../spec/specutils.spec');
    jasmine.getEnv().addReporter(new jasmine.TrivialReporter());
    return jasmine.getEnv().execute();
  });

}).call(this);
