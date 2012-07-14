// vim:ts=4:sw=4
var map = exports,
    lifter = require('../lifter');

//
// ### function Map (source)
// #### @source {Array|Map} other Map instance or stringified map
// Clone map or creates new
//
function Map(source) {
    if (source instanceof Map) {
        this.width = source.width;
        this.height = source.height;
        this.source = source.source.slice();

        this.lambdas = source.lambdas;
        this.rocks = source.rocks;
        this.lift = source.lift;
        this.player = source.player;

        // Map status
        this.revision = source.revision;
        this.iteration = source.iteration;
        this.score = source.score;
        this.ended = source.ended;
        this.extractedLambdas = source.extractedLambdas;
        this.maxScore = source.maxScore;

        // Player moves
        this.moves = source.moves;
    } else {
        this.width = source[0].length;
        this.height = source.length;
        this.source = source.slice();

        function find(re) {
            return source.reduce(function(acc, line, y) {
                line.split(re).reduce(function(x, chunk) {
                    // Use first item as offset
                    if (typeof x === 'string') x = x.length;

                    acc.push({ x: x, y: y });

                    return x + chunk.length + 1;
                });

                return acc;
            }, []);
        }

        // Find all lambdas and rocks
        this.lambdas = find(/\\/g);
        this.rocks = find(/\*/g);
        this.lift = find(/[LO]/g)[0];
        this.player = find(/R/g)[0];

        // Map status
        this.revision = 0;
        this.iteration = 0;
        this.score = 0;
        this.ended = false;
        this.extractedLambdas = 0;
        this.maxScore = this.lambdas.length * 75;

        // Player moves
        this.moves = '';
    }
};

//
// ### function fromString (str)
// #### @str {String} Stringified map
// Get map from string
//
exports.fromString = function fromString(str) {
    return new Map(str.split(/\n/g));
};

//
// ### function create (source)
// #### @source {Map|Array} other Map instance or lines
// Clone map or creates new
//
exports.create = function create(source) {
    return new Map(source);
};

//
// ### function clone ()
// Return clone of map
//
Map.prototype.clone = function clone() {
    return new Map(this);
};

//
// ### function get (pos)
// #### @pos {Object} (example, { x: 0, y: 0 }) position
// Return block on specific position (like '#', '*', 'R' or any other).
//
Map.prototype.get = function get(pos) {
    var line = this.source[pos.y];

    return line && line[pos.x] || '#';
};

//
// ### function set (pos, char)
// #### @pos {Object} (example, { x: 0, y: 0 }) position
// #### @char {Char} new character
// *Not immutable! Do not use!*
//
Map.prototype.set = function set(pos, char) {
    if (this.source.length <= pos.y) return;

    var line = this.source[pos.y],
        old = line[pos.x];

    if (old === undefined) return;

    // Optimization
    if (old === char) return;

    this.source[pos.y] = line.slice(0, pos.x) + char + line.slice(pos.x + 1);

    // Remove lambda or rock if we've overwritten them
    if (old === '\\') {
        this.lambdas = this.lambdas.filter(function(lpos) {
            return lpos.x !== pos.x || lpos.y !== pos.y;
        });
    } else if (old === '*') {
        this.rocks = this.rocks.filter(function(rpos) {
            return rpos.x !== pos.x || rpos.y !== pos.y;
        });
    }

    // Add new rock or lambda if we wrote one
    if (char === '\\') {
        this.lambdas.push(pos);
    } else if (char === '*') {
        this.rocks.push(pos);
    } else if (char === 'R') {
        this.player = pos;
    }

    this.revision = this.iteration;
};

//
// ### function stringify ()
// Returns stringified representation of current map's state
//
Map.prototype.stringify = function stringify() {
    return this.source.join('\n');
};

//
// ### function move (pairs, iteration)
// #### @pairs {Array[Object]} (example, [{from: {x:0,y:0}, to: {x:1,y:1}}])
// #### @iteration {Number} **optional** new map's iteration
// Move blocks in map. Return new map.
//
Map.prototype.move = function move(pairs, iteration) {
    var clone = this.clone();

    if (iteration) {
        clone.iteration = iteration;
    }

    pairs.forEach(function(pair) {
        // Skip nop moves
        if (pair.from.x === pair.to.x && pair.from.y === pair.to.y) {
            return;
        }

        var old = this.get(pair.from);
        clone.set(pair.from, ' ');
        clone.set(pair.to, old);
    }, this);

    return clone;
};

//
// ### function getLambdas ()
// Return list of all lambdas coordinates on map (XXX probably sorted).
// Example: [{x: 0, y: 0}]
//
Map.prototype.getLambdas = function getLambdas() {
    return this.lambdas;
};

//
// ### function getRocks ()
// Return list of all rocks coordinates on map (XXX probably sorted).
// Example: [{x: 0, y: 0}]
//
Map.prototype.getRocks = function getRocks() {
    return this.rocks;
};

