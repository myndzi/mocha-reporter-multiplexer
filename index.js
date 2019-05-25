'use strict';

var Base = require('mocha/lib/reporters/base'),
    constants = require('mocha/lib/runner').constants,
    EventEmitter = require('events').EventEmitter,
    format = require('util').format;

var _process = process;

var PassThrough = require('stream').PassThrough;

var runnerEvents = Object.keys(constants).map(function (k) {
    return constants[k];
});

module.exports = function (reporters, testGroup) {
    function Multiplexer(runner) {
        Base.call(this, runner);

        this._reporters = Object.keys(reporters).map(function (key) {
            var Reporter = require(key),
                ee = Object.create(runner);

            // this is some deep shenanigans, may break at some point
            // the gist is: the 'runner' object, which also emits the events,
            // keeps state. we need to provide a different event emitter object
            // to each reporter so that we can capture the stream output separately
            // but there's no easy way to share the state among the reporters
            // (and hopefully none of them modify it!)
            // as a hack, we create an object with a prototype of the reporter, but
            // give it its own event list, so we get isolated listeners that share
            // most properties
            ee._events = Object.create(null);
            ee._eventsCount = 0;

            var stream = reporters[key],
                reporter = new Reporter(ee, { name: testGroup });

            runnerEvents.forEach(function (event) {
                runner.on(event, function () {
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

                    EventEmitter.prototype.emit.apply(ee, args);

                    Object.defineProperty(global.console, '_stdout', { value: _console_stdout });
                    Object.defineProperty(global.process, 'stdout', { value: _process_stdout });
                });
            });
        });

        runner.emit('test group', testGroup);
    }

    return Multiplexer;
};
