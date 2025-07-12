const colors = ['red', 'green', 'blue', 'yellow'];
const specialCards = ['jump', 'reverse', 'draw2'];
const wildCards = ['wild', 'draw4'];

function createDeck() {
    let deck = [];
    colors.forEach(color => {
        for (let n = 0; n <= 9; n++) {
            deck.push({ id: `${color}-${n}-${Math.random()}`, color, type: 'number', value: n });
            if (n !== 0) deck.push({ id: `${color}-${n}-${Math.random()}`, color, type: 'number', value: n });
        }
        for (let i = 0; i < 2; i++) {
            deck.push({ id: `${color}-jump-${Math.random()}`, color, type: 'special', value: 'jump' });
            deck.push({ id: `${color}-reverse-${Math.random()}`, color, type: 'special', value: 'reverse' });
            deck.push({ id: `${color}-draw2-${Math.random()}`, color, type: 'special', value: 'draw2' });
        }
    });
    for (let i = 0; i < 4; i++) {
        deck.push({ id: `wild-${Math.random()}`, color: null, type: 'wild', value: 'wild' });
        deck.push({ id: `draw4-${Math.random()}`, color: null, type: 'wild', value: 'draw4' });
    }
    deck = deck.sort(() => Math.random() - 0.5);
    return deck;
}

function dealCards(deck, numPlayers) {
    const players = [];
    for (let i = 0; i < numPlayers; i++) {
        players.push({
            id: 'player' + (i + 1),
            name: 'Player ' + (i + 1),
            cards: [],
            points: 0,
            saidUNO: false,
            isHuman: i === 0
        });
    }
    for (let i = 0; i < players.length; i++) {
        for (let j = 0; j < 7; j++) {
            players[i].cards.push(deck.pop());
        }
    }
    return players;
}

function startGame(numPlayers = 4) {
    const deck = createDeck();
    const players = dealCards(deck, numPlayers);
    const discardPile = [deck.pop()];
    return {
        finished: false,
        players,
        currentPlayerIndex: 0,
        direction: 1,
        currentColor: discardPile[0].color,
        discardPile,
        deck,
        scores: players.map(p => p.points),
        turn: 0,
        gameId: generateGameId(),
    };
}

function playCard(gameState, playerIndex, card, chosenColor = null) {
    const player = gameState.players[playerIndex];
    const cardIdx = player.cards.findIndex(c => c.id === card.id);
    if (cardIdx === -1) return false;
    // Validar jugada
    const top = gameState.discardPile[gameState.discardPile.length - 1];
    const colorToMatch = gameState.currentColor || top.color;
    if (
        card.color === colorToMatch ||
        card.value === top.value ||
        card.type === 'wild'
    ) {
        player.cards.splice(cardIdx, 1);
        gameState.discardPile.push(card);
        if (card.type === 'special') {
            if (card.value === 'jump') {
                nextTurn(gameState, true); // Salta turno
            }
            if (card.value === 'reverse') {
                gameState.direction *= -1;
                if (gameState.players.length === 2) nextTurn(gameState, true);
            }
            if (card.value === 'draw2') {
                const next = (gameState.currentPlayerIndex + gameState.direction + gameState.players.length) % gameState.players.length;
                drawCard(gameState, next);
                drawCard(gameState, next);
                nextTurn(gameState, true);
            }
            gameState.currentColor = card.color;
        }
        if (card.type === 'wild') {
            gameState.currentColor = chosenColor || colors[Math.floor(Math.random() * 4)];
            if (card.value === 'draw4') {
                const next = (gameState.currentPlayerIndex + gameState.direction + gameState.players.length) % gameState.players.length;
                for (let i = 0; i < 4; i++) drawCard(gameState, next);
                nextTurn(gameState, true);
            }
        }
        if (card.type !== 'wild') {
            gameState.currentColor = card.color;
        }
        // Verificar si el jugador ganó
        if (player.cards.length === 0) {
            gameState.finished = true;
            countPoints(gameState, playerIndex);
        }
        return true;
    }
    return false;
}

function drawCard(gameState, playerIndex) {
    if (gameState.deck.length === 0) return;
    const card = gameState.deck.pop();
    gameState.players[playerIndex].cards.push(card);
}

function nextTurn(gameState, skip = false) {
    if (skip) {
        gameState.currentPlayerIndex = (gameState.currentPlayerIndex + gameState.direction * 2 + gameState.players.length) % gameState.players.length;
    } else {
        gameState.currentPlayerIndex = (gameState.currentPlayerIndex + gameState.direction + gameState.players.length) % gameState.players.length;
    }
    gameState.turn++;
}

function sayUNO(gameState, playerIndex) {
    gameState.players[playerIndex].saidUNO = true;
}

function countPoints(gameState, winnerIndex) {
    let points = 0;
    gameState.players.forEach((p, i) => {
        if (i !== winnerIndex) {
            p.cards.forEach(card => {
                if (card.type === 'number') points += card.value;
                else if (card.value === 'draw2' || card.value === 'reverse' || card.value === 'jump') points += 20;
                else points += 50;
            });
        }
    });
    gameState.players[winnerIndex].points += points;
    gameState.scores = gameState.players.map(p => p.points);
}

function newRound(gameState) {
    // Mantiene los puntos, reinicia mazo y manos
    const deck = createDeck();
    for (let i = 0; i < gameState.players.length; i++) {
        gameState.players[i].cards = [];
        for (let j = 0; j < 7; j++) {
            gameState.players[i].cards.push(deck.pop());
        }
        gameState.players[i].saidUNO = false;
    }
    gameState.deck = deck;
    gameState.discardPile = [deck.pop()];
    gameState.currentPlayerIndex = 0;
    gameState.direction = 1;
    gameState.currentColor = gameState.discardPile[0].color;
    gameState.finished = false;
    gameState.turn = 0;
}

function generateGameId() {
    return Math.random().toString(36).substr(2, 16);
}

module.exports = {
    startGame,
    playCard,
    drawCard,
    nextTurn,
    sayUNO,
    newRound,
}; 