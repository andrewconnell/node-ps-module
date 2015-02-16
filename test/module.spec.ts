/// <reference path="./../typings/tsd.d.ts" />
/// <reference path="./../app.ts" />

'use strict';

var Q = require('Q');
var os = require('os'),
    fs = require('fs'),
    path = require('path'),
    rimraf = require('rimraf');
var chai = require('chai'),
    expect = chai.expect,
    should = chai.should();
import Module = require('../lib/Module');
import Utils = require('./../lib/Utils');

describe('Module', () => {
  var courseModule,
      sourcePath = path.join(__dirname, 'fixtures'),
      courseId = 'foo-fundamentals',
      courseIdMeta = 'm1-fooFunModule-psexpected',
      moduleIdYaml = 'm1-fooFunModule',
      moduleIdMeta = 'm1-fooFunModule-psexpected';

  before((done) => {
    courseModule = new Module();
    done();
  });

  after((done) => {
    done();
  });

  describe('loadFromYaml()', () => {
    var validPath = path.join(sourcePath, moduleIdYaml, 'module.yaml');
    var inValidPath = path.join(sourcePath, 'xxx');

    beforeEach((done) => {
      Module.loadFromYaml(courseId, validPath)
        .then((result) => {
          courseModule = result;
          done();
        });
    });

    it('will return an object', (done) => {
      expect(courseModule).to.not.be.undefined;
      done();
    });

    it('will return a valid object', (done) => {

      expect(courseModule.courseId).to.not.be.empty;
      expect(courseModule.id).to.not.be.empty;
      expect(courseModule.index).to.be.numeric;
      expect(courseModule.title).to.not.be.empty;
      expect(courseModule.description).to.not.be.empty;
      expect(courseModule.clips).to.not.be.undefined;
      expect(courseModule.fullPath).to.not.be.empty;

      done();
    });

    it('will fail on an invalid path', (done) => {
      Module.loadFromYaml(courseId, inValidPath)
        .then((courseModule) => {
          expect(courseModule).to.be.undefined;
          done();
        })
        .catch((error) => {
          expect(error).to.not.be.undefined;
          done();
        });
    });

    it('will return valid object with courseId', (done) => {

      expect(courseModule.courseId).to.equal(courseId);

      done();
    });

    it('will return valid object with id', (done) => {

      expect(courseModule.id).to.equal('m1-fooFunModule');

      done();
    });

    it('will return valid object with index', (done) => {

      expect(courseModule.index).to.equal(1);

      done();
    });

    it('will return valid object with title', (done) => {

      expect(courseModule.title).to.equal('Introduction to the Foo Framework');

      done();
    });

    it('will return valid object with description without trailing newline', (done) => {

      /*tslint:disable:max-line-length */
      expect(courseModule.description).to.equal('Brief customer facing description of module.');
      /*tslint:enable:max-line-length */

      done();
    });

    it('will return valid object with collection of clips', (done) => {

      expect(courseModule.clips.length).to.be.equal(6);

      done();
    });

    it('will return valid object with fullPath', (done) => {

      expect(courseModule.fullPath).to.equal(path.dirname(validPath));

      done();
    });

  });

  describe('loadFromMeta()', () => {
    var validPath = path.join(sourcePath, courseIdMeta, 'foo-fundamentals-m1.meta');
    var inValidPath = path.join(sourcePath, 'xxx');

    beforeEach((done) => {
      Module.loadFromMeta(courseId, validPath)
        .then((result) => {
          courseModule = result;
          done();
        })
        .catch((error) => {
          courseModule = {};
          done();
        });

    });

    it('will return an object', (done) => {
      expect(courseModule).to.not.be.undefined;
      done();
    });

    it('will return a valid object', (done) => {

      expect(courseModule.courseId).to.not.be.empty;
      expect(courseModule.id).to.not.be.empty;
      expect(courseModule.index).to.be.numeric;
      expect(courseModule.title).to.not.be.empty;
      expect(courseModule.description).to.not.be.empty;
      expect(courseModule.clips).to.not.be.undefined;
      expect(courseModule.fullPath).to.not.be.empty;

      done();
    });

    it('will fail on an invalid path', (done) => {
      Module.loadFromYaml(courseId, inValidPath)
        .then((courseModule) => {
          expect(courseModule).to.be.undefined;
          done();
        })
        .catch((error) => {
          expect(error).to.not.be.undefined;
          done();
        });
    });

    it('will return valid object with courseId', (done) => {

      expect(courseModule.courseId).to.equal(courseId);

      done();
    });

    it('will return valid object with id', (done) => {

      expect(courseModule.id).to.equal(moduleIdMeta);

      done();
    });

    it('will return valid object with index', (done) => {

      expect(courseModule.index).to.equal(1);

      done();
    });

    it('will return valid object with title', (done) => {

      expect(courseModule.title).to.equal('Introduction to the Foo Framework');

      done();
    });

    it('will return valid object with description without trailing newline', (done) => {

      /*tslint:disable:max-line-length */
      expect(courseModule.description).to.equal('Brief customer facing description of module.');
      /*tslint:enable:max-line-length */

      done();
    });

    it('will return valid object with collection of clips', (done) => {

      expect(courseModule.clips.length).to.be.equal(6);

      done();
    });

    it('will return valid object with fullPath', (done) => {

      expect(courseModule.fullPath).to.equal(path.dirname(validPath));

      done();
    });

  });

  describe('createMetaFile()', () => {

    var tempBuildPath:string = '',
        validPath = path.join(sourcePath, moduleIdYaml, 'module.yaml'),
        courseModule:Module;

    beforeEach((done) => {
      // create a temp folder
      tempBuildPath = path.join(os.tmpdir(), 'node-ps-module');
      fs.mkdirSync(tempBuildPath);

      // load the course
      Module.loadFromYaml(courseId, path.join(validPath))
        .then((result) => {
          courseModule = result;
          done();
        });
    });

    afterEach((done) => {
      // remove the temp folder
      rimraf.sync(tempBuildPath);

      done();
    });

    it('will create course meta file', (done) => {
      courseModule.createMetaFile(tempBuildPath)
        .then((filePath) => {
          // ensure path returned in callback
          expect(filePath).to.not.be.undefined;

          // validate the path & file present
          expect(filePath).to.be.a.path;
          expect(filePath).to.be.a.file;

          // validate file created
          expect(path.join(tempBuildPath, courseId + 'm' + courseModule.index + '.meta')).to.be.a.path;

          //todo: check for validity of file contents
        })
        .then(() => {
          done();
        })
        .catch((error) => {
          expect(error).to.be.undefined;
          done();
        });
    });

  });

  describe('validate()', () => {

    beforeEach((done) => {
      courseModule = new Module();
      done();
    });

    it('will fail when the title is too long', (done) => {
      courseModule.title = 'abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyz';

      var results = courseModule.validate();

      expect(results.length).to.be.equal(1);

      done();
    });

    it('will pass when title is within parameters', (done) => {
      courseModule.title = 'abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyz';

      var results = courseModule.validate();

      expect(results.length).to.be.equal(0);

      done();
    });

  });

  describe('stageDemoFile()', () => {
    var tempBuildPath = '';

    beforeEach((done) => {
      courseModule = new Module();

      // create temp folder
      tempBuildPath = path.join(os.tmpdir(), 'node-ps-module');
      fs.mkdirSync(tempBuildPath);

      Module.loadFromYaml(courseId, path.join(sourcePath, moduleIdYaml, 'module.yaml'))
        .then((result) => {
          courseModule = result;

          done();
        });
    });

    afterEach((done) => {
      // remove the temp folder
      rimraf.sync(tempBuildPath);

      done();
    });

    it('will create no-demos.txt when no demos present', (done) => {
      var validModulePath = path.join(sourcePath, 'm3-fooFunModule', 'module.yaml');

      // load the module
      Module.loadFromYaml(courseId, validModulePath)
        .then((courseModule) => {
          // create the file
          return courseModule.stageDemoFile(tempBuildPath)
        })
        .then((filePath) => {
          // ensure path returned in callback
          expect(filePath).to.not.be.undefined;

          // validate the path & file present
          expect(filePath).to.be.a.path;
          expect(filePath).to.be.a.file;
        })
        .then(() => {
          done();
        })
        .catch((error) => {
          expect(error).to.be.undefined;
          done();
        });
    });

    it('will create demos.zip when demos present', (done) => {
      var validModulePath = path.join(sourcePath, moduleIdYaml, 'module.yaml');
      Module.loadFromYaml(courseId, validModulePath)
        .then((courseModule) => {
          // create the file
          return courseModule.stageDemoFile(tempBuildPath);
        })
        .then((filePath) => {
          // ensure path returned in callback
          expect(filePath).to.not.be.undefined;

          // validate the path & file present
          expect(filePath).to.be.a.path;
          expect(filePath).to.be.a.file;
        })
        .then(() => {
          done();
        })
        .catch((error) => {
          expect(error).to.be.undefined;
          done();
        });
    });

  });

  describe('stageQuestionFile()', () => {
    var tempBuildPath = '';

    beforeEach((done) => {
      courseModule = new Module();

      // create temp folder
      tempBuildPath = path.join(os.tmpdir(), 'node-ps-module');
      fs.mkdirSync(tempBuildPath);

      Module.loadFromYaml(courseId, path.join(sourcePath, moduleIdYaml, 'module.yaml'))
        .then((result) => {
          courseModule = result;

          done();
        });
    });

    afterEach((done) => {
      // remove the temp folder
      rimraf.sync(tempBuildPath);

      done();
    });

    it('will copy the questions.txt', (done) => {
      // stage questions.txt file
      courseModule.stageQuestionsFile(tempBuildPath)
        .then(function(filePath) {
          // ensure path returned in callback
          expect(filePath).to.not.be.undefined;

          // check valid path
          expect(filePath).to.be.a.path;

          // check file was created
          expect(path.join(tempBuildPath, 'questions.txt')).to.be.equal(filePath);
        })
        .then(() => {
          done();
        })
        .catch(function(error) {
          expect(error).to.be.undefined;
          done();
        });
    });

    it('will copy the no-questions.txt', (done) => {
      var validModulePath = path.join(sourcePath, 'm4-fooFunModule', 'module.yaml');
      Module.loadFromYaml(courseId, validModulePath)
        .then((courseModule) => {
          // stage questions.txt file
          return courseModule.stageQuestionsFile(tempBuildPath);
        })
        .then(function(filePath) {
          // ensure path returned in callback
          expect(filePath).to.not.be.undefined;

          // check valid path
          expect(filePath).to.be.a.path;

          // check file was created
          expect(path.join(tempBuildPath, 'no-questions.txt')).to.be.equal(filePath);
        })
        .then(() => {
          done();
        })
        .catch(function(error) {
          expect(error).to.be.undefined;
          done();
        });
    });
  });

  describe('stageSlidesFile()', () => {
    var tempBuildPath = '';

    beforeEach((done) => {
      courseModule = new Module();

      // create temp folder
      tempBuildPath = path.join(os.tmpdir(), 'node-ps-module');
      fs.mkdirSync(tempBuildPath);

      Module.loadFromYaml(courseId, path.join(sourcePath, moduleIdYaml, 'module.yaml'))
        .then((result) => {
          courseModule = result;

          done();
        });
    });

    afterEach((done) => {
      // remove the temp folder
      rimraf.sync(tempBuildPath);

      done();
    });

    it('will copy the slides.pptx', (done) => {
      // stage slides.pptx file
      courseModule.stageSlidesFile(tempBuildPath)
        .then((filePath) => {
          // ensure path returned in callback
          expect(filePath).to.not.be.undefined;

          // check valid path
          expect(filePath).to.be.a.path;

          // check file was created
          expect(path.join(tempBuildPath, 'slides.pptx')).to.be.equal(filePath);
        })
        .then(() => {
          done();
        })
        .catch((error) => {
          expect(error).to.be.undefined;
          done();
        });
    });
  });

  describe('stageClips()', () => {
    var tempBuildPath = '',
        clipsSourcePath = '';

    beforeEach((done) => {
      courseModule = new Module();

      // create temp folder
      tempBuildPath = path.join(os.tmpdir(), 'node-ps-module');
      fs.mkdirSync(tempBuildPath);

      // load module
      Module.loadFromYaml(courseId, path.join(sourcePath, moduleIdYaml, 'module.yaml'))
        .then((result) => {
          courseModule = result;

          done();
        });

      // set clip path
      clipsSourcePath = path.join(sourcePath, 'clips');
    });

    afterEach((done) => {
      // remove the temp folder
      rimraf.sync(tempBuildPath);

      done();
    });

    it('will copy clips for a module', (done) => {

      // stage all clips file
      courseModule.stageClips(tempBuildPath, clipsSourcePath)
        .then((filePaths) => {
          // ensure paths returned in callback
          expect(filePaths).to.not.be.undefined;

          // for each path returned
          filePaths.forEach((element) => {
            // check valid path
            expect(element).to.be.a.path;
            // check that the file is there
          });

          return Q(true);
        })
        .then(() => {
          done();
        })
        .catch((error) => {
          expect(error).to.be.undefined;
          done();
        });
    });

    it('will create correct file names for clips for a module', (done) => {
      // stage all clips files
      courseModule.stageClips(tempBuildPath, clipsSourcePath)
        .then((filePaths) => {
          // look at all clips in the module & for each one...
          courseModule.clips.forEach((moduleClip, index) => {
            // todo need to make the file extension dynamic (not everyone submits mp4 files)
            // determine the new file name...
            var clipTargetName = 'foo-fundamentals-m1-' + Utils.padLeadingZeros(2, index + 1) + '.mp4',
                clipTargetFullPath = path.join(tempBuildPath, clipTargetName);

            // ... & verify it is present in the filePaths returned
            expect(filePaths.indexOf(clipTargetFullPath)).to.be.greaterThan(-1);

            // ... as well as in the temp build folder
            expect(fs.existsSync(clipTargetFullPath)).to.be.true;
          });

          return Q(true);
        })
        .then(() => {
          done();
        })
        .catch((error) => {
          expect(error).to.be.undefined;
          done();
        });
    });
  })
});