"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
var ws_1 = require("ws");
var three_1 = require("three");
var crypto_1 = require("crypto");
var express_1 = require("express");
var ColladaLoader_1 = require("three/examples/jsm/loaders/ColladaLoader");
var tank_1 = require("../tank");
var Tank = /** @class */ (function () {
    function Tank(id) {
        this.obj = new three_1.Object3D();
        this.movementSpeed = 2;
        this.rotationSpeed = 2;
        this.connection = null;
        this.id = id;
        this.sequence = 0;
        this.delta = 1 / 60;
        this.keysPressed = [];
    }
    Tank.prototype.step = function () {
        if (this.keysPressed.includes("w")) {
            this.moveForward();
        }
        if (this.keysPressed.includes("a")) {
            this.rotateLeft();
        }
        if (this.keysPressed.includes("s")) {
            this.moveBackward();
        }
        if (this.keysPressed.includes("d")) {
            this.rotateRight();
        }
    };
    Tank.prototype.moveForward = function () {
        this.obj.translateY(this.movementSpeed * this.delta);
    };
    Tank.prototype.moveBackward = function () {
        this.obj.translateY(-1 * this.movementSpeed * this.delta);
    };
    Tank.prototype.rotateLeft = function () {
        this.obj.rotateZ(this.rotationSpeed * this.delta);
    };
    Tank.prototype.rotateRight = function () {
        this.obj.rotateZ(-1 * this.rotationSpeed * this.delta);
    };
    return Tank;
}());
var Game = /** @class */ (function () {
    function Game(id) {
        this.id = id;
        this.tanks = {};
    }
    Game.prototype.addPlayer = function (id) {
        this.tanks[id] = new Tank(id);
    };
    Game.prototype.serialize = function () {
        var state = {};
        Object.values(this.tanks).forEach(function (tank) {
            state[tank.id] = {
                position: [
                    tank.obj.position.x,
                    tank.obj.position.y,
                    tank.obj.position.z,
                ],
                rotation: tank.obj.rotation.z,
                sequence: Date.now(),
            };
        });
        return state;
    };
    // broadcast game state
    Game.prototype.step = function () {
        var _this = this;
        Object.values(this.tanks).forEach(function (tank) {
            if (tank.connection) {
                tank.connection.send(JSON.stringify(_this.serialize()));
            }
        });
    };
    return Game;
}());
var TanksServer = /** @class */ (function () {
    function TanksServer() {
        this.games = {};
        this.games = {};
    }
    TanksServer.prototype.createGame = function () {
        var clientId = (0, crypto_1.randomBytes)(8).toString("hex");
        var gameId = (0, crypto_1.randomBytes)(10).toString("hex");
        var game = new Game(gameId);
        var t = new tank_1.Tank();
        game.addPlayer(clientId);
        this.games[gameId] = game;
        return { clientId: clientId, gameId: gameId };
    };
    TanksServer.prototype.joinGame = function (gameId) {
        if (gameId in this.games) {
            var game = this.games[gameId];
            var clientId = (0, crypto_1.randomBytes)(8).toString("hex");
            game.addPlayer(clientId);
            return { clientId: clientId, gameId: gameId };
        }
    };
    TanksServer.prototype.getPlayerForGame = function (gameId, clientId) {
        if (gameId in this.games) {
            var game = this.games[gameId];
            if (clientId in game.tanks) {
                return game.tanks[clientId];
            }
        }
    };
    TanksServer.prototype.serialize = function () {
        var state = {};
        for (var _i = 0, _a = Object.entries(this.games); _i < _a.length; _i++) {
            var _b = _a[_i], gameId = _b[0], game = _b[1];
            state[gameId] = game.serialize();
        }
        return state;
    };
    return TanksServer;
}());
var tanksServer = new TanksServer();
// on /create, create the game, respond with client id, and game id,
// on /join?{gameId}, add player to the game, respond with  client id
// how do we not get hacked?
// client establishes websocket connection and passes in client id for everything
exports.app = (0, express_1.default)();
var port = 8000;
exports.app.use(express_1.default.json());
exports.app.get("/api/test", function (_, res) { return res.json({ greeting: "Hello" }); });
exports.app.post("/create", function (req, res) {
    var client = tanksServer.createGame();
    //////console.log(tanksServer.serialize())
    res.json(client);
});
exports.app.post("/join", function (req, res) {
    if (req.body.gameId) {
        var gameId = req.body.gameId;
        var client = tanksServer.joinGame(gameId);
        ////console.log(tanksServer.serialize())
        if (client) {
            res.json(client);
        }
        else {
            res.status(400).json({ message: "unable to join game" });
        }
    }
});
if (!process.env["VITE"]) {
    exports.app.listen(port, function () {
        //console.log(`Example app listening on port ${port}`)
    });
}
var wss = new ws_1.WebSocketServer({ port: 8080 });
wss.on("connection", function connection(ws) {
    ws.on("message", function message(data) {
        var stringData = data.toString();
        var jsonData = JSON.parse(stringData);
        //////console.log(jsonData);
        if ("gameId" in jsonData &&
            "clientId" in jsonData &&
            "sequence" in jsonData) {
            var gameId = jsonData["gameId"];
            var clientId = jsonData["clientId"];
            var sequence = jsonData["sequence"];
            var tank = tanksServer.getPlayerForGame(gameId, clientId);
            if (tank) {
                if (tank.connection === null) {
                    tank.connection = ws;
                }
                if ("action" in jsonData) {
                    // tank.step(jsonData['action']);
                    tank.keysPressed = jsonData["action"];
                    ////console.log(`received sequence ${sequence}`)
                    if (sequence > tank.sequence) {
                        tank.sequence = sequence;
                    }
                }
            }
        }
    });
});
var loader = new ColladaLoader_1.ColladaLoader();
loader.load("test.dae", function (collada) {
    console.log(collada);
});
// server game loop
// 60 fps game loop to calculate physics
//setInterval(function() {
//}, 1000 / 60)
// every 100 ms send game state to clients
var tick = 0;
setInterval(function () {
    tick++;
    Object.values(tanksServer.games).forEach(function (game) {
        if (tick % 10 == 0) {
            game.step();
        }
        Object.values(game.tanks).forEach(function (tank) {
            tank.step();
            //console.log(tank.obj.position);
            //console.log(tank.
        });
    });
}, 1000 / 60);
