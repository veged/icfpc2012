// vim:ts=4:sw=4
var utils = exports,
    lifter = require('../lifter');

utils.extend = function extend(obj1, obj2) {
    Object.keys(obj2)
        .forEach(function(k) { obj1[k] = obj2[k] });
    return obj1;
};

utils.doAroundPos = function doAroundPos(pos, fn, ctx) {
    for (var i = -1; i <= 1; i++) {
        for (var j = -1; j <= 1; j++) {
            if (!i && !j) continue;
            fn.call(ctx, { x: pos.x + i, y: pos.y + j });
        }
    }
};
