// vim:ts=4:sw=4
var map = exports,
    lifter = require('../lifter'),
    assert = require('assert');

//
// ### function Map (source, [config])
// #### @source {Array|Map} other Map instance or stringified map
// #### @config {Object} Flooding options
// Clone map or creates new
//
function Map(source, config) {
    if (source instanceof Map) {
        this.config = source.config;
        this.width = source.width;
        this.height = source.height;

        this.tiles = source.tiles;
        this.waterLevel = source.waterLevel;
        this.growth = source.growth;
        this.razors = source.razors;

        this.trampolines = source.trampolines;
        this.trampolineTargets = source.trampolineTargets;
        this.lambdas = source.lambdas;
        this.rocks = source.rocks;
        this.hoRocks = source.hoRocks;
        this.beards = source.beards;
        this.lift = source.lift;
        this.player = source.player;

        this.lambdasCount = source.lambdasCount;

        // Map status
        this.revision = source.revision;
        this.iteration = source.iteration;
        this.score = source.score;
        this.ended = source.ended;
        this.extractedLambdas = source.extractedLambdas;
        this.maxScore = source.maxScore;

        // Player moves
        this.moves = source.moves.slice();
        this.depth = source.depth;
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
        this.growth = this.config.growth - 1;
        this.razors = this.config.razors || 0;

        this.tiles = createTiles(source.join('\n'));

        this.trampolines = this.tiles.trampolines;
        this.trampolineTargets = this.tiles.trampolineTargets;
        this.lambdas = this.tiles.lambdas;
        this.rocks = this.tiles.rocks;
        this.hoRocks = this.tiles.hoRocks;
        this.beards = this.tiles.beards;
        this.lift = this.tiles.lift;
        this.player = this.tiles.player;

        this.lambdasCount = this.lambdas.length + this.hoRocks.length;

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
        this.depth = ~~(Math.log(Math.max(this.width, this.height)) /
            Math.log(2));
        this.moves = new Array(this.depth + 1).join('.').split('.');
    }
};

//
// ### function fromString (str)
// #### @str {String} Stringified map
// Get map from string
//
exports.fromString = function fromString(str) {
    var conf = str.split(/\n\n/),
        match;
    return new Map(
        conf[0].replace(/\n$/, '').split(/\n/g),
        (function() {
            var res = {};
            (conf[1] || '').split(/\n/g).forEach(function(line) {
                if (match = line.match(/^Water (\d+)/)) {
                    res.water = parseInt(match[1], 10);
                } else if (match = line.match(/^Flooding (\d+)/)) {
                    res.flooding = parseInt(match[1], 10);
                } else if (match = line.match(/^Waterproof (\d+)/)) {
                    res.waterproof = parseInt(match[1], 10);
                } else if (match = line.match(/^Trampoline ([A-I]) targets ([1-9])/)) {
                    var _1 = match[1], _2 = match[2];
                    (res.trampolines || (res.trampolines = {}))[_1] = _2;
                    var trampolineTargets = res.trampolineTargets || (res.trampolineTargets = {});
                    (trampolineTargets[_2] || (trampolineTargets[_2] = [])).push(_1);
                } else if (match = line.match(/^Growth (\d+)/)) {
                    res.growth = parseInt(match[1], 10);
                } else if (match = line.match(/^Razors (\d+)/)) {
                    res.razors = parseInt(match[1], 10);
                }
            });
            res.hasOwnProperty('growth') || (res.growth = 25);
            return res;
        })()
    );
};

//
// ### function create (source, config)
// #### @source {Map|Array} other Map instance or lines
// #### @config {Object} Flooding options
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
    return pos.x < 0 || pos.x >= this.width || pos.y < 0 || pos.y >= this.height
        ? '#'
        : this.tiles.get(pos);

    var line = this.source[pos.y];

    return line && line[pos.x] || '#';
};

