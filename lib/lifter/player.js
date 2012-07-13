// vim:ts=4:sw=4
var player = exports,
    lifter = require('../lifter');

//
// ### function move (map, to)
// #### @map {Map} Map instance
// #### @cmd {String} Player command
// Move player on map (and move affected blocks if needed) and return object:
// {
//   @map {Map} Map instance
//   @scored {Number} Gained score points (on this move)
// }
//
player.move = function move(map, cmd) {
    return {
        map: null,
        scored: 0,
    };
};
