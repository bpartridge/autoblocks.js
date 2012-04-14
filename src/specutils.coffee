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

  utils.pickRandom = (array, count) ->
    count ?= 1
    return (array[Math.floor(Math.random()*array.length)] for i in [1..count])

  utils.collide = (specs) ->
    pairs = []
    utils.forAllPairs specs, (first, second) ->
      pairs.push [first, second]
    return _(pairs).any (pair) ->
      [first, second] = pair
      dx = Math.abs(first.centroid.x - second.centroid.x)
      dy = Math.abs(first.centroid.y - second.centroid.y)
      return dx < (first.width + second.width)/2 &&
        dy < (first.height + second.height)/2

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