//
// ### function getPlayer ()
// Return position of player on map ({ x: 0, y: 0 })
//
Map.prototype.getPlayer = function getPlayer() {
    return this.player;
};

//
// ### function getLift ()
// Return position of player on map ({ x: 0, y: 0 })
//
Map.prototype.getLift = function getLift() {
    return this.lift;
};

//
// ### function isLiftOpen ()
// Return either true or false
//
Map.prototype.isLiftOpen = function isLiftOpen() {
    return this.getLambdas().length === 0;
};

//
// ### function getIteration ()
// Return number of current iteration
//
Map.prototype.getIteration = function getIteration() {
    return this.iteration;
};

//
// ### function getRevision ()
// Return number of current iteration
//
Map.prototype.getRevision = function getRevision() {
    return this.revision;
};

//
// ### function getScore ()
// Return current game score
//
Map.prototype.getScore = function getScore() {
    return this.score;
};

//
// ### function getMoves ()
// Return stringified player's moves
//
Map.prototype.getMoves = function getMoves() {
    return this.moves;
};

//
// ### function hasEnded ()
// Return if game is finished on this map
//
Map.prototype.hasEnded = function hasEnded() {
    return this.hasEnded;
};

//
// ### function step ()
// Make emulation step
//
Map.prototype.step = function step() {
    if (this.ended) return this;

    var self = this;

    var moves = this.rocks.reduce(function(acc, pos) {
        var below = self.get({ x: pos.x, y: pos.y + 1 });

        if (below === ' ' || below === 'R') {
            // Fall down
            acc.push({ from: pos, to: { x: pos.x, y: pos.y + 1 } });
        } else {
            var R = self.get({ x: pos.x + 1, y: pos.y }),
                DR = self.get({ x: pos.x + 1, y: pos.y + 1 });

            if ((below === '*' || below === '\\') &&
                R === ' ' && DR === ' ') {
                // Slide right
                acc.push({ from: pos, to : { x: pos.x + 1, y: pos.y + 1 } });
            } else if (below === '*' && (R !== ' ' || DR !== ' ') &&
                       self.get({ x: pos.x - 1, y: pos.y }) === ' ' &&
                       self.get({ x: pos.x - 1, y: pos.y + 1 }) === ' ') {
                // Slide left
                acc.push({ from: pos, to : { x: pos.x - 1, y: pos.y + 1 } });
            }
        }

        return acc;
    }, []);

    var clone = this.move(moves, this.iteration + 1);

    // If player was replaced by stone - game ends
    if (clone.get(clone.player) !== 'R') {
        clone.ended = true;
    }

    return clone;
};

//
// ### function playerAction (cmd)
// #### @cmd {String} 'L', 'U', 'R', 'D', 'W' or 'A'
// Perform player action, return new map
//
Map.prototype.playerAction = function playerAction(cmd) {
    if (this.ended) return this;

    if (cmd === 'A') {
        var clone = this.clone();

        clone.ended = true;
        clone.score += clone.extractedLambdas * 25;
        return clone;
    }

    var pos = this.player,
        newPos,
        clone

    if (cmd === 'L') {
        newPos = { x: pos.x - 1, y: pos.y };
    } else if (cmd === 'R') {
        newPos = { x: pos.x + 1, y: pos.y };
    } else if (cmd === 'U') {
        newPos = { x: pos.x, y: pos.y - 1 };
    } else if (cmd === 'D') {
        newPos = { x: pos.x, y: pos.y + 1 };
    } else {
        newPos = { x: pos.x, y: pos.y };
    }

    var newPosBlock = this.get(newPos),
        moves = [];

    if (newPosBlock !== '#' && newPosBlock !== 'R') {
        do {
            if (newPosBlock === '*') {
                // Move rock first (if possible)
                if (cmd === 'L' &&
                    this.get({ x: pos.x - 2, y: pos.y }) === ' ') {
                    moves.push({ from: newPos, to: { x: pos.x - 2, y: pos.y } });
                } else if (cmd === 'R' &&
                           this.get({ x: pos.x + 2, y: pos.y }) === ' ') {
                    moves.push({ from: newPos, to: { x: pos.x + 2, y: pos.y } });
                } else {
                    break;
                }
            }

            // Move player
            moves.push({ from: pos, to: newPos });
        } while (false);
    }

    var clone = this.move(moves, this.iteration + 1);

    if (newPosBlock === 'O') {
        clone.ended = true;
        clone.score += this.extractedLambdas * 50;
    } else if (newPosBlock === '\\') {
        // Add score on lambda
        clone.score += 25;
        clone.extractedLambdas++;
    }

    // Lose score on every move
    clone.score--;
    clone.moves += cmd;

    if (this.lambdas.length === 0) {
        clone.set(clone.lift, 'O');
    }

    return clone;
};
