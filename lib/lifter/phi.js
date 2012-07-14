// vim:ts=4:sw=4
var phi = exports,
    lifter = require('../lifter');

//
// ### function calculate (node)
// #### @node {TreeNode} Current node of tree
// Return numeric value of fitness-function(phi) in the range [0,1]
//
phi.calculate = function calculate(node) {
    var moves = node.map.moves,
        x = 0,
        y = 0,
        len = 0;
    for (var i = moves.length - 1; i >= 0; i--) {
        if (moves[i] === 'U') y++;
        if (moves[i] === 'D') y--;
        if (moves[i] === 'R') x++;
        if (moves[i] === 'L') x--;
        if (moves[i] === 'W') continue;

        len++;
        if (x === 0 && y === 0) break;
    }
    if (x === 0 && y === 0 && moves.length > 0 && len < 6) return 0;
    return (node.map.score + 5) * (1 - (1 / Math.log(node.depth)));
};
