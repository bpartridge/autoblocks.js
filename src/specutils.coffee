if (typeof define != 'function' && module)
  define = require('amdefine')(module)

define (require) ->

  _ = require 'underscore'
  {Table, SortedTable} = require './tables'

  utils =
    forConsecPairs: (array, func) ->
      # Resort to plain JS because CoffeeScript doesn't have basic for loops
      `for (var i = 0, l = array.length-1; i < l; ++i) func(array[i], array[i+1], i, i+1)`
      return undefined
    forAllPairs: (array, func, orderMatters) ->
      if orderMatters
        for first, i in array
          for second, j in array
            if first isnt second
              func first, second, i, j
      else
        for first, i in array
          for second, j in array[(i+1)..]
            func first, second, i, i+1+j

  utils.collide = (specs) ->

  utils.rootsFor = (specs) ->
    allChildren = _(specs).chain().pluck('children').flatten().value()
    allIds = _(specs).pluck('id')
    rootIds = _(allIds).difference(allChildren)
    # console.log allIds, allChildren, rootIds
    return specs.filter (spec) -> rootIds.indexOf(spec.id) >= 0

  utils.tableFor = (specs) ->
    table = new SortedTable
    for spec in specs
      table.put spec.id, spec
    return table

  # Partitions specs into array of array of levels
  utils.levelsFor = (specs) ->
    table = utils.tableFor specs
    roots = utils.rootsFor specs
    levels = []
    recurser = (spec, level) ->
      # console.log "recurser", spec, level, levels.length
      if level >= levels.length
        levels[level] = [spec]
      else
        levels[level].push spec
      for childId in (spec.children || [])
        child = table.get childId
        recurser(child, level+1)

    for root in roots
      recurser(root, 0)
    return levels

  return utils
