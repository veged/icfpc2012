// vim:ts=4:sw=4
var utils = exports,
    lifter = require('../lifter');

utils.extend = function extend(obj1, obj2) {
    Object.keys(obj2)
        .forEach(function(k) { obj1[k] = obj2[k] });
    return obj1;
}
