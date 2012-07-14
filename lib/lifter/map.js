// vim:ts=4:sw=4
var map = exports,
    lifter = require('../lifter'),
    assert = require('assert');

//
// ### function Map (source, [config])
// #### @source {Array|Map} other Map instance or stringified map
// #### @config {Object} Flooading options
// Clone map or creates new
//
function Map(source, config) {
    if (source instanceof Map) {
        this.config = source.config;
        this.width = source.width;
        this.height = source.height;

        this.tiles = source.tiles;
        this.waterLevel = source.waterLevel;

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
        this.config = config || {};
        this.config.water = this.config.water || 0;
        this.config.flooding = this.config.flooding || 0;
        this.config.waterproof = this.config.waterproof || 0;

        var width = source.reduce(function(max, line) {
            return Math.max(max, line.length);
        }, 0);

        source = source.map(function(line) {
            return line + new Array(width - line.length + 1).join(' ');
        });

        this.width = width;
        this.height = source.length;
        this.waterLevel = this.height - this.config.water;

        this.tiles = createTiles(source.join('\n'));

        this.lambdas = this.tiles.lambdas;
        this.rocks = this.tiles.rocks;
        this.lift = this.tiles.lift;
        this.player = this.tiles.player;

        // Set player's life
        this.player.life = this.config.waterproof;

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
    var conf = str.split(/\n\n/);
    return new Map(conf[0].replace(/\n$/, '').split(/\n/g),
                   (conf[1] || '').split(/\n/g).map(function(line) {
        if (/^Water /.test(line)) {
            return ['water', parseInt(line.slice(6), 10)];
        } else if (/^Flooding /.test(line)) {
            return ['flooding', parseInt(line.slice(8), 10)];
        } else if (/^Waterproof /.test(line)) {
            return ['waterproof', parseInt(line.slice(10), 10)];
        }
        return null;
    }).filter(function(kv) {
        return kv;
    }).reduce(function(obj, kv) {
        obj[kv[0]] = kv[1];
        return obj;
    }, {}));
};

//
// ### function create (source, config)
// #### @source {Map|Array} other Map instance or lines
// #### @config {Object} Flooading options
// Clone map or creates new
//
exports.create = function create(source, config) {
    return new Map(source, config);
};

//
// ### function clone ()
// Return clone of map
//
Map.prototype.clone = function clone() {
    return new Map(this, this.config);
};

//
// ### function get (pos)
// #### @pos {Object} (example, { x: 0, y: 0 }) position
// Return block on specific position (like '#', '*', 'R' or any other).
//
Map.prototype.get = function get(pos) {
    return this.tiles.get(pos);

    var line = this.source[pos.y];

    return line && line[pos.x] || '#';
};

//
// ### function stringify ()
// Returns stringified representation of current map's state
//
Map.prototype.stringify = function stringify() {
    return this.tiles.serializeByGet();
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

    // TODO: temp covert, fix on move() call's
    var sets = [];
    pairs.forEach(function(pair) {
        sets.push({ pos: pair.from, value: ' ' });
        sets.push({ pos: pair.to, value: this.get(pair.from) });
    }, this);

    return clone._update(sets);
};

//
// ### function update (sets)
// #### @sets {Array[Object]} (example, [{ pos: {x:0,y:0}, value: '*' }])
// Apply blocks moves to map. Return new map.
//
Map.prototype.update = function update(sets) {
    var clone = this.clone()

    clone.iteration++;
    sets.length && (clone.revision = clone.iteration);

    return clone._update(sets);
};

Map.prototype._update = function update(sets) {
    this.tiles = this.tiles.update(sets);

    this.lambdas = this.tiles.lambdas;
    this.rocks = this.tiles.rocks;
    this.player = this.tiles.player;

    return this;
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
    return this.ended;
};

//
// ### function step ()
// Make emulation step
//
Map.prototype.step = function step() {
    if (this.ended) return this;

    var self = this;

    var sets = this.rocks.reduce(function(acc, pos) {
        assert.equal(self.get(pos), '*');
        var below = self.get({ x: pos.x, y: pos.y + 1 });

        if (below === ' ') {
            // Fall down
            acc.push({ pos: pos, value: ' ' });
            acc.push({ pos: { x: pos.x, y: pos.y + 1 }, value: '*' });
        } else {
            var R = self.get({ x: pos.x + 1, y: pos.y }),
                DR = self.get({ x: pos.x + 1, y: pos.y + 1 });

            if ((below === '*' || below === '\\') &&
                R === ' ' && DR === ' ') {
                // Slide right
                acc.push({ pos: pos, value: ' ' });
                acc.push({ pos: { x: pos.x + 1, y: pos.y + 1 }, value: '*' });
            } else if (below === '*' && (R !== ' ' || DR !== ' ') &&
                       self.get({ x: pos.x - 1, y: pos.y }) === ' ' &&
                       self.get({ x: pos.x - 1, y: pos.y + 1 }) === ' ') {
                // Slide left
                acc.push({ pos: pos, value: ' ' });
                acc.push({ pos: { x: pos.x - 1, y: pos.y + 1 }, value: '*' });
            }
        }

        return acc;
    }, []);

    var clone = this.update(sets);

    // If stone was placed above player - end
    var player = clone.player,
        hasAbove = sets.some(function(set) {
            return set.pos.x === player.x && set.pos.y === player.y - 1;
        });

    if (hasAbove) clone.ended = true;

    // Increase water level
    if (clone.config.flooding &&
        ((clone.iteration >> 1) % clone.config.flooding) === 0) {
        clone.waterLevel--;
    }

    // If robot's life is zero and robot is underwater - destroy it
    if (clone.player.y >= clone.waterLevel) {
        if (clone.player.life-- === 0) {
            clone.ended = true;
        }
    } else {
        clone.player.life = clone.config.waterproof;
    }

    return clone;
};

//
// ### function playerAction (cmd)
// #### @cmd {String} 'L', 'U', 'R', 'D', 'W' or 'A'
// Perform player action, return new map
//
Map.prototype.playerAction = function playerAction(cmd) {
    assert.equal(this.get(this.player), 'R');
    if (this.ended) return this;

    if (cmd === 'A') {
        var clone = this.clone();

        clone.ended = true;
        clone.score += clone.extractedLambdas * 25;
        clone.moves += cmd;
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
        sets = [];

    if (newPosBlock !== '#' && newPosBlock !== 'R' && newPosBlock !== 'L') {
        do {
            if (newPosBlock === '*') {
                // Move rock first (if possible)
                if (cmd === 'L' &&
                    this.get({ x: pos.x - 2, y: pos.y }) === ' ') {
                    sets.push({ pos: newPos, value: ' ' });
                    sets.push({ pos: { x: pos.x - 2, y: pos.y }, value: '*' });
                } else if (cmd === 'R' &&
                           this.get({ x: pos.x + 2, y: pos.y }) === ' ') {
                    sets.push({ pos: newPos, value: ' ' });
                    sets.push({ pos: { x: pos.x + 2, y: pos.y }, value: '*' });
                } else {
                    break;
                }
            }

            // Move player
            sets.push({ pos: pos, value: ' ' });
            sets.push({ pos: newPos, value: 'R' });
        } while (false);
    }

    if (this.lambdas.length === 1 && newPosBlock === '\\') {
        sets.push({ pos: this.lift, value: 'O' });
    }

    var clone = this.update(sets);

    if (newPosBlock === 'O') {
        clone.ended = true;
        clone.score += clone.extractedLambdas * 50;
    } else if (newPosBlock === '\\') {
        // Add score on lambda
        clone.score += 25;
        clone.extractedLambdas++;
    }

    // Lose score on every move
    clone.score--;
    clone.moves += cmd;

    return clone;
};

function createTiles (source) {
    source = source.split(/\n/g);
    function doCreateTiles (pos1, pos2, level) {
        if (pos1.x === pos2.x || pos1.y === pos2.y ) {
            return new Tile('', pos1, pos2, level)
        }

        if (pos2.x - pos1.x === 1 && pos2.y - pos1.y === 1) {
            return new Tile (source[pos1.y][pos1.x], pos1, pos2, level);
        }

        var pos3 = {
            x: (pos1.x + pos2.x) >> 1, // div 2
            y: (pos1.y + pos2.y) >> 1
        };
        return new Tile(
            [
                doCreateTiles(pos1, pos3, level + 1),
                doCreateTiles({ x: pos3.x, y: pos1.y }, { x: pos2.x, y: pos3.y }, level + 1),
                doCreateTiles({ x: pos1.x, y: pos3.y }, { x: pos3.x, y: pos2.y }, level + 1),
                doCreateTiles(pos3, pos2, level + 1),
            ],
            pos1,
            pos2,
            level)
    }

    return doCreateTiles({ x: 0, y: 0 }, { x: source[0].length, y: source.length }, 0);
}

function Tile (source, pos1, pos2, level) {
    this.pos1 = pos1;
    this.pos2 = pos2;
    this.width = pos2.x - pos1.x;
    this.height = pos2.y - pos1.y;

    this.level = level;

    this.lambdas = [];
    this.rocks = [];
    this.lift = null;
    this.player = null;

    if (Array.isArray(source)) {
        this.subtiles = source;
        this.pos3 = this.subtiles[0].pos2;
        source.forEach(function(s) {
            this.lambdas.push.apply(this.lambdas, s.lambdas); // TODO: perf
            this.rocks.push.apply(this.rocks, s.rocks);
            this.lift || (this.lift = s.lift);
            this.player || (this.player = s.player);
        }, this);
    } else if (typeof source === 'string') {
        this.data = source; // 1 block
        switch (source) {
            case 'O':
            case 'L':
                this.lift = this.pos1;
                break;
            case 'R':
                this.player = this.pos1;
                break;
            case '\\':
                this.lambdas.push(this.pos1);
                break;
            case '*':
                this.rocks.push(this.pos1);
                break;
        }
    }
}

Tile.prototype.update = function update(sets) {
    if (!sets.length) return this;
    if (this.data) {
        var set = sets[sets.length - 1];
        assert.equal(set.pos.x, this.pos1.x);
        assert.equal(set.pos.y, this.pos1.y);
        return new Tile(set.value, this.pos1, this.pos2, this.level);
    }

    var subsets = [[], [], [], []],
        pos1 = this.pos1,
        pos2 = this.pos2,
        pos3 = this.pos3;

    sets.forEach(function(set) {
        var X = set.pos.x < pos3.x ? 0 : 1,
            Y = set.pos.y < pos3.y ? 0 : 1;
        subsets[2 * Y + X].push(set);
    })

    return new Tile(
        this.subtiles.map(function(tile, i) {
            return tile.update(subsets[i])
        }),
        pos1,
        pos2,
        this.level)
};

Tile.prototype.get = function get(pos) {
    if (pos.x < this.pos1.x || pos.x >= this.pos2.x ||
        pos.y < this.pos1.y || pos.y >= this.pos2.y) {
        throw new Error('' + pos.x + ':' + pos.y + ' is outside tile');
    }
    if (this.data) return this.data;

    var X = pos.x < this.pos3.x ? 0 : 1,
        Y = pos.y < this.pos3.y ? 0 : 1;

    return this.subtiles[2 * Y + X].get(pos);
};

Tile.prototype.serializeByGet = function serializeByGet() {
    var res = [];
    for(var j = this.height - 1; j >= 0; j--) {
        var resJ = '';
        for(var i = 0, w = this.width; i < w; i++) {
            resJ += this.get({ x: i, y: j });
        }
        res.unshift(resJ);
    }
    return res.join('\n');
};

false && console.log(
    createTiles(
        [
            '.. .*',
            '* */ ',
            '..RL/'
        ].join('\n')
    )
    .update([
        { pos: { x: 0, y: 0 }, value: '*' },
        { pos: { x: 0, y: 1 }, value: ' ' }
    ])
    .serializeByGet()
);

false && console.log(createTiles([
    '.. .*',
    '* */ ',
    '..RL/'
].join('\n')).serializeByGet());
