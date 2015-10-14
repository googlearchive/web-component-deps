#!/usr/bin/env node
/**
 * @license
 * Copyright (c) 2015 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */
// jshint node:true
'use strict';
var WebComponentDeps = require('../wcd');
var cliArgs = require("command-line-args");
var fs = require('fs');
var path = require('path');

var cli = cliArgs([
  {
    name: "help",
    type: Boolean,
    alias: "h",
    description: "Print usage."
  },
  {
    name: "bowerdir",
    type: String,
    alias: "b",
    description: "Bower components directory. Defaults to 'bower_components'",
    defaultValue: "bower_components"
  },
  {
    name: "root",
    type: String,
    defaultValue: process.cwd(),
    alias: "r",
    description: (
      "Root directory against which URLs of endpoints and HTML imports are " +
      "resolved. If not specified, then the current working directory is used."
    )
  },
  {
    name: "input",
    type: String,
    alias: "i",
    defaultOption: true,
    multiple: true,
    description: "Input file(s) to print dependencies of."
  },
  {
    name: "output",
    type: String,
    alias: "o",
    defaultValue: "",
    description: "File to write output to. If undefined, output goes to stdout."
  },
  {
    name: "sharing_threshold",
    type: Number,
    alias: "s",
    defaultValue: 1,
    description: (
      "Number of endpoints an import must be found in to be printed as a " +
      "shared dependency. For example, 2 will include all imports found " +
      "in at least 2 endpoints, and 1 will include all dependencies of any " +
      "endpoint. Defaults to 1."
    )
  }
]);

var usage = cli.getUsage({
  header: "web-component-deps prints shared webcomponent deps",
  title: "wcd"
});

var options = cli.parse();

if (options.help) {
  console.log(usage);
  process.exit(0);
}

// Make sure resolution has a path segment to drop.
// According to URL rules,
// resolving index.html relative to /foo/ produces /foo/index.html, but
// resolving index.html relative to /foo produces /index.html
// is different from resolving index.html relative to /foo/
// This removes any ambiguity between URL resolution rules and file path
// resolution which might lead to confusion.
if (options.root !== '' && !/[\/\\]$/.test(options.root)) {
  options.root += '/';
}

var endpoints = options.input;

if (!endpoints || !endpoints.length) {
  console.error('Missing input polymer path');
  console.log(usage);
  process.exit(-1);
}

var writeOutput;
var finish;
if (options.output && options.output.length > 0) {
  var fd = fs.openSync(options.output, 'w');
  writeOutput = function(data) {
    fs.writeSync(fd, data + "\n");
  };
  finish = function() {
    fs.closeSync(fd);
  }
} else {
  writeOutput = function(data) {
    console.log(data);
  };
  finish = function() {
  }
}

var deps = new WebComponentDeps(options);
deps.deps().then(function(deps){
  deps.forEach(function(dep){
    writeOutput(dep);
  });
}).catch(function(err){
  console.error(err.stack);
}).then(finish);
