if (typeof define != 'function' && module)
  define = require('amdefine')(module)

SRCDIR = '../../../../src/' # TODO: this is a horrid hack

define [SRCDIR+'autoblocks', 'underscore'], (Autoblocks, _) ->
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
