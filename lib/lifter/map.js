// vim:ts=4:sw=4
var map = exports,
    lifter = require('../lifter');

//
// ### function Map (source)
// #### @source {Map|String} other Map instance or stringified map
// Clone map or creates new
//
function Map(source) {
};

//
// ### function create (source)
// #### @source {Map|String} other Map instance or stringified map
// Clone map or creates new
//
exports.create = function create(source) {
    return new Map(source);
};

//
// ### function get (pos)
// #### @pos {Object} (example, { x: 0, y: 0 }) position
// Return block on specific position (like '#', '*', 'R' or any other).
//
Map.prototype.get = function get(pos) {
};

//
// ### function move (from, to, isEmulation)
// #### @from {Object} (example, { x: 0, y: 0 }) from position
// #### @to {Object} (example, { x: 0, y: 0 }) to position
// #### @isEmulation {Boolean} true if move was performed from emulator
// Move block from one position to another
// Return new modified map
//
Map.prototype.move = function move(from, to, isEmulation) {
};

//
// ### function getLambdas (iteration)
// #### @iteration {Number} Number of emulator's iteration
// Return list of all lambdas on map (XXX probably sorted).
//
Map.prototype.getLambdas = function getLambdas(iteration) {
};

//
// ### function getRocks (iteration)
// #### @iteration {Number} Number of emulator's iteration
// Return list of all rocks on map (XXX probably sorted).
//
Map.prototype.getRocks = function getRocks(iteration) {
};

//
// ### function openLift (iteration)
// #### @iteration {Number} Number of emulator's iteration
// Open lift.
// Return new modified map.
//
Map.prototype.openLift = function openLift() {
};
