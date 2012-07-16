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
    this.players = [this.tree.root];
    this.reserve = [];
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
    var self = this,
        depth = 0,
        others = {
            'L': ['U','D','R','W'],
            'R': ['U','D','L','W'],
            'U': ['L','D','R','W'],
            'D': ['U','L','R','W'],
            'W': ['U','L','R','D']
        };

    function debugMap(node) {
        process.env['DEBUG'] && console.log(
            (function(a, b) {
                return a.map(function(l, i) {
                    return l + '          ' + b[i]
                }).join('\n')
            })(
                node.map.stringify().split('\n'),
                self.tree.maxNode.map.stringify().split('\n')
            ) + '\n' +
            'Depth: ' + depth
        );
    }

    var tries = 0;
    function step() {
        if (this.queue.length === 0) return finish.call(this);

        if (tries <= 0) tries = 0.01;
        // Mutate in all possible directions and extend queue
        if (Math.random() > (1/tries)) {
            var chopLimit = 3,
                players = this.players.slice(0, 10);

            if (players.length === 0) players = this.reserve.slice(0, 10);
            var chop = this.chopTree(chopLimit, 100 - players.length),
                head = players.concat(chop.head);

            this.queue = chop.tail;
            this.reserve = [];
            chop.head.forEach(function(node) {
                debugMap(node);
                ['U','D','L','R','W','S'].forEach(function(cmd) {
                    var child = node.mutate(cmd);
                    if (!child || child.map.ended || child.phi === 0) return;
                    this.queue.push(child);
                }, this);
            }, this);

            // XXX: Limit queue
            if (this.queue.length > 10000) {
                // var queue = this.cleanupQueue();
                this.queue = this.chopTree(chopLimit, 1000).head;
            }

            tries -= 0.1;
        } else {
            if (this.players.length !== 0) {
                var players = [];

                this.players.forEach(function(node) {
                    var map = {},
                        moves = lifter.phi.bestMoves(node);

                    debugMap(node);
                    for (var i = 0; i < moves.length; i++) {
                        var key = moves[i].next.x + ':' + moves[i].next.y;

                        // Do not move twice to the same pos
                        if (map[key]) continue;
                        map[key] = true;

                        var child = node.mutate(moves[i].cmd);
                        if (!child || child.map.ended) break;
                        players.push(child);
                    }
                }, this);

                if (this.reserve !== this.players) {
                    this.reserve = this.players;
                } else {
                    this.reserve = [];
                }
                this.players = players;

                this.players.sort(function(a, b) {
                    return b.phi - a.phi;
                });

                if (this.players.length > 100) {
                    this.players = this.players.slice(0, 10);
                }
                tries -= 0.1;
            } else if (this.reserve.length !== 0) {
                this.reserve.slice(0,10).forEach(function(node) {
                    var moves = node.map.getMoves(),
                        last = moves[moves.length - 1],
                        parent = node.parent,
                        other = others[last];

                    other.forEach(function(cmd) {
                        var child = node.mutate(cmd);
                        if (!child || child.map.ended) return;
                        this.players.push(child);
                    }, this);
                }, this);

                this.players.sort(function(a, b) {
                    return b.phi - a.phi;
                });
                tries += 0.3;
            } else {
                tries += 0.3;
            }
        }

        return process.nextTick(function() {
            step.call(self);
        });
    }

    step.call(this);
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
        if (process.env['DEBUG']) {
            console.error(this.tree.maxNode.map.score);
            console.error(this.tree.maxNode.map.stringify());
            console.error('Depth: ' + depth);
        }
        callback(String(this.tree.maxNode.map.getMoves()));
    };
};
