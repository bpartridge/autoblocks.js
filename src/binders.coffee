define (require) ->

  _ = require 'underscore'
  $ = require 'jquery'
  {Table, SortedTable} = require './tables'

  class ObjectBinder
    constructor: ->
      @bound = new SortedTable

    # Accepts a single object of the custom type.
    # Returns success (not a duplicate)
    bind: (obj) =>
      if _.any(@bound, (val) -> val is obj) then return false
      @bound.put (obj.id || _.uniqueId()), obj
      return true

    specs: =>
      res = []
      for own key, obj of @bound.data
        res.push _({}).extend(value, {id:key})
      return res

    onUpdates: (updates) =>
      for update in updates
        obj = @bound.get update.id
        obj.centroid = update.centroid

  class JQueryBinder extends ObjectBinder

    # bind takes a single DOM element.
    # Can be called with `$(selector).each -> binder.bind(this)`
    # bind: ObjectBinder::bind

    specs: =>
      specs = []
      for own key, elem of @bound.data
        $e = $(elem)
        pos = $e.position()
        spec = 
          id: key
          width: $e.outerWidth()
          height: $e.outerHeight()
          centroid: {}
        spec.centroid.x = pos.left + spec.width / 2
        spec.centroid.y = pos.top + spec.height / 2
        specs.push spec
      return specs

    onUpdates: (updates) =>
      for update in updates
        elem = @bound.get update.id
        $e = $(elem)
        width = $e.outerWidth()
        height = $e.outerHeight()
        $e.css
          position: 'absolute'
          left: update.x - width / 2
          top: update.y - width / 2

  return {
    ObjectBinder: ObjectBinder
    JQueryBinder: JQueryBinder
  }
