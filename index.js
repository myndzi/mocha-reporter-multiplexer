'use strict';

var Base = require('mocha/lib/reporters/base'),
    EventEmitter = require('events').EventEmitter,
    format = require('util').format;

var runnerEvents = [ 'start', 'pass', 'pending', 'fail', 'end', 'hook', 'hook end', 'suite', 'suite end', 'test', 'test end', 'test group' ];
var _process = process;

var PassThrough = require('stream').PassThrough;

module.exports = function (reporters) {
    function Multiplexer(runner) {
        Base.call(this, runner);
        
        this._reporters = Object.keys(reporters).map(function (key) {
            var Reporter = require(key),
                ee = new EventEmitter;
            
            var stream = reporters[key],
                reporter = new Reporter(ee);
            
            runnerEvents.forEach(function (event) {
                runner.on(event, function () {
                    var _stdout = console._stdout;
                    console._stdout = stream;
                    
                    var proxy = { stdout: stream };
                    proxy.__proto__ = _process;
                    global.process = proxy;
                    
                    var i = arguments.length, args = new Array(i+1);
                    while (i--) { args[i+1] = arguments[i]; }
                    args[0] = event;
                    
                    ee.emit.apply(ee, args);
                    
                    global.process = _process;
                    console._stdout = _stdout;
                });
            });
        });
    }
    
    return Multiplexer;
};
