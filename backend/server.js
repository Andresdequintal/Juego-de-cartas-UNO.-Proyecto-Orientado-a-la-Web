const http = require("http");
const {
  startGame,
  playCard,
  drawCard,
  nextTurn,
  sayUNO,
  newRound,
} = require("./gameLogic");
const WebSocket = require("ws");

const PORT = 3001;
const games = {};
const wsClients = {}; // gameId -> Set of ws

function parseBody(req, callback) {
  let body = "";
  req.on("data", (chunk) => {
    body += chunk;
  });
  req.on("end", () => {
    try {
      const data = JSON.parse(body);
      callback(null, data);
    } catch (err) {
      callback(err);
    }
  });
}

const server = http.createServer((req, res) => {
  // headers de CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === "POST" && req.url === "/start") {
    parseBody(req, (err, body) => {
      if (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON" }));
        return;
      }
      const gameState = startGame();
      games[gameState.gameId] = gameState;
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(serializeGameState(gameState)));
    });
  } else if (req.method === "POST" && req.url === "/play") {
    parseBody(req, (err, body) => {
      if (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON" }));
        return;
      }
      const { gameId, card, chosenColor } = body;
      const gameState = games[gameId];
      if (!gameState) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Game not found" }));
        return;
      }
      const playerIndex = gameState.currentPlayerIndex;
      playCard(gameState, playerIndex, card, chosenColor);
      nextTurn(gameState);
      broadcast(gameId, {
        type: "client_play",
        player: gameState.players[playerIndex].name,
        card,
        gameState: serializeGameState(gameState),
      });
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(serializeGameState(gameState)));
    });
  } else if (req.method === "POST" && req.url === "/draw") {
    parseBody(req, (err, body) => {
      if (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON" }));
        return;
      }
      const { gameId } = body;
      const gameState = games[gameId];
      if (!gameState) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Game not found" }));
        return;
      }
      const playerIndex = gameState.currentPlayerIndex;
      drawCard(gameState, playerIndex);
      nextTurn(gameState);
      broadcast(gameId, {
        type: "client_draw_from_deck",
        player: gameState.players[playerIndex].name,
        gameState: serializeGameState(gameState),
      });
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(serializeGameState(gameState)));
    });
  } else if (req.method === "POST" && req.url === "/uno") {
    parseBody(req, (err, body) => {
      if (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON" }));
        return;
      }
      const { gameId } = body;
      const gameState = games[gameId];
      if (!gameState) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Game not found" }));
        return;
      }
      const playerIndex = gameState.currentPlayerIndex;
      sayUNO(gameState, playerIndex);
      broadcast(gameId, {
        type: "client_uno",
        player: gameState.players[playerIndex].name,
        gameState: serializeGameState(gameState),
      });
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(serializeGameState(gameState)));
    });
  } else if (req.method === "POST" && req.url === "/new-round") {
    parseBody(req, (err, body) => {
      if (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON" }));
        return;
      }
      const { gameId } = body;
      const gameState = games[gameId];
      if (!gameState) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Game not found" }));
        return;
      }
      newRound(gameState);
      broadcast(gameId, {
        type: "round_score",
        winner: gameState.players[gameState.currentPlayerIndex].name,
        winnerIdx: gameState.currentPlayerIndex,
        roundScore: gameState.scores[gameState.currentPlayerIndex],
        scores: gameState.scores,
        gameState: serializeGameState(gameState),
      });
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(serializeGameState(gameState)));
    });
  } else if (req.method === "POST" && req.url === "/join") {
    parseBody(req, (err, body) => {
      if (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON" }));
        return;
      }
      const { gameId } = body;
      const gameState = games[gameId];
      if (!gameState) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Game not found" }));
        return;
      }
      // Añadir un nuevo jugador
      const playerNum = gameState.players.length + 1;
      const newPlayer = {
        id: "player" + playerNum,
        name: "Player " + playerNum,
        cards: [],
        points: 0,
        saidUNO: false,
        isHuman: true,
      };
      // Repartir 7 cartas al nuevo jugador
      for (let j = 0; j < 7; j++) {
        if (gameState.deck.length > 0) {
          newPlayer.cards.push(gameState.deck.pop());
        }
      }
      gameState.players.push(newPlayer);
      gameState.scores.push(0);
      // Notificar a todos los clientes conectados
      broadcast(gameId, {
        type: "player_joined",
        player: newPlayer.name,
        gameState: serializeGameState(gameState),
      });
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(serializeGameState(gameState)));
    });
  } else {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("UNO server is running!");
  }
});

function serializeGameState(gameState) {
  return {
    finished: gameState.finished,
    clientCards: gameState.players[0].cards,
    currentColor: gameState.currentColor,
    direction: gameState.direction,
    discardPile: gameState.discardPile[gameState.discardPile.length - 1],
    gameId: gameState.gameId,
    otherPlayers: gameState.players
      .slice(1)
      .map((p) => ({ name: p.name, count: p.cards.length })),
    scores: gameState.scores,
    turn: gameState.currentPlayerIndex,
  };
}

// --- WebSocket server ---
const wss = new WebSocket.Server({ server });
wss.on("connection", (ws) => {
  let subscribedGameId = null;
  ws.on("message", (data) => {
    try {
      const msg = JSON.parse(data);
      if (msg.type === "subscribe" && msg.gameId) {
        subscribedGameId = msg.gameId;
        if (!wsClients[subscribedGameId])
          wsClients[subscribedGameId] = new Set();
        wsClients[subscribedGameId].add(ws);
        ws.send(
          JSON.stringify({ type: "subscribed", gameId: subscribedGameId })
        );
      }
    } catch (e) {}
  });
  ws.on("close", () => {
    if (subscribedGameId && wsClients[subscribedGameId]) {
      wsClients[subscribedGameId].delete(ws);
      if (wsClients[subscribedGameId].size === 0)
        delete wsClients[subscribedGameId];
    }
  });
});

function broadcast(gameId, msg) {
  if (wsClients[gameId]) {
    for (const ws of wsClients[gameId]) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(msg));
      }
    }
  }
}

server.listen(PORT, () => {
  console.log(`UNO server listening at http://localhost:${PORT}`);
});
