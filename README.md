autoblocks.js
=============

*Autoblocks.js* makes it easy to create _dynamic_ graphs or trees
of HTML elements that magically rearrange themselves on the fly
as new elements are added, dimensions are changed, or
relationships are added. These relationships can be trivially
specified by adding classes to elements, or by linking
Autoblocks.js to a Backbone.js collection whose model attributes
specify parent-child relationships. This library can be run in
Node.js or in any reasonably performant browser 
(Chrome and Firefox tested).

Autoblocks.js is licensed under the LGPL v2.1, so it can be used
alongside proprietary (obfuscated) Javascript code.
However, any published modifications to this library itself, or its
components, must be released under the LGPL or GPL v2 or v3.

### Implementation

Autoblocks.js accomplishes this with the first-ever Javascript
implementation of a *linear program optimizer*, which optimizes
a simple objective function subject to a set of constraints.
HTML elements or Backbone models are translated into these
constraints by customizable "Binders" and "Constrainers", 
and the solution of the linear program updates the locations in a deterministic way.

The specific algorithm implemented in src/lp.js is the 
parametric self-dual simplex method presented in Chapter 7 of
Robert J. Vanderbei's _Linear Programming: Foundations and Extensions_,
which can be downloaded at 
[an archived version of the author's website][1].
Note that this implementation did not use the source code provided
on Prof. Vanderbei's website as a reference, as its 
licensing requirements are unclear. Autoblocks makes use of the 
[Sylvester linear algebra library][2].

Note that much of the source code is written in CoffeeScript.

### Testing

[Jasmine][3] is used for testing.

In the main directory:

    node node_modules/jasmine-node/lib/jasmine-node/cli.js --runWithRequireJs --verbose .

[1]: http://web.archive.org/web/20061217004330/http://www.princeton.edu/~rvdb/LPbook/online.html
[2]: http://sylvester.jcoglan.com/
[3]: http://pivotal.github.com/jasmine/
