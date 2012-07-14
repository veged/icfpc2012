// vim:ts=4:sw=4
var phi = exports,
    lifter = require('../lifter');

//
// ### function calculate (node)
// #### @node {TreeNode} Current node of tree
// Return numeric value of fitness-function(phi) in the range [0,1]
//
phi.calculate = function calculate(node) {
    return (node.map.score + 1) * (1 - (1 / Math.log(node.depth)));
};
