// vim:ts=4:sw=4
var solver = exports,
    lifter = require('../lifter');

//
// ### function Solver (map)
// #### @map {String|Map} Map instance
// Solver class for finding optimal solution (asyncronously)
//
function Solver(map) {
    this.tree = lifter.tree.create(lifter.map.fromString(map));
    this.queue = [this.tree.root];
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
    var self = this;

    function step(depth) {
        if (depth > 10) {
            return process.nextTick(function() {
                step.call(self, 0);
            });
        }

        if (this.queue.length === 0) return finish.call(this);

        // Mutate in all possible directions and extend queue
        var node = this.queue.shift();
        ['U','D','L','R','W'].forEach(function(cmd) {
            var child = node.mutate(cmd);
            if (!child || child.map.ended || child.phi === 0) return;
            this.queue.push(child);
        }, this);

        // Sort queue (TODO: Use optimized structure here)
        this.queue.sort(function(a, b) {
            return a.phi > b.phi ? -1 : a.phi < b.phi ? 1 :
                   a.depth > b.depth ? 1 : a.depth < b.depth ? -1 :
                   a.cmd > b.cmd ? -1 : a.cmd < b.cmd ? 1 : 0;
        });

        // XXX: Limit queue
        if (this.queue.length > 3000) {
            var q = [];
            for (var i = 0; i < this.queue.length; i += 5) {
                q.push(this.queue[i]);
            }
            this.queue = q;
        }

        step.call(this, depth + 1);
    }

    step.call(this, 0);
    process.once('SIGINT', function() {
        finish.call(self);
        process.exit(0);
    });

    function finish() {
        if (!this.tree.maxNode.ended) {
            this.tree.maxNode.mutate('A');
        }
        /*
        var node = this.tree.maxNode,
            history = [];
        while (node) {
            history.push({ map: node.map.stringify(), moves: node.map.moves });
            node = node.parent;
        }
        history.reverse().forEach(function(item) {
            console.log(item.map);
            console.log(item.moves);
        });
        */
        callback(this.tree.maxNode.map.moves);
    };
};
