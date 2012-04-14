define (require) ->

  _ = require 'underscore'
  LPProblem = require './lp'
  {Table, SortedTable} = require './tables'
  T = Table.create
  SpecUtils = require './specutils'

  class TreeConstrainer
    constructor: (options) ->
      @options = _.extend({depthDir: 'y'}, options)
      @isDepthY = @options.depthDir == 'y'

    problemFor: (specs) ->
      prob = new LPProblem
      @fixRoots(prob, specs)
      @processBreadth(prob, specs)
      @processDepth(prob, specs)
      return prob

    updatesFrom: (prob) ->
      updates = {}
      prob.vars.forEach (key, value) ->
        match = /^(.+)_([xy])$/.exec key
        if match
          [full, id, prop] = match
          update = updates[id] ||= {id:id}
          update.centroid ?= {}
          update.centroid[prop] = value
      return _(updates).values()

    depthLabel: (id) -> if @isDepthY then "#{id}_y" else "#{id}_x"
    breadthLabel: (id) -> if @isDepthY then "#{id}_x" else "#{id}_y"
    depthFor: (spec) -> if @isDepthY then spec.height else spec.width
    breadthFor: (spec) -> if @isDepthY then spec.width else spec.height

    fixRoots: (prob, specs) ->
      roots = SpecUtils.rootsFor specs
      # Fix the first root's position entirely
      if roots.length
        id = roots[0].id
        @addEqualityConstraint prob, @breadthLabel(id), undefined, 0
        @addEqualityConstraint prob, @depthLabel(id), undefined, 0
        # Set other roots to have the same depth
        if roots.length > 1
          for root in roots[1..]
            @addEqualityConstraint prob, @depthLabel(root.id), undefined, 0

    processBreadth: (prob, specs, objCoeffs) ->
      levels = SpecUtils.levelsFor specs
      for level, iLevel in levels
        SpecUtils.forConsecPairs level, (first, second) =>
          constraintName = "level#{iLevel}::ordering::#{first.id}::#{second.id}"
          ###
          1.centroid.y + 1.height/2 < 2.centroid.y - 2.height/2
          ###
          coeffs = T(@breadthLabel(first.id), 1, @breadthLabel(second.id), -1)
          rhs = -@breadthFor(first)/2 - @breadthFor(second)/2
          prob.updateConstraint(constraintName, coeffs, rhs)
          prob.objCoeffs.increment @breadthLabel(second.id), -1
          prob.objCoeffs.increment @breadthLabel(first.id), 1

    processDepth: (prob, specs) ->
      table = SpecUtils.tableFor specs
      constraintNum = 0
      recurser = (parent) =>
        children = (parent.children || [])
        for childId in children
          child = table.get childId
          constraintName = "childDepth::#{parent.id}::#{childId}"
          ###
          parent.centroid.x + parent.width/2 < child.centroid.x - child.width/2
          ###
          coeffs = T(@depthLabel(parent.id), 1, @depthLabel(childId), -1)
          rhs = -@depthFor(parent)/2 - @depthFor(child)/2
          prob.updateConstraint(constraintName, coeffs, rhs)
          prob.objCoeffs.increment @depthLabel(parent.id), 1
          prob.objCoeffs.increment @depthLabel(childId), -1
          recurser(child)

        # If there is a single child, clamp their breadth variables
        if children.length == 1
          childId = children[0]
          @addEqualityConstraint prob, @breadthLabel(parent.id), @breadthLabel(childId)

        # If there are multiple children, ensure the parent is between them
        if children.length > 2
          firstId = children[0]
          lastId = children[children.length-1]
          # TODO


      for root in SpecUtils.rootsFor specs
        recurser(root)

    addEqualityConstraint: (prob, label0, label1, value) ->
      value ?= 0
      for [mult,suffix] in [[1,'Pos'], [-1,'Neg']]
        name = "equality::#{label0}::#{label1 || 'value::' + value}::#{suffix}"
        coeffs = T(label0, mult)
        if label1? then coeffs
        .put label1, mult*-1
        prob.updateConstraint(name, coeffs, mult*value)


  return {
    TreeConstrainer: TreeConstrainer
  }
