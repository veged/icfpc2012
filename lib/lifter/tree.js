// vim:ts=4:sw=4
var tree = exports,
    lifter = require('../lifter');

//
// ### function Tree (map)
// #### @map {Map} Initial map
// Tree constructor
//
function Tree(map) {
    this.maxNode = null;
    this.root = this.createNode(null, 'W', map);
};

//
// ### function create (map)
// #### @map {Map} Initial map
// Create instance of Tree
//
exports.create = function create(map) {
    return new Tree(map);
};

//
// ### function createNode (parent, cmd, [map])
// #### @parent {TreeNode|null} Parent node
// #### @cmd {String} Player command
// #### @map {Map} **optional** Initial map for root node
// Create new node in tree from parent node, previous map and player command
//
Tree.prototype.createNode = function createNode(parent, cmd, map, pmap) {
    return new TreeNode(this, parent, cmd, map, pmap);
};

//
// ### function TreeNode (tree, parent, cmd, [map])
// #### @tree {Tree} Instance of Tree
// #### @parent {TreeNode|null} Parent node
// #### @cmd {String} Player command
// #### @map {Map} **optional** Initial map for root node
// TreeNode constructor
//
function TreeNode(tree, parent, cmd, map, pmap) {
    // Tree structure
    this.tree = tree;
    this.still = false;
    this.cmd = cmd || '';

    if (parent) {
        // Generate new map
        this.map = pmap || parent.map.playerAction(cmd);
        this.map = this.map.step();
        this.depth = parent.depth + 1;
    } else {
        this.map = map;
        this.depth = 0;
    }

    // Calculate phi
    this.phi = lifter.phi.calculate(this);

    // Replace node with maximum score
    if (!tree.maxNode || tree.maxNode.map.score < this.map.score) {
        tree.maxNode = this;
        if (process.env['DEBUG']) {
            console.error(this.map.score, this.phi);
        }
    }
};

//
// ### function mutate (cmd)
// #### @cmd {String} Player command
// Returns new mutated node or null if mutation is impossible
//
TreeNode.prototype.mutate = function(cmd) {
    var map = this.map.playerAction(cmd);
    if (!map) return false;

    var child = this.tree.createNode(this, cmd, null, map);

    if (child.map.getRevision() === this.map.getRevision()) {
        return false;
    }

    return child;
};
