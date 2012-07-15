// vim:ts=4:sw=4
process.stdin.resume();
var lifter = require('../lifter'),
    FS = require('fs'),
    input = process.stdin,
    output = process.stdout,
    map = lifter.map.fromString(String(FS.readFileSync(process.argv[2])));

output.write(
    JSON.stringify(map.config) + '\n' +
    map.stringify() + '\n');

input.on('data', function(chunk) {
    (chunk.toString().match(/[URDLSWA]/g) || []).forEach(function(cmd) {
        var tryMap = map.playerAction(cmd);
        if (!tryMap) tryMap = map.playerAction('W');
        map = tryMap.step();
        output.write(map.stringify() + '\n');
        if (map.hasEnded()) process.exit();
    })
});

