import { WebSocketServer } from "ws";
import { Object3D } from "three";
import { randomBytes } from "crypto";
import express from "express";
import { GameState, Action, Client } from "../types";
// import { ColladaLoader } from "three/examples/jsm/loaders/ColladaLoader";
// import { Tank as PlayerTank } from "../tank";

interface TanksServerState {
  [gameId: string]: GameState;
}

class Tank {
  id: string;
  sequence: number;
  obj: Object3D;
  movementSpeed: number;
  rotationSpeed: number;
  connection: any;
  delta: number;
  keysPressed: string[];

  constructor(id: string) {
    this.obj = new Object3D();
    this.movementSpeed = 2;
    this.rotationSpeed = 2;
    this.connection = null;
    this.id = id;
    this.sequence = 0;
    this.delta = 1 / 60;
    this.keysPressed = [];
  }

  step() {
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
  }

  moveForward() {
    this.obj.translateY(this.movementSpeed * this.delta);
  }

  moveBackward() {
    this.obj.translateY(-1 * this.movementSpeed * this.delta);
  }

  rotateLeft() {
    this.obj.rotateZ(this.rotationSpeed * this.delta);
  }

  rotateRight() {
    this.obj.rotateZ(-1 * this.rotationSpeed * this.delta);
  }
}

class Game {
  id: string;
  tanks: { [id: string]: Tank };

  constructor(id: string) {
    this.id = id;
    this.tanks = {};
  }

  addPlayer(id: string) {
    this.tanks[id] = new Tank(id);
  }

  serialize(): GameState {
    const state = {};
    Object.values(this.tanks).forEach((tank) => {
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
  }

  // broadcast game state
  step() {
    Object.values(this.tanks).forEach((tank) => {
      if (tank.connection) {
        tank.connection.send(JSON.stringify(this.serialize()));
      }
    });
  }
}

class TanksServer {
  games: { [gameId: string]: Game } = {};

  constructor() {
    this.games = {};
  }

  createGame(): Client {
    const clientId = randomBytes(8).toString("hex");
    const gameId = randomBytes(10).toString("hex");
    const game = new Game(gameId);
    // const t = new PlayerTank();
    game.addPlayer(clientId);
    this.games[gameId] = game;
    return { clientId: clientId, gameId: gameId };
  }

  joinGame(gameId: string): Client | undefined {
    if (gameId in this.games) {
      const game = this.games[gameId];
      const clientId = randomBytes(8).toString("hex");
      game.addPlayer(clientId);
      return { clientId: clientId, gameId: gameId };
    }
  }

  getPlayerForGame(gameId: string, clientId: string): Tank | undefined {
    if (gameId in this.games) {
      const game = this.games[gameId];
      if (clientId in game.tanks) {
        return game.tanks[clientId];
      }
    }
  }

  serialize(): TanksServerState {
    const state = {};
    for (const [gameId, game] of Object.entries(this.games)) {
      state[gameId] = game.serialize();
    }
    return state;
  }
}

const tanksServer = new TanksServer();

// on /create, create the game, respond with client id, and game id,
// on /join?{gameId}, add player to the game, respond with  client id
// how do we not get hacked?
// client establishes websocket connection and passes in client id for everything
export const app = express();
const port = 8000;

app.use(express.json());

app.get("/api/test", (_, res) => res.json({ greeting: "Hello" }));

app.post("/create", (req, res) => {
  const client = tanksServer.createGame();
  //////console.log(tanksServer.serialize())
  res.json(client);
});

app.post("/join", (req, res) => {
  if (req.body.gameId) {
    const gameId = req.body.gameId;
    const client = tanksServer.joinGame(gameId);
    ////console.log(tanksServer.serialize())
    if (client) {
      res.json(client);
    } else {
      res.status(400).json({ message: "unable to join game" });
    }
  }
});

if (!process.env["VITE"]) {
  app.listen(port, () => {
    //console.log(`Example app listening on port ${port}`)
  });
}

const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", function connection(ws) {
  ws.on("message", function message(data) {
    const stringData = data.toString();
    const jsonData = JSON.parse(stringData);
    //////console.log(jsonData);
    if (
      "gameId" in jsonData &&
      "clientId" in jsonData &&
      "sequence" in jsonData
    ) {
      const gameId = jsonData["gameId"];
      const clientId = jsonData["clientId"];
      const sequence = jsonData["sequence"];
      const tank = tanksServer.getPlayerForGame(gameId, clientId);
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

// const loader = new ColladaLoader();
// loader.load("test.dae", (collada) => {
//   console.log(collada);
// });

// server game loop
// 60 fps game loop to calculate physics
//setInterval(function() {

//}, 1000 / 60)

// every 100 ms send game state to clients
let tick = 0;
setInterval(function () {
  tick++;
  Object.values(tanksServer.games).forEach((game) => {
    if (tick % 10 == 0) {
      game.step();
    }
    Object.values(game.tanks).forEach((tank) => {
      tank.step();
      //console.log(tank.obj.position);
      //console.log(tank.
    });
  });
}, 1000 / 60);
