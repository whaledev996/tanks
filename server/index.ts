import { WebSocketServer } from "ws";
import { Group } from "three";
import { randomBytes } from "crypto";
import express from "express";
import { KeyInput } from "../types";
import { Game as TanksGame } from "../game";
import { TanksMap, map1 } from "../map";

// class that manages all clients

class Client extends TanksGame {
  // TODO: not sure what type this is
  connection: any;
  keysPressed: KeyInput[];
  timestamp: number;

  constructor(obj: Group, map: TanksMap, gameId: string, clientId: string) {
    super(obj, map, gameId, clientId);
    this.keysPressed = [];
    this.timestamp = 0;
  }
}

class TanksServerGame {
  gameId: string;
  clients: { [clientId: string]: Client };

  constructor(gameId: string) {
    this.gameId = gameId;
    this.clients = {};
  }

  addClient(clientId: string, client: Client) {
    this.clients[clientId] = client;
  }

  addConnection(clientId: string, ws: WebSocket) {
    if (clientId in this.clients) {
      this.clients[clientId].connection = ws;
    }
  }

  hasConnection(clientId: string): boolean {
    if (clientId in this.clients) {
      return !!this.clients[clientId].connection;
    }
    return false;
  }

  getClient(clientId: string): Client | null {
    if (clientId in this.clients) {
      return this.clients[clientId];
    }
    return null;
  }

  step(delta: number) {
    for (const [_, client] of Object.entries(this.clients)) {
      client.step(client.keysPressed, delta);
    }
  }

  serialize() {
    const state = {};
    // TODO: make this a function within playerTank.ts
    for (const [clientId, client] of Object.entries(this.clients)) {
      const projectiles = client.playerTank.projectiles.map((p) => {
        return {
          id: p.projectile.geometry.id,
          position: [
            p.projectile.position.x,
            p.projectile.position.y,
            p.projectile.position.z,
          ],
          rotation: [p.projectile.rotation.x, p.projectile.rotation.y],
          direction: p.direction,
        };
      });
      state[clientId] = {
        position: [
          client.playerTank.tank.position.x,
          client.playerTank.tank.position.y,
          client.playerTank.tank.position.z,
        ],
        cannonDirection: [
          client.playerTank.cannonDirection.x,
          client.playerTank.cannonDirection.y,
          client.playerTank.cannonDirection.z,
        ],
        projectiles: projectiles,
        rotation: client.playerTank.tank.rotation.z,
        timestamp: Date.now(),
      };
    }
    return state;
  }

  send() {
    const state = JSON.stringify(this.serialize());
    for (const [_, client] of Object.entries(this.clients)) {
      if (client.connection) {
        client.connection.send(state);
      }
    }
  }
}

class TanksServer {
  games: { [gameId: string]: TanksServerGame } = {};

  constructor() {
    this.games = {};
  }

  createGame() {
    const clientId = randomBytes(8).toString("hex");
    const gameId = randomBytes(10).toString("hex");
    // create the game and first client
    const game = new TanksServerGame(gameId);
    const client = new Client(new Group(), map1, gameId, clientId);
    game.addClient(clientId, client);
    client.playerTank.tank.position.set(...map1.startingPosition);
    this.games[gameId] = game;

    // TODO: this clientId + gameId mechanism seems too basic
    return { clientId: clientId, gameId: gameId };
  }

  joinGame(gameId: string) {
    // TODO: perform some auth
    if (gameId in this.games) {
      const game = this.games[gameId];
      const clientId = randomBytes(8).toString("hex");
      const client = new Client(new Group(), map1, gameId, clientId);
      Object.values(game.clients).forEach((existingClient) => {
        existingClient.joinGame(clientId, client.playerTank);
        client.joinGame(existingClient.clientId, existingClient.playerTank);
      });

      game.addClient(clientId, client);
      return { clientId: clientId, gameId: gameId };
    }
  }

  getGame(gameId: string): TanksServerGame | null {
    if (gameId in this.games) {
      return this.games[gameId];
    }
    return null;
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
  res.json(client);
});

app.post("/join", (req, res) => {
  if (req.body.gameId) {
    const gameId = req.body.gameId;
    const client = tanksServer.joinGame(gameId);
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
    if (
      "gameId" in jsonData &&
      "clientId" in jsonData &&
      "timestamp" in jsonData
    ) {
      const gameId = jsonData["gameId"];
      const clientId = jsonData["clientId"];
      const timestamp = jsonData["timestamp"];

      const game = tanksServer.getGame(gameId);
      if (game) {
        const client = game.getClient(clientId);
        if (client) {
          if (!client.connection) {
            client.connection = ws;
          }
          if ("action" in jsonData) {
            const action = jsonData["action"];
            if (Array.isArray(action)) {
              const keysPressed = action;
              // make sure we do not process messages out of order
              // TODO: do we need this??
              if (timestamp > client.timestamp) {
                client.timestamp = timestamp;
                client.keysPressed = keysPressed;
              }
            } else {
              client.handleInput(action, 0);
            }
          }
        }
      }
    }
  });
});

let tick = 0;
const secondsPerFrame = 1 / 60;
const millisecondsPerFrame = 1000 * secondsPerFrame;

// how many frames do we wait until we send an update?
const numFramesUntilUpdate = 10;

setInterval(function () {
  tick++;
  Object.values(tanksServer.games).forEach((game) => {
    if (tick % numFramesUntilUpdate == 0) {
      console.log(game.serialize());
      game.send();
    }
    game.step(secondsPerFrame);
  });
}, millisecondsPerFrame);
