// vim:ts=4:sw=4
var phi = exports,
    lifter = require('../lifter');

//
// ### function calculate (node)
// #### @node {TreeNode} Current node of tree
// Return numeric value of fitness-function(phi) in the range [0,1]
//
phi.calculate = function calculate(node) {
    // Find gravitation factor
    var lambdas = node.map.getLambdas(),
        player = node.map.getPlayer(),
        gx = 0,
        gy = 0;

    var llist = lambdas.length > 0 ? lambdas : [node.map.getLift()];

    llist.forEach(function(pos) {
        var x = pos.x - player.x,
            y = pos.y - player.y,
            len2 = x * x + y * y,
            len = Math.sqrt(len2),
            F = 1 / len2;;

        if (len === 0) {
            gx += 100;
            gy += 100;
            return;
        }
        gx += F * (x / len);
        gy += F * (y / len);
    });

    // Length of vector
    var G = Math.sqrt(gx * gx + gy * gy);

    // Decaying random factor
    var R = Math.random() / (node.depth * Math.E + 1);

    // Water factor:
    // Try to get above the water
    var W = 0;
    if (player.y >= node.map.waterLevel &&
        player.life === (player.y - node.map.waterLevel) &&
        lambdas.length &&
        node.map.getMoves()[node.map.getMoves().length - 1] !== 'U') {
        W = 0.75;
    }

    var decay = Math.log(2) / Math.log(2 + node.depth / 40);

    var S = node.map.score / node.map.maxScore;

    return (G + 0.8 * R + 1.2 * W + 86 * S) * decay;
};

phi.bestMoves = function bestMoves(node) {
    var player = node.map.getPlayer();

    // A*
    function findPath(pos) {
        var closed = {},
            pqueue = [[player]],
            queue = [],
            i = 0,
            solution;

        for (; (queue.length !== 0 || pqueue.length !== 0) && i < 1e5; i++) {
            var path = pqueue.shift() || queue.shift(),
                last = path[path.length - 1];

            if ((/[\#WL1-9\*]/).test(node.map.get(last))) continue;

            if (closed[last.x + ':' + last.y]) {
                continue;
            } else if (pos.x === last.x && pos.y === last.y) {
                solution = path;
                break;
            }
            closed[last.x + ':' + last.y] = true;

            var L = { x: last.x - 1, y: last.y, cmd: 'L' },
                R = { x: last.x + 1, y: last.y, cmd: 'R' };
            if (last.x < pos.x) {
                pqueue.push(path.concat(R));
                queue.push(path.concat(L));
            } else if (last.x > pos.x) {
                queue.push(path.concat(R));
                pqueue.push(path.concat(L));
            } else {
                queue.push(path.concat(R));
                queue.push(path.concat(L));
            }

            var D = { x: last.x, y: last.y + 1, cmd: 'D' },
                U = { x: last.x, y: last.y - 1, cmd: 'U' };
            if (last.y < pos.y) {
                pqueue.push(path.concat(D));
                queue.push(path.concat(U));
            } else if (last.x > pos.x) {
                queue.push(path.concat(D));
                pqueue.push(path.concat(U));
            } else {
                queue.push(path.concat(D));
                queue.push(path.concat(U));
            }
        }

        return (solution || []).slice(1);
    }

    var lambdas = node.map.getLambdas(),
        llist = lambdas.length > 0 ? lambdas : [node.map.getLift()];

    var lens = llist.map(function(l) {
        var dx = l.x - player.x,
            dy = l.y - player.y;
        return {
            len: Math.sqrt(dx * dx + dy * dy),
            pos: l
        };
    }).sort(function(a, b) {
        return a.len - b.len;
    }).slice(0, 13);

    var paths = llist.map(findPath).filter(function(path) {
            return path.length;
        });

    var map = {};
    paths.forEach(function(path) {
        map[path[0].cmd] = { x: path[0].x, y: path[0].y };
    });

    return Object.keys(map).map(function(cmd) {
        return { cmd: cmd, next: map[cmd] };
    });
};
