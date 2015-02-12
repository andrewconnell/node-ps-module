ps-module
=========
Intended to be used in creating & validating course module *.meta file for [Pluralsight](http://www.pluralsight.com). Specifically you can do the following things with this package:

- create a module using code
- load the module in YAML format
- save / load the module in XML (conforming to Pluralsight's `*.meta` schema)
- validate the module properties per Pluralsight's requirements

Rather than using traditional callbacks, promises are returned for async calls using the popular [Q](https://github.com/kriskowal/q) promise library.


Installation
------------
Install using NPM:

````
$ npm install ps-module
````

> add usage

See the tests for full usage.


Development
-----------
The package is written in [TypeScript](http://www.typescriptlang.org), however only the [transpiled](http://en.wikipedia.org/wiki/Source-to-source_compiler) JavaScript is included in the NPM package. In TypeScript development, it's common to use a bunch of `/// <reference path="" />` blocks and the TypeScript compiler generates a source map file that is included at the bottom of the generated JavaScript files. Prior to uploading this to NPM, I've removed these extra comments using a custom [gulp](http://gulpjs.com) task.

If you want to see the full source prior to the "scrubbing" done to prepare for publication to NPM, just get the entire source and run an included gulp task to compile everything.

The type definitions used in the source of this project were acquired from the [DefinitelyTyped](https://github.com/borisyankov/DefinitelyTyped) project. They are all saved in the `tsd.json` file and can be downloaded by running the following:

````
$ tsd reinstall -o
````