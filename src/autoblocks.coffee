define (require) ->

  class Autoblocks
    constructor: (options) ->
      @binder = options?.binder || new Autoblocks.Binders.ObjectBinder
      @constrainer = options?.constrainer || new Autoblocks.Constrainers.TreeConstrainer

    bind: (obj) => @binder.bind obj

    update: =>
      specs = @binder.specs()
      problem = @constrainer.problemFor specs
      problem.solve()
      updates = @constrainer.updatesFrom problem
      @binder.onUpdates updates

    @Binders: require './binders'
    @Constrainers: require './constrainers'
    @create: -> new Autoblocks()

  return Autoblocks
