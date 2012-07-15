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

Solver.prototype.chopTree = function chopTree(minLevel, total) {
    function split(queue, i) {
        var hash = {},
            length = 0;

        queue.forEach(function(item) {
            var key = item.map.moves[i];

            if (!hash[key]) hash[key] = [];
            hash[key].push(item);
        });

        Object.keys(hash).forEach(function(key) {
            if (i > minLevel) {
                hash[key] = split(hash[key], i - 1);
            }
            length += hash[key].length;
        });

        return { hash: hash, length: length };
    }

    var tree = split(this.queue, this.tree.root.map.depth),
        head = [],
        tail = [];

    function chop(tree, total) {
        if (Array.isArray(tree)) {
            tree.sort(function(a, b) {
                return b.phi - a.phi;
            });
            head = head.concat(tree.slice(0, total));
            tail = tail.concat(tree.slice(total));
        } else {
            Object.keys(tree.hash).forEach(function(key) {
                chop(tree.hash[key],
                     (tree.hash[key].length / tree.length) * total);
            });
        }
    }

    chop(tree, total);

    return { head: head, tail: tail };
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
        if (true) {
            var chop = this.chopTree(2, 100);
            this.queue = chop.tail;
            chop.head.forEach(function(node) {
                console.log(node.map.stringify());
                ['U','D','L','R','W'].forEach(function(cmd) {
                    var child = node.mutate(cmd);
                    if (!child || child.map.ended || child.phi === 0) return;
                    this.queue.push(child);
                }, this);
            }, this);

            // XXX: Limit queue
            if (this.queue.length > 10000) {
                // var queue = this.cleanupQueue();
                this.queue = this.chopTree(2, 1000).head;
            }
        } else {
            var node = this.queue.shift();
            console.log(node.map.stringify());

            ['U','D','L','R','W'].forEach(function(cmd) {
                var child = node.mutate(cmd);
                if (!child || child.map.ended || child.phi === 0) return;
                this.queue.push(child);
            }, this);

            // XXX: Limit queue
            if (this.queue.length > 10000) {
                this.queue.sort(function(a, b) {
                    return b.phi - a.phi;
                });

                // var queue = this.cleanupQueue();
                this.queue = this.queue.slice(0, 2000);
            }
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
            history.push({
               map: node.map.stringify(),
               moves: node.map.getMoves()
            });
            node = node.parent;
        }
        history.reverse().forEach(function(item) {
            console.log(item.map);
            console.log(item.moves);
        });
        */
        console.error(this.tree.maxNode.map.score);
        callback(String(this.tree.maxNode.map.getMoves()));
    };
};
