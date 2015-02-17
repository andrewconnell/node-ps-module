/// <reference path="./../typings/tsd.d.ts" />
/// <reference path="./../app.ts" />
'use strict';
var Q = require('q');
var os = require('os'), path = require('path'), fs = require('fs'), fse = require('fs-extra'), rimraf = require('rimraf');
var crypto = require('crypto');
var yaml = require('js-yaml');
var XMLWriter = require('xml-writer'), Xml2Js = require('xml2js');
var Utils = require('./Utils');
var archiver = require('archiver');
var Module = (function () {
    function Module() {
        /**
         * Course object that this module belongs to.
         *
         * @type {string}
         */
        this.courseId = '';
        /**
         * Internal code of the module used as the filename & referenced in the course config file.
         *
         * @type {string}
         */
        this.id = '';
        /**
         * Number of the module within the course.
         *
         * @type {number}
         */
        this.index = 0;
        /**
         * Title of the module.
         *
         * @type {string}
         */
        this.title = '';
        /**
         * Verbose description of the module.
         *
         * @type {string}
         */
        this.description = '';
        /**
         * Sorted collection of clips within the module.
         *
         * @type {string[]}
         */
        this.clips = [];
        /**
         * Fully qualified path to the module folder.
         * @type {string}
         */
        this.fullPath = '';
    }
    /**
     * Creates the module's metadata file for submission to Pluralsight.
     *
     * @param {string} buildPath    Fully qualified directory path (without the filename) where to build the metadata file.
     * @returns {Q.Promise<string>} Fully qualified path of the file that was created.
     */
    Module.prototype.createMetaFile = function (buildPath) {
        var self = this;
        var deferred = Q.defer();
        try {
            var metaDataFilePath = path.join(buildPath, self.courseId + '-m' + self.index + '.meta');
            // create the xml writer
            var metaFileStream = fs.createWriteStream(metaDataFilePath);
            metaFileStream.on('close', function () {
                deferred.resolve(metaDataFilePath);
            });
            var xmlWriter = new XMLWriter(true, function (contents, encoding) {
                metaFileStream.write(contents, encoding);
            });
            // write head of the document
            var xmlModule = xmlWriter.startDocument('1.0', 'utf-8').startElement('module').writeAttribute('xmlns', 'http://pluralsight.com/sapphire/module/2007/11');
            //TODO: remove hardcoded author
            // add author, title & description
            xmlModule.writeElement('author', 'andrew-connell');
            xmlModule.writeElement('title', self.title);
            xmlModule.writeElement('description', self.description);
            // add clips
            xmlModule.startElement('clips');
            self.clips.forEach(function (element, index) {
                var clipFilename = self.courseId + '-m' + self.index + '-' + Utils.padLeadingZeros(2, index + 1) + '.mp4';
                // add clip
                xmlModule.startElement('clip').writeAttribute('href', clipFilename).writeAttribute('title', element).endElement();
            });
            xmlModule.endElement(); // </clips>
            xmlModule.endElement(); // </module>
            // close the stream & save it
            metaFileStream.end();
        }
        catch (error) {
            deferred.reject(error);
        }
        return deferred.promise;
    };
    /**
     * Create a demo.zip or no-demos.txt in the target staging for the module.
     *
     * @param {string}        buildPath   Fully qualified path where the build files should be staged.
     * @returns {Q.Promise<{string}>}     Fully qualified path there where the file was created.
     */
    Module.prototype.stageDemoFile = function (buildPath) {
        var self = this, deferred = Q.defer(), fullPath = '';
        var demoBeforeFolder = path.join(self.fullPath, "ExBefore"), demoAfterFolder = path.join(self.fullPath, "ExAfter");
        var demoBeforeExists = false, demoAfterExists = false;
        // check if there are demo files... if not, write no-demos.txt to staging folder
        if (!fs.existsSync(demoBeforeFolder) && !fs.existsSync(demoAfterFolder)) {
            fullPath = path.join(buildPath, 'no-demos.txt');
            // write empty no-demos.txt file
            Q.denodeify(fs.writeFile)(fullPath, '').then(function () {
                deferred.resolve(fullPath);
            }).catch(function (error) {
                deferred.reject(error);
            });
        }
        else {
            // determine if before / after folder exist
            if (fs.existsSync(demoBeforeFolder)) {
                demoBeforeExists = true;
            }
            if (fs.existsSync(demoAfterFolder)) {
                demoAfterExists = true;
            }
            // get a temp location
            var tempBuildPath = path.join(os.tmpdir(), 'demo-staging-' + crypto.randomBytes(4));
            fs.mkdirSync(tempBuildPath);
            // copy both after & before folders => this location but rename to remove the "ex" prefix
            if (demoBeforeExists) {
                fse.copySync(demoBeforeFolder, path.join(tempBuildPath, 'Before').toLowerCase());
            }
            if (demoAfterExists) {
                fse.copySync(demoAfterFolder, path.join(tempBuildPath, 'After').toLowerCase());
            }
            // zip both files straight => build target
            var output = fs.createWriteStream(path.join(buildPath, 'demos.zip'));
            var archive = archiver('zip');
            output.on('close', function () {
                // cleanup temp location
                Q.denodeify(rimraf)(tempBuildPath).then(function () {
                    deferred.resolve(output.path);
                });
            });
            archive.on('error', function (error) {
                deferred.reject(error);
            });
            archive.pipe(output);
            archive.bulk([
                { expand: true, cwd: path.join(tempBuildPath, 'Before').toLowerCase(), src: ['**'], dest: 'before' },
                { expand: true, cwd: path.join(tempBuildPath, 'After').toLowerCase(), src: ['**'], dest: 'after' }
            ]);
            archive.finalize();
        }
        return deferred.promise;
    };
    /**
     * Copies the existing questions.txt or no-questions.txt form the module to the staging location.
     *
     * @param {string}          buildPath   Path where the file should be created.
     * @returns {Q.Promise<{string}>}       Fully qualified path where the file was copied to.
     */
    Module.prototype.stageQuestionsFile = function (buildPath) {
        var self = this, deferred = Q.defer(), copyFile = Q.denodeify(fse.copy);
        if (fs.existsSync(path.join(self.fullPath, 'questions.txt'))) {
            copyFile(path.join(self.fullPath, 'questions.txt'), path.join(buildPath, 'questions.txt')).then(function () {
                deferred.resolve(path.join(buildPath, 'questions.txt'));
            }).catch(function (error) {
                deferred.reject(error);
            });
        }
        else if (fs.existsSync(path.join(self.fullPath, 'no-questions.txt'))) {
            copyFile(path.join(self.fullPath, 'no-questions.txt'), path.join(buildPath, 'no-questions.txt')).then(function () {
                deferred.resolve(path.join(buildPath, 'no-questions.txt'));
            }).catch(function (error) {
                deferred.reject(error);
            });
        }
        else {
            deferred.reject(new Error('Neither questions.txt or no-questions.txt were found.'));
        }
        return deferred.promise;
    };
    /**
     * Copies the existing slides.pptx form the module to the staging location.
     *
     * @param {string}          buildPath   Path where the file should be created.
     * @returns {Q.Promise<{string}>}       Fully qualified path where the file was copied to.
     */
    Module.prototype.stageSlidesFile = function (buildPath) {
        var self = this, deferred = Q.defer(), copyFile = Q.denodeify(fse.copy);
        // copy slides => staging location
        var sourcePath = path.join(self.fullPath, 'slides.pptx'), targetPath = path.join(buildPath, 'slides.pptx');
        copyFile(sourcePath, targetPath).then(function () {
            deferred.resolve(targetPath);
        }).catch(function (error) {
            deferred.reject(error);
        });
        return deferred.promise;
    };
    /**
     * Stage all clips in the module.
     *
     * @param {string}          buildPath   Path where the file should be created.
     * @param {string}          clipSource  Fully qualified path where the video clips are found.
     * @returns {Q.Promise<{[string]}>}     Array of fully qualified paths where the clips were copied to.
     */
    Module.prototype.stageClips = function (buildPath, clipSource) {
        var self = this, deferred = Q.defer(), copyFile = Q.denodeify(fse.copy);
        var targetClips = [];
        var promises = [];
        // loop through all the clips...
        self.clips.forEach(function (moduleClip, clipIndex) {
            // todo: need to be dynamic and not just MP4 as some may use WMV
            // get source filename
            var sourceClipName = self.id + '-' + Utils.padLeadingZeros(2, clipIndex + 1) + '.mp4', sourceClipFullPath = path.join(clipSource, sourceClipName);
            // generate new filename
            var targetClipName = self.courseId + '-m' + self.index + '-' + Utils.padLeadingZeros(2, clipIndex + 1) + '.mp4', targetClipFullPath = path.join(buildPath, targetClipName);
            targetClips.push(targetClipFullPath);
            // setup promise for the file
            promises.push(copyFile(sourceClipFullPath, targetClipFullPath));
        });
        // run all the questions
        Q.all(promises).then(function () {
            deferred.resolve(targetClips);
        }).catch(function (error) {
            console.log(error);
            deferred.reject(error);
        });
        return deferred.promise;
    };
    /**
     * Validates the title of a module. Specifically looks at the length of the string & that it
     * does not exceed the value set in the config.
     *
     * @returns {string[]}         Array of validation errors if any found.
     */
    Module.prototype.validate = function () {
        var self = this;
        var results = [];
        //TODO refactor hard coded value to config
        var MODULE_TITLE_MAX_LENGTH = 65;
        var CLIP_TITLE_MAX_LENGTH = 65;
        // check module title
        if (!self.title) {
            results.push('Module title missing.');
        }
        else if (self.title.length > MODULE_TITLE_MAX_LENGTH) {
            results.push('Module title length (' + self.title.length + ') invalid. Must be less than ' + MODULE_TITLE_MAX_LENGTH);
        }
        // check clip titles
        if (!self.clips) {
            results.push('Module clips missing.');
        }
        else {
            self.clips.forEach(function (clip, index) {
                if (clip.length > CLIP_TITLE_MAX_LENGTH) {
                    results.push('Clip #' + index + ' title length (' + clip.length + ') invalid. Must be less than ' + CLIP_TITLE_MAX_LENGTH);
                }
            });
        }
        return results;
    };
    /////////     STATIC METHODS     ///////////////////////////////
    /**
     * Loads a module object from a YAML configuration file. It will also add in the fully qualified
     * path & id of the module as a property and also clean out the newlines in the description.
     *
     * @param {string}     courseId     Course ID the module belongs to.
     * @param {string}     fullPath     Fully qualified path to the module folder.
     * @returns {Q.Promise<Module>}     Module object loaded from the YAML config file.
     */
    Module.loadFromYaml = function (courseId, fullPath) {
        var deferred = Q.defer();
        if (!fs.existsSync(fullPath)) {
            deferred.reject(new Error('Path not valid: ' + fullPath));
        }
        else {
            try {
                var courseModule = new Module();
                // read in the file
                var doc = yaml.safeLoad(fs.readFileSync(fullPath, 'utf8'));
                // set course ID for this module
                courseModule.courseId = courseId;
                // load properties
                courseModule.fullPath = path.dirname(fullPath);
                courseModule.title = doc.module.title.replace('\n', '');
                courseModule.description = doc.module.description.replace('\n', '');
                courseModule.clips = doc.module.clips;
                // get the module id & add to the object
                var pathBrokenUp = fullPath.split(path.sep);
                courseModule.id = pathBrokenUp[pathBrokenUp.length - 2];
                // set correct module index based on ID
                var moduleId = courseModule.id.split('-')[0].substr(1);
                courseModule.index = parseInt(moduleId.replace('m', ''));
                // set module to instance of this object
                deferred.resolve(courseModule);
            }
            catch (error) {
                throw new Error(error);
            }
        }
        return deferred.promise;
    };
    /**
     * Loads a module object from a *.meta (XML) configuration file. It will also add
     * in the fully qualified path & id of the module as a property and also clean
     * out the newlines in the descriptions.
     *
     * @param {string}     courseId     Course ID the module belongs to.
     * @param {string}    fullPath      Fully qualified path to the module META file.
     * @returns {Q.Promise<Module>}     Module object loaded from the META config file.
     */
    Module.loadFromMeta = function (courseId, fullPath) {
        var deferred = Q.defer();
        if (!fs.existsSync(fullPath)) {
            deferred.reject(new Error('Path not valid: ' + fullPath));
        }
        else {
            // read in the file
            var parser = new Xml2Js.Parser();
            var parseString = Q.denodeify(parser.parseString);
            parseString(fs.readFileSync(fullPath, 'utf8')).then(function (doc) {
                var courseModule = new Module();
                // set course ID for this module
                courseModule.courseId = courseId;
                // load properties
                courseModule.fullPath = path.dirname(fullPath);
                courseModule.title = doc.module.title[0];
                courseModule.description = doc.module.description[0].replace('\n', '');
                // convert topics => array
                var clips = doc.module.clips[0].clip;
                if (clips && clips.length > 0) {
                    clips.forEach(function (element, index) {
                        courseModule.clips.push(clips[index]);
                    });
                }
                // get the module id & add to the object
                var pathBrokenUp = fullPath.split(path.sep);
                courseModule.id = pathBrokenUp[pathBrokenUp.length - 2];
                // set correct module index based on ID
                var moduleId = courseModule.id.split('-')[0].substr(1);
                courseModule.index = parseInt(moduleId.replace('m', ''));
                return Q(courseModule);
            }).then(function (courseModule) {
                deferred.resolve(courseModule);
            }).catch(function (error) {
                deferred.reject(error);
            });
        }
        return deferred.promise;
    };
    return Module;
})();
module.exports = Module;
//# sourceMappingURL=module.js.map