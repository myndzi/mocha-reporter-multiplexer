'use strict';

var Base = require('mocha/lib/reporters/base'),
    EventEmitter = require('events').EventEmitter,
    format = require('util').format;

var runnerEvents = [ 'start', 'pass', 'pending', 'fail', 'end', 'hook', 'hook end', 'suite', 'suite end', 'test', 'test end', 'test group' ];
var _process = process;

var PassThrough = require('stream').PassThrough;

module.exports = function (reporters, testGroup) {
    function Multiplexer(runner) {
        Base.call(this, runner);
        
        this._reporters = Object.keys(reporters).map(function (key) {
            var Reporter = require(key),
                ee = new EventEmitter;
            
            var stream = reporters[key],
                reporter = new Reporter(ee);
            
            runnerEvents.forEach(function (event) {
                var verb = 'on';
                if (event === 'end') { verb = 'once'; }
                runner[verb](event, function () {
                    var _console_stdout = console._stdout,
                        _process_stdout = process.stdout;
                    
                    var proxyStream = Object.create(stream);
                    proxyStream.type = '_tty';
                    proxyStream.isTTY = true;
                    
                    Object.defineProperty(global.console, '_stdout', { value: proxyStream });
                    Object.defineProperty(global.process, 'stdout', { value: proxyStream });
                    
                    var i = arguments.length, args = new Array(i+1);
                    while (i--) { args[i+1] = arguments[i]; }
                    args[0] = event;
                    
                    ee.emit.apply(ee, args);
                    
                    Object.defineProperty(global.console, '_stdout', { value: _console_stdout });
                    Object.defineProperty(global.process, 'stdout', { value: _process_stdout });
                });
            });
        });
        
        runner.emit('test group', testGroup);
    }
    
    return Multiplexer;
};
