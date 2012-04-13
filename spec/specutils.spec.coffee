if (typeof define != 'function' && module)
  define = require('amdefine')(module)

SRCDIR = '../../../../src/' # TODO: this is a horrid hack

define [SRCDIR+'specutils', 'underscore'], (SpecUtils, _) ->

  describe 'specutils pairs', ->
    source = ['a','b','c']
    spy = null
    beforeEach ->
      spy = jasmine.createSpy()

    it 'should have definitions', ->
      expect(SpecUtils.forConsecPairs).toBeDefined()
      expect(SpecUtils.forAllPairs).toBeDefined()

    it 'should perform forConsecPairs', ->
      SpecUtils.forConsecPairs source, spy
      expect(spy.argsForCall).toEqual [['a','b',0,1],['b','c',1,2]]

    it 'should perform forAllPairs no order', ->
      SpecUtils.forAllPairs source, spy
      expect(spy.argsForCall).toEqual [
        ['a','b',0,1], ['a','c',0,2], ['b','c',1,2]
      ]

    it 'should perform forAllPairs ordered', ->
      SpecUtils.forAllPairs source, spy, true
      expect(spy.argsForCall).toEqual [
        ['a','b',0,1], ['a','c',0,2],
        ['b','a',1,0], ['b','c',1,2],
        ['c','a',2,0], ['c','b',2,1]
      ]
