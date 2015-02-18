ps-module
=========
Intended to be used in creating & validating course module *.meta file for [Pluralsight](http://www.pluralsight.com). Specifically you can do the following things with this package:

- create a module using code
- load the module in YAML format
- save / load the module in XML (conforming to Pluralsight's `*.meta` schema)
- stage the module's assets (slides, demos, questions, clips) to a target folder
- validate the module properties per Pluralsight's requirements

Rather than using traditional callbacks, promises are returned for async calls using the popular [Q](https://github.com/kriskowal/q) promise library.


Installation
------------
Install using NPM:

````
$ npm install ps-module
````


Load Module from YAML Config File
---------------------------------
````javascript
var Module = require('ps-module'),
    path = require('path');

var courseId = 'foo-fundamentals';
var courseModule = {};
var sourcePath = path.join(__dirname, 'fixtures');
var validPath = path.join(sourcePath, 'm1-fooFunModule', 'module.yaml');

Module.loadFromYaml(courseId, validPath)
  .then(function(result) => {
    courseModule = result;
  })
  .catch(function(error) => {
    console.error(error);
  });
````

Load Module from Pluralsight META File
---------------------------------
````javascript
var Module = require('ps-module'),
    path = require('path');

var courseId = 'foo-fundamentals';
var courseModule = {};
var sourcePath = path.join(__dirname, 'fixtures');
var validPath = path.join(sourcePath, 'm1-fooFunModule-psexpected', 'foo-fundamentals-m1.meta');

Module.loadFromMeta(courseId, validPath)
  .then(function(result) => {
    courseModule = result;
  })
  .catch(function(error) => {
    console.error(error);
  });
````

Save Module as Pluralsight META File
---------------------------------
````javascript
var Module = require('ps-module');

var courseModule = new Module();
courseModule.courseId = 'foo-fundamentals';
courseModule = 'm1-fooFunModule';
courseModule.title = 'Introduction to the Foo Framework';
courseModule.description = 'Brief customer facing description of module.';
courseModule.fullPath = 'somePath';
courseModule.clips = ['Introduction', 'API', 'Configuration', 'Security', 'Testing', 'Summary'];

courseModule.createMetaFile(tempBuildPath)
  .then(function(filePath) {
    console.log('File created at: ' + filePath);
  })
  .catch(function(error) {
    console.error(error);
  });
````

Stage Module's Assets to Target Folder
---------------------------------
````javascript
var Module = require('ps-module');

var courseModule = {}; // load or create course module

courseModule.stageDemoFile(tempBuildPath)
  .then(function(filePath) {
    console.log('Demo ZIP file (or no demos text file): ' + filePath);
    return courseModule.stageQuestionsFile(tempBuildPath);
  })
  .then(function(filePath) {
    console.log('Questions file (or no questions file): ' + filePath);
    return courseModule.stageSlidesFile(tempBuildPath);
  })
  .then(function(filePath) {
    console.log('Slides file: ' + filePath);
    return courseModule.stageClips(tempBuildPath);
  })
  .then(function(filePaths) {
    console.log('Module video clips: ' + filePaths);
  })
  .catch(function(error) {
    console.error(error);
  });
````

Check Validity of a Module
---------------------------------
````javascript
var Module = require('ps-module'),
    path = require('path');

var courseId = 'foo-fundamentals';
var sourcePath = path.join(__dirname, 'fixtures');
var validPath = path.join(sourcePath, 'm1-fooFunModule-psexpected', 'foo-fundamentals-m1.meta');

Module.loadFromMeta(courseId, validPath)
  .then(function(courseModule) => {
    var errors = courseModule.validate();
    if (errors && errors.length && errors.length > 0){
      console.log('Validation errors: ' + errors);
    }
  })
  .catch(function(error) => {
    console.error(error);
  });
````

See the tests for full usage.


Development
-----------
The package is written in [TypeScript](http://www.typescriptlang.org), however only the [transpiled](http://en.wikipedia.org/wiki/Source-to-source_compiler) JavaScript is included in the NPM package. In TypeScript development, it's common to use a bunch of `/// <reference path="" />` blocks and the TypeScript compiler generates a source map file that is included at the bottom of the generated JavaScript files. Prior to uploading this to NPM, I've removed these extra comments using a custom [gulp](http://gulpjs.com) task.

If you want to see the full source prior to the "scrubbing" done to prepare for publication to NPM, just get the entire source and run an included gulp task to compile everything.

The type definitions used in the source of this project were acquired from the [DefinitelyTyped](https://github.com/borisyankov/DefinitelyTyped) project. They are all saved in the `tsd.json` file and can be downloaded by running the following:

````
$ tsd reinstall -o
````

[![Analytics](https://ga-beacon.appspot.com/UA-59891462-1/node-ps-module/readme)](https://github.com/igrigorik/ga-beacon)