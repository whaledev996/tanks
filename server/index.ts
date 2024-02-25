import { WebSocketServer } from "ws";
import { Object3D } from "three";
import { randomBytes } from 'crypto';
import express from 'express';
import { GameState, Action, Client } from '../types';

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

  constructor(id: string) {
    this.obj = new Object3D();
    this.movementSpeed = 0.05;
    this.rotationSpeed = 0.03;
    this.connection = null;
    this.id = id;
    this.sequence = 0;
  }

  step(action: Action) {
    if (action === "w") {
      this.moveForward();
    } 
    if (action === "a") {
      this.rotateLeft();
    }
    if (action === "s") {
      this.moveBackward();
    } 
    if (action === "d") {
      this.rotateRight();
    }
  }

  moveForward() {
    this.obj.translateY(this.movementSpeed);
  }

  moveBackward() {
    this.obj.translateY(-1 * this.movementSpeed);
  }

  rotateLeft() {
    this.obj.rotateZ(this.rotationSpeed)
  }

  rotateRight() {
    this.obj.rotateZ(-1 * this.rotationSpeed)
  }
}

class Game {

  id: string;
  tanks: {[id: string]: Tank}

  constructor(id: string) {
    this.id = id;
    this.tanks = {}
  }

  addPlayer(id: string) {
    this.tanks[id] = new Tank(id);
  }

  serialize(): GameState {
    const state = {}
    Object.values(this.tanks).forEach((tank) => {
      state[tank.id] = {position: [tank.obj.position.x, tank.obj.position.y, tank.obj.position.z], rotation: tank.obj.rotation.z, sequence: tank.sequence}
    })
    return state;
  }

  // broadcast game state
  step() {
    Object.values(this.tanks).forEach((tank) => {
      if (tank.connection) {
        tank.connection.send(JSON.stringify(this.serialize()));
      }
    })
  }

}

class TanksServer {

  games: {[gameId: string]: Game} = {};

  constructor() {
    this.games = {};
  }

  createGame(): Client {
    const clientId = randomBytes(8).toString('hex');
    const gameId = randomBytes(10).toString('hex');
    const game = new Game(gameId);
    game.addPlayer(clientId);
    this.games[gameId] = game;
    return {clientId: clientId, gameId: gameId};
  }

  joinGame(gameId: string): Client | undefined {
    if (gameId in this.games) {
      const game = this.games[gameId];
      const clientId = randomBytes(8).toString('hex');
      game.addPlayer(clientId);
      return {clientId: clientId, gameId: gameId};
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
    const state = {}
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

app.get('/api/test', (_, res) => 
    res.json({ greeting: "Hello" }
))

app.post('/create', (req, res) => {
  const client = tanksServer.createGame();
  console.log(tanksServer.serialize())
  res.json(client);
});

app.post('/join', (req, res) => {
  if (req.body.gameId) {
    const gameId = req.body.gameId;
    const client = tanksServer.joinGame(gameId);
    console.log(tanksServer.serialize())
    if (client) {
      res.json(client);
    } else {
      res.status(400).json({message: "unable to join game"});
    }
  }
});

if (!process.env['VITE']) {
  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  });
}

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', function connection(ws) {

   ws.on('message', function message(data) {
     const stringData = data.toString();
     const jsonData = JSON.parse(stringData);
     console.log(jsonData);
     if ('gameId' in jsonData && 'clientId' in jsonData && 'sequence' in jsonData) {
       const gameId = jsonData['gameId'];
       const clientId = jsonData['clientId'];
       const sequence = jsonData['sequence'];
       const tank = tanksServer.getPlayerForGame(gameId, clientId);
       if (tank) {
         if (tank.connection === null) {
           tank.connection = ws;
         }
         if ('action' in jsonData) {
           tank.step(jsonData['action']);
           console.log(`received sequence ${sequence}`)
           if (sequence > tank.sequence) {
             tank.sequence = sequence;
           }
         }
      }
     }
   });

});


// server game loop
// every 100 ms send game state to clients
// SERVER_TIME_STEP = 100
setInterval(function() {
  Object.values(tanksServer.games).forEach((game) => {
    game.step();
  })
}, 100)
