if (typeof define != 'function' && module)
  define = require('amdefine')(module)

define (require) ->

  class Autoblocks
    constructor: (options) ->
      @binder = options?.binder || new Autoblocks.Binders.ObjectBinder
      @constrainer = options?.constrainer || new Autoblocks.Constrainers.TreeConstrainer

    bind: (obj) => @binder.bind obj

    update: =>
      specs = @binder.specs()
      problem = @constrainer.problemFor(specs)

    @Binders: require './binders'
    @Constrainers: require './constrainers'
    @create: -> new Autoblocks()

  return Autoblocks