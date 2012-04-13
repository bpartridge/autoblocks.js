if (typeof define != 'function' && module)
  define = require('amdefine')(module)

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
      @processBreadth(prob, specs)
      @processDepth(prob, specs)
      return prob

    depthLabel: (id) -> if @isDepthY then "#{id}_y" else "#{id}_x"
    breadthLabel: (id) -> if @isDepthY then "#{id}_x" else "#{id}_y"
    depthFor: (spec) -> if @isDepthY then spec.height else spec.width
    breadthFor: (spec) -> if @isDepthY then spec.width else spec.height

    processBreadth: (prob, specs, objCoeffs) ->
      levels = SpecUtils.levelsFor specs
      for level in levels
        SpecUtils.forConsecPairs level, (first, second, i) ->
          constraintName = "level#{level}_constraint#{i}"
          ###
          1.centroid.y + 1.height/2 < 2.centroid.y - 2.height/2
          ###
          coeffs = T(@breadthLabel(first.id), 1, @breadthLabel(second.id), -1)
          rhs = -@breadthFor(first)/2 - @breadthFor(second)/2
          prob.updateConstraint(constraintName, coeffs, rhs)
          prob.objCoeffs.increment @breadthLabel(second.id), 1
          prob.objCoeffs.increment @breadthLabel(first.id), -1

    processDepth: (prob, specs) ->
      table = SpecUtils.tableFor specs
      constraintNum = 0
      recurser = (parent) ->
        for childId in (parent.children || [])
          child = table.get childId
          constraintName = "children#{constraintNum++}"
          ###
          parent.centroid.x + parent.width/2 < child.centroid.x - child.width/2
          ###
          coeffs = T(@depthLabel(parent.id), 1, @depthLabel(childId), -1)
          rhs = -@depthFor(parent)/2 - @depthFor(child)/2
          prob.updateConstraint(constraintName, coeffs, rhs)
          prob.objCoeffs.increment @depthLabel(parent.id), -1
          prob.objCoeffs.increment @depthLabel(childId), 1
          recurser(child)

      for root in SpecUtils.rootsFor specs
        recurser(root)

  return {
    TreeConstrainer: TreeConstrainer
  }
