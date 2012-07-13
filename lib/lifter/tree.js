// vim:ts=4:sw=4
var tree = exports,
    lifter = require('../lifter');

//
// ### function Tree ()
// Tree constructor
//
function Tree() {
    this.root = null;
    this.maxNode = null;
};

//
// ### function create ()
// Create instance of Tree
//
exports.create = function create() {
    return new Tree();
};

//
// ### function createNode ([parent], map, scored)
// #### @parent {TreeNode} **optional** Parent node.
// #### @map {Map} Instance of Map
// #### @cmd {String} Player command
// Create new node in tree from parent node, previous map and player command
//
Tree.prototype.createNode = function createNode(parent, map, cmd) {
    var node = new TreeNode(this, parent, map, cmd);

    if (!this.root) this.root = node;

    return node;
};

//
// ### function TreeNode (tree, map, scored, [parent])
// #### @tree {Tree} Instance of Tree
// #### @parent {TreeNode} **optional** Parent node.
// #### @map {Map} Instance of Map
// #### @cmd {String} Player command
// TreeNode constructor
//
function TreeNode(tree, parent, map, cmd) {
    // Tree structure
    this.tree = tree;
    this.parent = parent;
    this.depth = parent ? parent.depth + 1 : 0;

    // Generate new map
    var playerResult = lifter.player.move(map, cmd);
    this.map = lifter.emulator.execute(playerResult.map, this.depth);
    this.score = (parent ? parent.score : 0) + playerResult.scored;

    // Calculate phi
    this.phi = lifter.phi.calculate(this);

    // Replace node with maximum score
    if (!tree.maxNode || tree.maxNode.score < this.score) {
        tree.maxNode = this;
    }
};
