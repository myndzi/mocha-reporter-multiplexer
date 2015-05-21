# What is it?

A shim to make Mocha's reporter api suck less. It allows you to bind multiple reporters and specify streams for them to output to.

# How does it work?

It proxies the reporter events and temporarily replaces stdout (but not stderr) on the global process object before calling each reporter's event handler, putting things back when the handler returns.

# How do I use it?

    var Multiplexer = require('mocha-reporter-multiplexer')({
        'require-string': stream
    });
    var mocha = new Mocha({
        reporter: Multiplexer
    });
    // .. etc
    mocha.run();

`require-string` is a string to be passed to require(), so you could use, for example, `mocha/lib/reporters/dot` or `mocha-unfunk-reporter`. `stream` is a writable stream.

If you're using Mocha programmatically to run multiple sets of tests (multiple instances of Mocha), you might want to be able to label them. You can configure this module with a title for them, which is then emitted on the reporter instances as a 'test group' event, like so:

    var Multiplexer = require('mocha-reporter-multiplexer')({ './lib/custom-reporter': process.stdout }, 'Title');
    var mocha = new Mocha({ reporter: Multiplexer });
    ...
    reporter.on('test group', function (title) { console.log('-> %s', title); });


# Why would I use it?

Say you want to output an XML report of your test results. If you just run mocha and pipe it to a file, any stray console.log lines or error reports (that shouldn't have used console.log but do) will make your XML invalid. By cleanly segregating outputs, this shim allows you to safely output a separate XML file for use in Jenkins or whatever. It also lets you print one report to the screen and a different report type to a file, or even create multiple report files in different formats.

# Potential gotchas

This module incorrigably messes with globals and "private" properties of classes, and relies on Node implementation specifics. There are no guarantees this will ever work, now or in the future.

In reality, as long as EventEmitter.prototype.emit continues to emit synchronously, and Node's Console class doesn't change the name of its captured stdout reference, things should be fine.
