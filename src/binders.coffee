define (require) ->

  _ = require 'underscore'
  $ = require 'jquery'
  {Table, SortedTable} = require './tables'

  class ObjectBinder
    constructor: (options) ->
      @options = _.extend(@defaults, options)
      @bound = new SortedTable

    defaults: {}

    # Accepts a single object of the custom type.
    bind: (obj) =>
      arr = if _.isArray(obj) then obj else [obj]
      for item in arr
        if not _.any(@bound, (val) -> val is item)
          @bound.put (item.id || _.uniqueId()), item

    specs: =>
      res = []
      for own key, value of @bound.data
        res.push _({}).extend(value, {id:key})
      return res

    onUpdates: (updates) =>
      for update in updates
        obj = @bound.get update.id
        _.extend(obj.centroid ?= {}, update.centroid)

  class JQueryBinder extends ObjectBinder

    defaults:
      abClass: 'ab-block'
      idClassPrefix: 'ab-id-'
      childClassPrefix: 'ab-child-'

    # bind takes a jQuery object of a containing element.
    # Any of its children with the class @options.abClass, default 'ab-block',
    # will generate a spec when specs is called.


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
        for c in $e.attr('class').split /\s+/
          if c.indexOf @options.childClassPrefix == 0
            childId = c.substring(@options.childClassPrefix.length)
            spec.children ||= []
            spec.children.push childId
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
        if (x = update.centroid?.x)?
          $e.css left: x - width/2
        if (y = update.centroid?.y)?
          $e.css top: y - height/2

  return {
    ObjectBinder: ObjectBinder
    JQueryBinder: JQueryBinder
  }
