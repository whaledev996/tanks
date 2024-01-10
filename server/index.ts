import { WebSocketServer, WebSocket } from "ws";
import { Object3D } from "three";
import { createServer } from "http";
import { randomBytes } from 'crypto';
import { parse } from 'url';
import express from 'express';

const wss = new WebSocketServer({ port: 8080 });
const games = {};

class Tank {

  constructor(id) {
    this.tank = new Object3D();
    this.movementSpeed = 0.05;
    this.rotationSpeed = 0.03;
    this.connection = null;
    this.id = id;
  }

  step(action) {
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
    this.tank.translateY(this.movementSpeed);
  }

  moveBackward() {
    this.tank.translateY(-1 * this.movementSpeed);
  }

  rotateLeft() {
    this.tank.rotateZ(this.rotationSpeed)
  }

  rotateRight() {
    this.tank.rotateZ(-1 * this.rotationSpeed)
  }
}


class Game {

  constructor(id) {
    this.id = id;
    this.tanks = {}
  }

  addPlayer(id) {
    this.tanks[id] = new Tank(id);
  }

  serialize() {
    const state = {}
    Object.values(this.tanks).forEach((tank) => {
      state[tank.id] = [tank.tank.position.x, tank.tank.position.y, tank.tank.position.z]
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

wss.on('connection', function connection(ws) {
  // ws.on('error', console.error);

   ws.on('message', function message(data) {
     const stringData = data.toString();
     const jsonData = JSON.parse(stringData);
     if ('gameId' in jsonData && 'clientId' in jsonData) {
       const gameId = jsonData['gameId'];
       const clientId = jsonData['clientId'];
       if (gameId in games && clientId in games[gameId].tanks) {
         const tank = games[gameId].tanks[clientId];
         if (tank.connection === null) {
           tank.connection = ws;
         }
         if ('action' in jsonData) {
           tank.step(jsonData['action']);
         }
       }
     }
   });

  // ws.send('something');
});

// server game loop
// every 100 ms send game state to clients
setInterval(function() {
  Object.values(games).forEach((game) => {
    game.step();
  })
}, 100)
//
//
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
  console.log('running create');
  const clientId = randomBytes(8).toString('hex');
  const gameId = randomBytes(10).toString('hex');
  const g = new Game(gameId);
  g.addPlayer(clientId);
  games[gameId] = g;
  console.log(games);
  res.set('Access-Control-Allow-Origin', '*');
  res.send(JSON.stringify({gameId: gameId, clientId: clientId}));
});

app.post('/join', (req, res) => {
  console.log(req.body);
  if (req.body.gameId) {
    const gameId = req.body.gameId;
    const game = games[gameId];
    const clientId = randomBytes(8).toString('hex');
    game.addPlayer(clientId);
    console.log(games);
    res.send(JSON.stringify({gameId: game.id, clientId: clientId}));
  }
});

//app.listen(port, () => {
//  console.log(`Example app listening on port ${port}`)
//});
