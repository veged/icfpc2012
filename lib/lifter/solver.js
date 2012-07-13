// vim:ts=4:sw=4
var solver = exports,
    lifter = require('../lifter');

//
// ### function Solver (map)
// #### @map {String|Map} Map instance
// Solver class for finding optimal solution (asyncronously)
//
function Solver(map) {
    this.tree = lifter.tree.create();

    process.on('SIGINT', function() {
        // XXX: Do not forget to handle SIGINT.
    });
};

//
// ### function create (map)
// #### @map {String|Map} Map instance
// Create instance of Solver.
//
exports.create = function create(map) {
    return new Solver(map);
};

//
// ### function run (callback)
// #### @callback {Function} Continuation to proceed to.
// Find optimal solution and executes callback with a stringified version of
// solution (robot's program).
//
Solver.prototype.run = function run(callback) {

};
