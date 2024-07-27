"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tank = void 0;
// WE WANT ALL THIS CODE TO WORK ON CLIENT+SERVER with no changes!!!!!!!
//
// Y IS UP!!!!!!!!!
/*
 * class Game
 *    act(input), given an input to the game, do something
 *      eg. move tank, shoot bullet, etc..
 *
 * In client, we can initalize this at the start of app, same with server
 * all we do is process inputs and do other things
 *
 * subobjects will have "views" (Mesh/Group/Object3D) passed in
 */
// a shared Tank to be used between client and server
var Tank = /** @class */ (function () {
    function Tank(obj, ghost) {
        this.obj = obj;
        this.ghost = ghost;
    }
    Tank.prototype.handleInput = function (a) {
        if (a === "w") {
        }
    };
    return Tank;
}());
exports.Tank = Tank;