//
// ### function stringify ()
// Returns stringified representation of current map's state
//
Map.prototype.stringify = function stringify() {
    return [
        this.tiles.serializeByGet(),
        'Water level: ' + (this.height - this.waterLevel),
        'Growth rate: ' + this.growth,
        'Razors: ' + this.razors
    ].join('\n')
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

    this.trampolines = this.tiles.trampolines;
    this.trampolineTargets = this.tiles.trampolineTargets;
    this.lambdas = this.tiles.lambdas;
    this.rocks = this.tiles.rocks;
    this.hoRocks = this.tiles.hoRocks;
    this.beards = this.tiles.beards;
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
    return this.moves[0];
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

    var sets = [],
        items = this.rocks.concat(this.hoRocks);

    // Decrease growth rate
    if (this.iteration % 2 === 1) {
        if (!this.growth) {
            this.growth = this.config.growth;
            items.push.apply(items, this.beards);
        }
        this.growth--;
    }

    items.sort(function(a, b) { return (b.y - a.y) || (a.x - b.x) });

    items.forEach(function(pos) {
        var value = this.get(pos);
        if (value === 'W') {
            lifter.utils.doAroundPos(pos, function(pos) {
                if (this.get(pos) === ' ')
                    sets.push({ pos: pos, value: 'W' });
            }, this);
        } else {
            var below = this.get({ x: pos.x, y: pos.y + 1 });

            if (below === ' ') {
                // Fall down
                sets.push({ pos: pos, value: ' ' });
                if (value === '@' && this.get({ x: pos.x, y: pos.y + 2 }) !== ' ')
                    value = '\\';
                sets.push({ pos: { x: pos.x, y: pos.y + 1 }, value: value });
            } else {
                var R = this.get({ x: pos.x + 1, y: pos.y }),
                    DR = this.get({ x: pos.x + 1, y: pos.y + 1 });

                if ((below === '*' || below === '\\' || below === '@') &&
                    R === ' ' && DR === ' ') {
                    // Slide right
                    sets.push({ pos: pos, value: ' ' });
                    if (value === '@' && this.get({ x: pos.x + 1, y: pos.y + 2 }) !== ' ')
                        value = '\\';
                    sets.push({ pos: { x: pos.x + 1, y: pos.y + 1 }, value: value });
                } else if ((below === '*' || below === '@') && (R !== ' ' || DR !== ' ') &&
                           this.get({ x: pos.x - 1, y: pos.y }) === ' ' &&
                           this.get({ x: pos.x - 1, y: pos.y + 1 }) === ' ') {
                    // Slide left
                    sets.push({ pos: pos, value: ' ' });
                    if (value === '@' && this.get({ x: pos.x - 1, y: pos.y + 2 }) !== ' ')
                        value = '\\';
                    sets.push({ pos: { x: pos.x - 1, y: pos.y + 1 }, value: value });
                }
            }
        }
    }, this);

    var clone = this.update(sets);

    // If stone was placed above player - end
    var player = clone.player,
        hasAbove = sets.some(function(set) {
            return set.value === '*' && set.pos.x === player.x && set.pos.y === player.y - 1;
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
// #### @cmd {String} 'L', 'U', 'R', 'D', 'W', 'A' or 'S'
// Perform player action, return new map
//
Map.prototype.playerAction = function playerAction(cmd) {
    assert.equal(this.get(this.player), 'R');
    if (this.ended) return this;

    if (cmd === 'A') {
        var clone = this.clone();

        clone.ended = true;
        clone.score += clone.extractedLambdas * 25;
        clone.moves[0] += cmd;
        return clone;
    }

    var pos = this.player,
        newPos = pos,
        clone;

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

    if (!(/[#WRL1-9]/).test(newPosBlock)) {
        if (newPosBlock === '*' || newPosBlock === '@') {
            // Move rock first (if possible)
            if (cmd === 'L' || cmd === 'R') {
                var x = pos.x + (cmd === 'L' ? -2 : 2);
                if (this.get({ x: x, y: pos.y }) === ' ') {
                    // Move rock
                    sets.push({ pos: newPos, value: ' ' });
                    sets.push({ pos: { x: x, y: pos.y }, value: newPosBlock });
                    // Move player
                    sets.push({ pos: pos, value: ' ' });
                    sets.push({ pos: newPos, value: 'R' });
                }
            }
        } else if ((/[A-I]/).test(newPosBlock)) {
            // Trampoline jump
            sets.push({ pos: newPos, value: ' ' });
            var trampolineTarget = this.config.trampolines[newPosBlock];
            this.config.trampolineTargets[trampolineTarget].forEach(function(t) {
                sets.push({ pos: this.trampolines[t], value: ' ' });
            }, this);
            sets.push({ pos: pos, value: ' ' });
            sets.push({ pos: this.trampolineTargets[trampolineTarget], value: 'R' });
        } else {
            // Move player
            sets.push({ pos: pos, value: ' ' });
            sets.push({ pos: newPos, value: 'R' });
        }
    }

    if (this.extractedLambdas === this.lambdasCount - 1 && newPosBlock === '\\') {
        sets.push({ pos: this.lift, value: 'O' });
    }

    if (cmd === 'S' && this.razors) {
        lifter.utils.doAroundPos(pos, function(aroundPos) {
            if (this.get(aroundPos) === 'W')
                sets.push({ pos: aroundPos, value: ' ' });
        }, this);
        this.razors--;
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

    // Calculate moves
    var prev = { x: this.player.x, y: this.player.y },
        curr = { x: clone.player.x, y: clone.player.y };

    // We can't execute 'W' on macro level (add cmd here)
    clone.moves[0] += cmd;

    var w = this.width / 2,
        h = this.height / 2,
        i = clone.moves.length - 1;

    for (; w >= 1 && h >= 1; i--, w /= 2, h /= 2) {
        var cmd = '';
        if (Math.floor(prev.x / w) > Math.floor(curr.x / w)) {
            cmd = 'L';
        } else if (Math.floor(prev.x / w) < Math.floor(curr.x / w)) {
            cmd = 'R';
        } else if (Math.floor(prev.y / h) > Math.floor(curr.y / h)) {
            cmd = 'D';
        } else if (Math.floor(prev.y / h) < Math.floor(curr.y / h)) {
            cmd = 'U';
        } else {
            // XXX: Count lambdas???
        }

        if (cmd) clone.moves[i] += cmd;
    }

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

    this.trampolines = {};
    this.trampolineTargets = {};
    this.lambdas = [];
    this.rocks = [];
    this.hoRocks = [];
    this.beards = [];
    this.lift = null;
    this.player = null;

    if (Array.isArray(source)) {
        this.subtiles = source;
        this.pos3 = this.subtiles[0].pos2;
        source.forEach(function(s) {
            lifter.utils.extend(this.trampolines, s.trampolines);
            lifter.utils.extend(this.trampolineTargets, s.trampolineTargets);
            this.lambdas.push.apply(this.lambdas, s.lambdas); // TODO: perf
            this.rocks.push.apply(this.rocks, s.rocks);
            this.hoRocks.push.apply(this.hoRocks, s.hoRocks);
            this.beards.push.apply(this.beards, s.beards);
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
            case 'W':
                this.beards.push(this.pos1);
                break;
            case 'A': case 'B': case 'C': case 'D': case 'E': case 'F': case 'G': case 'H': case 'I':
                this.trampolines[source] = this.pos1;
                break;
            case '1': case '2': case '3': case '4': case '5': case '6': case '7': case '8': case '9':
                this.trampolineTargets[source] = this.pos1;
                break;
            case '\\':
                this.lambdas.push(this.pos1);
                break;
            case '*':
                this.rocks.push(this.pos1);
                break;
            case '@':
                this.hoRocks.push(this.pos1);
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

    var subsets = [[], [], [], []];

    sets.forEach(function(set) {
        subsets[this.subtileIndex(set.pos)].push(set);
    }, this)

    return new Tile(
        this.subtiles.map(function(tile, i) {
            return tile.update(subsets[i])
        }),
        this.pos1,
        this.pos2,
        this.level)
};

Tile.prototype.get = function get(pos) {
    if (pos.x < this.pos1.x || pos.x >= this.pos2.x ||
        pos.y < this.pos1.y || pos.y >= this.pos2.y) {
        throw new Error('' + pos.x + ':' + pos.y + ' is outside tile');
    }
    if (this.data) return this.data;

    return this.subtiles[this.subtileIndex(pos)].get(pos);
};

Tile.prototype.getSubtile = function getSubtile(pos, level) {
    if (level === this.level) return this;
    return this.subtiles[this.subtileIndex(pos)].getSubtile(pos, level);
};

Tile.prototype.subtileIndex = function subtileIndex(pos) {
    var X = pos.x < this.pos3.x ? 0 : 1,
        Y = pos.y < this.pos3.y ? 0 : 1;

    return 2 * Y + X;
};

Tile.prototype.serializeByGet = function serializeByGet() {
    var res = [];
    for(var y = this.pos1.y; y < this.pos2.y; y++) {
        var resJ = '';
        for(var x = this.pos1.x; x < this.pos2.x; x++) {
            resJ += this.get({ x: x, y: y });
        }
        res.push(resJ);
    }
    return res.join('\n');
};

var blaOptions = {
    '': [ ['R', 'D'], ['L', 'D'], ['R', 'U'], ['L', 'U'] ],
    U: [ ['U'], ['U'], [], [] ],
    R: [ [], ['R'], [], ['R'] ],
    D: [ [], [], ['D'], ['D'] ],
    L: [ ['L'], [], ['L'], [] ],
    W: [ [], [], [], [] ]
};

function bla (map, level, cmd) {

    function PHI(task) {
        //console.log('PHI', task.cmd, task.level);
        //var tile = task.map.tiles.getSubtile(task.map.player, task.level);
        //return Math.random() + 1;
        if (!task.parent) return 1;
        var phi = task.cmd === task.parent.cmd ? 1 : 0.5;
        phi *= task.parent.phi;
        phi /= (task.map.moves.length + 1);
        //if (task.cmd === ({ U: 'D', D: 'U', R: 'L', L: 'R', W: 'W' })[task.map.moves[task.map.moves.length - 1]])
            //phi /= 1000;
        return phi;
    }

    var queues = [];

    function addToQueues(task) {
        var level = task.level;
        task.phi = PHI(task);
        (queues[level] || (queues[level] = [])).push(task);
        //if (task.map.moves === 'UU' && task.cmd === 'R') console.log(task);
    }

    addToQueues({ map: map, level: level, cmd: cmd, next: null, parent: null });

    while(true) { // TODO: sigterm
        for (var i = 0; i < queues.length; i++) {
            var queue = queues[i];
            if (!queue || !queue.length) continue;
            queue.sort(function(task1, task2) { return task2.phi - task1.phi });
            for (var j = 0; j < 10; j++) {
                if (!queue.length) break;
                step(queue.shift());
            }
        }
    }


    function step (task) {
        //console.log('step', task.cmd, task.level, '\n' + task.map.tiles.serializeByGet());
        //console.log(task.map.moves, task.phi, task.cmd, task.level);
        var map = task.map,
            level = task.level,
            cmd = task.cmd,
            next = task.next,
            tile = map.tiles.getSubtile(map.player, level);

        if (tile.data) {
            var map2 = map.playerAction(cmd);
            if (map2.revision == map.revision && cmd !== 'W') return;
            map2 = map2.step();
            if (!next) {
                console.log(map2.moves);
                return;
            }
            addToQueues({ map: map2, level: next.level, cmd: next.cmd, next: next.next, parent: next.parent })
            return;
        } else {
            assert(tile.subtiles);
            var subtileIndex = tile.subtileIndex(map.player);
            blaOptions[''][subtileIndex].forEach(function(cmd2) {
                addToQueues({ map: map, level: level + 1, cmd: cmd2, next: task, parent: task });
            });
            if (tile.subtiles[subtileIndex].data)
                addToQueues({ map: map, level: level + 1, cmd: 'W', next: task, parent: task });
            blaOptions[cmd][subtileIndex].forEach(function(cmd2) {
                addToQueues({ map: map, level: level + 1, cmd: cmd2, next: next, parent: task });
            });
            return;
        }
    }

}

function test () {
    var map = exports.fromString( [
        '####....####....',
        '####....####....',
        '####....####....',
        '####....####....',
        '.###....####....',
        '...#....####....',
        '. .#....####....',
        '...#....####....',
        '. .#....####....',
        '...#....####....',
        '. .#....####....',
        '# ##....####....',
        '.  #....####....',
        '...#....####....',
        '#. #....####....',
        '.R.#....####....'
        //'####',
        //'#.##',
        //'R*##',
        //'. ##'
    ].join('\n'));

    bla(map, 1, 'U').forEach(function(move) {
        console.log(move.moves);
    });

}
