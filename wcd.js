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
var hydrolysis = require('hydrolysis');
var url = require('url');
var Promise = require('es6-promise').Promise;

var WebComponentDeps = function WebComponentDeps(options){
  this.root = options.root;
  this.endpoints = options.input;
  this.bowerdir = options.bowerdir;
  this.shared_import = options.shared_import;
  this.sharing_threshold = options.sharing_threshold;
};


WebComponentDeps.prototype = {
  _getOptions: function() {
    var options = {};
    options.attachAST = true;
    options.filter = function(){
      return false;
    };
    options.redirect = this.bowerdir;
    options.root = this.root;
    return options;
  },
  _getFSResolver: function() {
    return new hydrolysis.FSResolver(this._getOptions());
  },
  _getAnalyzer: function(endpoint) {
    return hydrolysis.Analyzer.analyze(endpoint, this._getOptions());
  },
  _getDeps: function _getDeps(endpoint) {
    return this._getAnalyzer(endpoint).then(function(analyzer){
      return analyzer._getDependencies(endpoint);
    }).catch(function(err){
      console.log(err);
      console.log("FAILED IN GETDEPS");
    });
  },
  _getCommonDeps: function _getCommonDeps() {
    var endpointDeps = [];
    for (var i = 0; i < this.endpoints.length; i++) {
      endpointDeps.push(this._getDeps(this.endpoints[i]));
    }
    return Promise.all(endpointDeps).then(function(allEndpointDeps){
      var common = {};
      allEndpointDeps.forEach(function(endpointDepList){
        endpointDepList.forEach(function(dep){
          if (!common[dep]) {
            common[dep] = 1;
          } else {
            common[dep] += 1;
          }
        });
      });
      var depsOverThreshold = [];
      for (var dep in common) {
        if (common[dep] >= this.sharing_threshold) {
          depsOverThreshold.push(dep);
        }
      }
      return depsOverThreshold;
    }.bind(this));
  },
  deps: function deps() {
    return this._getCommonDeps();
  }
};

module.exports = WebComponentDeps;
