SRCDIR = '../src/'

require [SRCDIR+'autoblocks', SRCDIR+'specutils', 'underscore', 'util'], (Autoblocks, SpecUtils, _, util) ->
  describe 'autoblocks', ->
    # inst is the default instance, it can be overridden in suites
    inst = null
    beforeEach ->
      inst = Autoblocks.create()
      @addMatchers
        toDeepEqual: (expected) -> _.isEqual(this.actual, expected)
        toHaveMethod: (method) ->
          return _.isFunction(this.actual[method])

    describe 'instance', ->
      it 'should not be null', ->
        expect(inst).toBeDefined()
        expect(inst).not.toBeNull()

    describe 'binders', ->
      it 'instance should have ObjectBinder as default', ->
        expect(inst.binder.constructor).toEqual Autoblocks.Binders.ObjectBinder

      for own binderName, Binder of Autoblocks.Binders
        it "#{binderName} should follow the interface", ->
          binder = new Binder
          expect(binder).toHaveMethod 'bind'
          expect(binder).toHaveMethod 'specs'
          expect(binder).toHaveMethod 'onUpdates'


      it "ObjectBinder should update on updates", ->
        binder = new Autoblocks.Binders.ObjectBinder
        obj =
          id: "foo"
          centroid: {x:1, y:2}
          width:3
          height:4
        binder.bind obj
        binder.onUpdates [{id:"foo", centroid:{x:5,y:6}}]
        expect(obj.centroid.x).toEqual(5)
        expect(obj.centroid.y).toEqual(6)

    describe 'constrainers', ->
      for own constrainerName, Constrainer of Autoblocks.Constrainers
        it "#{constrainerName} should follow the interface", ->
          c = new Constrainer
          expect(c).toHaveMethod 'problemFor'

        it "#{constrainerName} should handle a blank spec list", ->
          c = new Constrainer
          prob = c.problemFor([])
          expect(prob.vars.empty()).toEqual true
          expect(prob.objCoeffs.empty()).toEqual true

    describe 'treeExamples', ->
      exampleSpecs =
        empty: []
        singleNode: [
          {id:'foo', width:20, height:30}
        ]
        parallelRoots: [
          {id:'foo', width:5, height:10},
          {id:'bar', width:10, height:20}
        ]
        parentChild: [
          {id:'foo', width:20, height:30, children:['bar']},
          {id:'bar', width:40, height:10}
        ]
        complicated: [
          {id:'foo', width:20, height:30, children:['bar','baz']},
          {id:'bar', width:40, height:10},
          {id:'baz', width:10, height:40, children:['bazz']},
          {id:'bazz', width:30, height:30}
        ]

      describe 'constrainer', ->
        Constrainer = Autoblocks.Constrainers.TreeConstrainer

        _(exampleSpecs).each (specs, name) ->
          it "#{name} was setup", ->
            c = new Constrainer
            prob = c.problemFor specs
            expect(prob.vars.keys.length).toBe (specs.length*2)
            # console.log util.inspect prob, false, 10, true

          it "#{name} is solvable", ->
            c = new Constrainer
            prob = c.problemFor specs
            # objValues = []
            prob.solve
              # onMessage: (msg, details) ->
              #   if msg == 'updateProblem'
              #     [vars, obj] = details
              #     objValues.push obj
              randomizePerturbations: true

            prob.vars.forEach (key, val) ->
              expect(isNaN(val)).toBe false

            # console.log objValues, prob.vars
            # console.log util.inspect prob, false, 10, true
            # console.log prob.objective

      describe 'full', ->
        for own name, specs of exampleSpecs
          it "#{name} does full updates", ->

