// vim:ts=4:sw=4
var cli = exports,
    lifter = require('../lifter');

cli.run = function run(input, output) {
    var buffers = [],
        map;

    input.on('data', function(chunk) {
        buffers.push(chunk);
    });
    input.on('end', function() {
        map = buffers.join('');

        lifter.solver.create(map).run(function(out) {
            output.write(out);
        });
    });
};
