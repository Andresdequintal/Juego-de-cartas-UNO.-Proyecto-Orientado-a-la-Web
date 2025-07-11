// Lógica de inicialización del juego irá aquí 

function initializeGame() {
  return {
    finished: false,
    clientCards: [
      { id: '53', color: 'green', type: 'number', value: '2' },
      { id: '14', color: 'red', type: 'number', value: '2' },
      { id: '50', color: 'green', type: 'number', value: '4' },
      { id: '27', color: 'yellow', type: 'number', value: '4' },
      { id: '91', color: 'blue', type: 'number', value: '9' }
    ],
    currentColor: 'red',
    direction: 1,
    discardPile: { id: '16', color: 'red', type: 'number', value: '8' },
    gameId: 'c148112d-6f7f-4cc4-a74c-d584823eb4b6',
    finished: false,
    otherPlayers: [
      { name: 'Player 2', count: 7 },
      { name: 'Player 3', count: 7 },
      { name: 'Player 4', count: 7 }
    ],
    scores: [0, 0, 0, 0],
    turn: 0
  };
}

module.exports = { initializeGame }; 