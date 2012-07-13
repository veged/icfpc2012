// vim:ts=4:sw=4
var map = exports,
    lifter = require('../lifter');

//
// ### function Map (source, node)
// #### @source {String|Map} other Map instance or stringified map
// #### @node {TreeNode} Associated tree node
// Clone map or creates new
//
function Map(source, node) {
    this.node = node;
};

//
// ### function create (source, node)
// #### @source {Map|String} other Map instance or stringified map
// #### @node {TreeNode} Associated tree node
// Clone map or creates new
//
exports.create = function create(source, node) {
    return new Map(source, node);
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
// ### function getLambdas ()
// Return list of all lambdas coordinates on map (XXX probably sorted).
// Example: [{x: 0, y: 0}]
//
Map.prototype.getLambdas = function getLambdas() {
};

//
// ### function getRocks ()
// Return list of all rocks coordinates on map (XXX probably sorted).
// Example: [{x: 0, y: 0}]
//
Map.prototype.getRocks = function getRocks() {
};

//
// ### function getPlayer ()
// Return position of player on map ({ x: 0, y: 0 })
//
Map.prototype.getPlayer = function getPlayer() {
};

//
// ### function getLift ()
// Return position of player on map ({ x: 0, y: 0 })
//
Map.prototype.getLift = function getLift() {
};

//
// ### function isLiftOpen ()
// Return either true or false
//
Map.prototype.isLiftOpen = function isLiftOpen() {
    return this.getLambdas().length === 0;
};


//
// ### function openLift (iteration)
// Open lift, return new modified map.
//
Map.prototype.openLift = function openLift() {
};
