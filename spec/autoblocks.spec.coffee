SRCDIR = '../src/'

require [SRCDIR+'autoblocks', SRCDIR+'specutils', 'underscore', 'util', './mersenne-twister'], 
(Autoblocks, SpecUtils, _, util, MersenneTwister) ->
  describe 'autoblocks', ->
    # inst is the default instance, it can be overridden in suites
    inst = null
    beforeEach ->
      inst = Autoblocks.create()
      @addMatchers
        toDeepEqual: (expected) -> _.isEqual(this.actual, expected)
        toHaveMethod: (method) ->
          return _.isFunction(this.actual[method])
        toCollide: -> 
          n = if @isNot then "not " else ""
          collision = SpecUtils.collide @actual
          ids = _(collision || @actual).pluck 'id'
          @message = -> "Expected specs for #{ids} #{n}to collide."
          return collision
        toHaveNaNValues: ->
          n = if @isNot then "not " else ""
          reducer = (memo, val, key) -> 
            if isNaN(val) then memo[key] = val
            return memo
          res = _(@actual).reduce reducer, {}
          @message = -> "Expected keys/indices #{_(res).keys()} #{n}to be NaN."
          return _(res).size() > 0
        toHaveKey: (key) ->
          return _(@actual).has key

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
          expect(c).toHaveMethod 'updatesFrom'

        it "#{constrainerName} should handle a blank spec list", ->
          c = new Constrainer
          prob = c.problemFor([])
          expect(prob.vars.empty()).toEqual true
          expect(prob.objCoeffs.empty()).toEqual true

    describe 'treeExamples', ->
      m = new MersenneTwister(123)
      generateBigTree = (size) ->
        specs = []
        for i in [1..size]
          parent = _(SpecUtils.pickRandom specs, 1, m).first()
          curr = {id:"id#{i}"}
          curr.width = Math.floor m.random()*10 + 10
          curr.height = Math.floor m.random()*10 + 10
          specs.push curr
          if parent? then (parent.children ||= []).push curr.id
        # console.log specs
        return specs

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
        big1: generateBigTree(10)
        big2: generateBigTree(10)
        big3: generateBigTree(15)

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
            objValues = []
            prob.solve
              onMessage: (msg, details) ->
                if msg == 'updateProblem'
                  [vars, obj] = details
                  objValues.push obj
              randomizePerturbations: false

            expect(prob.vars.data).not.toHaveNaNValues()

            if specs.length > 1
              nonzero = _(prob.vars.data).chain()
                .values().any((val) -> val > 0).value()
              # expect(nonzero).toBe true

            # console.log objValues
            # console.log util.inspect prob, false, 10, true
            # console.log ''
            # console.log specs
            # console.log util.inspect prob.constraints.data, false, 10, true

      describe 'full', ->
        _(exampleSpecs).each (specs, name) ->
          it "#{name} does full updates", ->
            specs = _.clone(specs)
            inst.bind specs
            inst.update()

            _(specs).all (spec) -> expect(spec).toHaveKey 'centroid'
            if specs.length > 1
              nonzero = _(specs).any (spec) -> 
                spec.centroid.x > 0 || spec.centroid.y > 0
              expect(nonzero).toBe true

            expect(_(specs).map (spec) -> spec.centroid.x).not.toHaveNaNValues()
            expect(_(specs).map (spec) -> spec.centroid.y).not.toHaveNaNValues()
            expect(specs).not.toCollide()

            util.puts SpecUtils.drawToString specs, 80

