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

    lambdas.forEach(function(aggr) {
        var x = aggr.x - player.x,
            y = aggr.y - player.y,
            len2 = x * x + y * y;
            len = Math.sqrt(len2);

        gx += x / (len * len2);
        gy += y / (len * len2);
    });

    // Length of vector
    var G = 1 - Math.sqrt(gx * gx + gy * gy);

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

    return (G + 0.3 * R + 1.2 * W) * decay;
};
