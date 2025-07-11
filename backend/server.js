const http = require('http');
const { initializeGame } = require('./gameInit');

const PORT = 3001;

function parseBody(req, callback) {
  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', () => {
    try {
      const data = JSON.parse(body);
      callback(null, data);
    } catch (err) {
      callback(err);
    }
  });
}

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/start') {
    // Inicializar una nueva partida
    const gameState = initializeGame();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(gameState));
  } else if (req.method === 'POST' && req.url === '/play') {
    // Jugar una carta
    parseBody(req, (err, body) => {
      if (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
        return;
      }
      // Aquí deberías actualizar el estado del juego según la carta jugada
      // Por ahora, respondemos con un estado simulado
      const updatedGameState = initializeGame();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(updatedGameState));
    });
  } else if (req.method === 'POST' && req.url === '/draw') {
    // Robar una carta
    parseBody(req, (err, body) => {
      if (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
        return;
      }
      // Aquí deberías actualizar el estado del juego tras robar una carta
      // Por ahora, respondemos con un estado simulado
      const updatedGameState = initializeGame();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(updatedGameState));
    });
  } else if (req.method === 'POST' && req.url === '/uno') {
    // Decir uno
    parseBody(req, (err, body) => {
      if (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
        return;
      }
      // Aquí deberías actualizar el estado del juego tras decir uno
      // Por ahora, respondemos con un estado simulado
      const updatedGameState = initializeGame();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(updatedGameState));
    });
  } else if (req.method === 'POST' && req.url === '/new-round') {
    // Iniciar una nueva ronda
    parseBody(req, (err, body) => {
      if (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
        return;
      }
      // Aquí deberías actualizar el estado del juego para una nueva ronda
      // Por ahora, respondemos con un estado simulado
      const updatedGameState = initializeGame();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(updatedGameState));
    });
  } else {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('UNO server is running!');
  }
});

server.listen(PORT, () => {
  console.log(`UNO server listening at http://localhost:${PORT}`);
});



