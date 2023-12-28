import asyncio
import json
import secrets
from websockets.server import serve
from websockets import ConnectionClosedOK
from game import TanksServer

JOIN = {}

async def handler(websocket):
    message = await websocket.recv()
    event = json.loads(message)
    assert event["type"] == "init"
    if "join" in event:
        #await join(websocket)
        pass
    else:
        print("initializing tanks game")
        await start(websocket)

async def start(websocket):
    connected = {websocket}
    join_key = secrets.token_urlsafe(12)
    tanks_server = TanksServer()
    JOIN[join_key] = tanks_server, connected
    await play(websocket, tanks_server)

    # while True:
    #     try:
    #         message = await websocket.recv()
    #     except ConnectionClosedOK:
    #         break
    #     print(message)

async def play(websocket, tanks_server):
    async for message in websocket:
        print(message)


async def main():
    async with serve(handler, "", 8765):
        await asyncio.Future()  # run forever

asyncio.run(main())
