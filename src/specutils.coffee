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

  utils.pickRandom = (array, count, randomObj) ->
    count ?= 1
    randomOb ?= Math
    return (array[Math.floor(randomObj.random()*array.length)] for i in [1..count])

  utils.collide = (specs) ->
    pairs = []
    utils.forAllPairs specs, (first, second) ->
      pairs.push [first, second]
    return _(pairs).find (pair) ->
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

  utils.boundsFor = (specs) ->
    dims = {}
    dims.minX = _.min _(specs).map (spec) -> spec.centroid.x - spec.width/2
    dims.maxX = _.max _(specs).map (spec) -> spec.centroid.x + spec.width/2
    dims.minY = _.min _(specs).map (spec) -> spec.centroid.y - spec.height/2
    dims.maxY = _.max _(specs).map (spec) -> spec.centroid.y + spec.height/2
    dims.width = dims.maxX - dims.minX
    dims.height = dims.maxY - dims.minY
    return dims

  utils.specContains = (spec, point) ->
    dx = Math.abs(point.x - spec.centroid.x)
    dy = Math.abs(point.y - spec.centroid.y)
    return dx < spec.width/2 && dy < spec.height/2

  # For fun and testing: Creates a string which, drawn to the console,
  # represents the specs in ASCII art
  # Inspired by https://github.com/davglass/nodejs-termcolors/blob/master/lib/termcolors.js
  utils.drawToString = (specs, cols) ->
    if not specs.length then return ""

    # Determine dimensions
    COLS_PER_ROW = 5
    dims = utils.boundsFor specs
    dims.width += 1
    dims.height += 1
    rcOverXY = cols / dims.width
    rows = Math.ceil(rcOverXY * dims.height / COLS_PER_ROW)

    # Define a translation function, returning {x,y}
    rc2xy = (r, c) ->
      x = c / rcOverXY + dims.minX
      y = r*COLS_PER_ROW / rcOverXY + dims.minY
      return {x,y}

    ids = _(specs).pluck 'id'
    termColors = _.flatten _([31..37]).map (i) ->
      ["\033[#{i}m"] # ,"\033[1;#{i}m"]

    colorForId = (id) ->
      idx = _(ids).indexOf id
      if (idx >= termColors.length) then idx = 0
      return termColors[idx]
    letterForId = (id) ->
      idx = _(ids).indexOf id
      letter = String.fromCharCode(65 + idx || 40)
    CLEAR = '\033[m'
    BG = '\033[1;47m'

    strings = []
    # Start with row describing hierarchy
    for spec in specs
      strings.push colorForId spec.id
      strings.push spec.id
      if spec.children then strings.push CLEAR+"->"
      strings.push _(spec.children || []).
        map((childId)->colorForId(childId)+childId+CLEAR).join ','
      strings.push CLEAR+'  '
    strings.push CLEAR+'\n'

    # Now print the grid
    for r in [0..rows-1]
      for c in [0..cols-1]
        # console.log [r, c, rc2xy(r,c)]
        pt = rc2xy(r,c)
        contained = _(specs).filter (spec) -> utils.specContains spec, pt
        if contained.length > 0
          if contained.length > 1 
            strings.push BG
          strings.push colorForId contained[0].id
          strings.push letterForId contained[0].id
          if contained.length > 1 then strings.push CLEAR
        else
          strings.push ' '

      strings.push CLEAR+'\n'

    return strings.join ''
    # return [rows, cols, dims]

  return utils
