let deck=[];
let bombed=0;
let discardPile=[];
const colors=['red','green','blue','yellow'];
const specialCards=['jump','reverse','draw2']

let players=[];
let currentPlayerIndex=0;
let direction=1;
let currentColor = null; // Color actual del juego (para comodines)
let over=0; //si la ronda se ha acabado

const card = {
    id:'R-5',
    color:'red',
    type:'number',
    value:5
};

const player={
    id:'player1',
    name:'Stephanie',
    cards:[],
    points:0,
    saidUNO:false,
    isHuman:true
};

function initializeDeck(){
    deck = [];
    // cartas (0-9, 2 de cada una)
    colors.forEach(color => {
        for(let n=0; n<=9; n++) {
            deck.push({color, type:'number', value:n});
            if(n!==0) deck.push({color, type:'number', value:n});
        }
        // Cartas especiales: salto, reversa, roba 2 (2 de cada una por color)
        for(let i=0; i<2; i++) {
            deck.push({color, type:'special', value:'jump'});
            deck.push({color, type:'special', value:'reverse'});
            deck.push({color, type:'special', value:'draw2'});
        }
    });
    // Comodines (4 de cada uno)
    for(let i=0; i<4; i++) {
        deck.push({color:null, type:'wild', value:'wild'});
        deck.push({color:null, type:'wild', value:'draw4'});
    }
    for(let i=0; i<2; i++) {
        if(localStorage.getItem('bomba')==='true'){deck.push({color:null, type:'wild', value:'bomba'})};
        if(localStorage.getItem('escudo')==='true'){deck.push({color:null, type:'wild', value:'escudo'})};
        if(localStorage.getItem('robo')==='true'){deck.push({color:null, type:'wild', value:'robo'})};
        if(localStorage.getItem('camaleon')==='true'){deck.push({color:null, type:'wild', value:'camaleon'})};
        if(localStorage.getItem('rebote')==='true'){deck.push({color:null, type:'wild', value:'rebote'})};
    }
    // Mezclar el mazo
    deck = deck.sort(()=>Math.random()-0.5);
}

function startGame(numPlayers, tipoJuego) {
    over = false;
    players = [];
    console.log('Tipo de juego seleccionado:', tipoJuego); // Depuración
    for (let i = 0; i < numPlayers; i++) {
        players.push({
            id: 'player' + (i + 1),
            name: 'Jugador ' + (i + 1),
            cards: [],
            points: 0,
            saidUNO: false,
            isHuman: (tipoJuego === 'humanos') ? true : (tipoJuego === 'bots' ? (i === 0) : false)
        });
    }
    console.log('Array de jugadores:', players); // Depuración
    currentPlayerIndex = 0;
    direction = 1;
    initializeDeck();
    dealCards();
}

function dealCards(){
    // Reparte 7 cartas a cada jugador
    for(let i=0; i<players.length; i++){
        players[i].cards = [];
        for(let j=0; j<7; j++){
            players[i].cards.push(deck.pop());
        }
    }
    // Pone la primera carta en el descarte (que no sea wild)
    let top = deck[deck.length - 1];
    while(top.type==='wild'){
        deck = deck.sort(()=>Math.random()-0.5);
        top = deck[deck.length - 1];
    }
    discardPile = [deck.pop()];
}

function mostrarSelectorColor(callback) {
    const selector = document.getElementById('selector-color');
    selector.style.display = 'flex';
    const botones = selector.querySelectorAll('.color-btn');
    botones.forEach(btn => {
        btn.onclick = () => {
            selector.style.display = 'none';
            callback(btn.getAttribute('data-color'));
        };
    });
}

function playCard(playerIndex, card) {
    const top = discardPile[discardPile.length - 1];
    const colorToMatch = currentColor || top.color;
    if (
        card.color === colorToMatch ||
        card.value === top.value ||
        card.type === 'wild'
    ) {
        const idx = players[playerIndex].cards.findIndex(c => c === card);
        if (idx !== -1) {
            players[playerIndex].cards.splice(idx, 1);
            if(card.value==='camaleon'){
                card=top
                players[playerIndex].points-=15
            }
            discardPile.push(card);

            if (card.type === 'special') {
                if (card.value === 'jump') {
                    nextTurn();
                }
                if (card.value === 'reverse') {
                    direction *= -1;
                    if (players.length === 2) nextTurn();
                }
                if (card.value === 'draw2') {
                    const next = (currentPlayerIndex + direction + players.length) % players.length;
                    drawCard(next);
                    drawCard(next);
                    nextTurn();
                }
                currentColor = card.color;
            }
            if (card.type === 'wild') {
                if (players[playerIndex].isHuman) {
                    mostrarSelectorColor(function(color) {
                        currentColor = color;
                        if(card.value==='escudo'){
                            players[playerIndex].points-=15
                        }
                        if(card.value==='robo'){
                            players[playerIndex].points-=20
                        }
                        if(card.value==='rebote'){
                            players[playerIndex].points-=10
                        }
                        if(card.value==='bomba'){
                            players[playerIndex].points-=10
                        }
                        if (card.value === 'draw4') {
                            const next = (currentPlayerIndex + direction + players.length) % players.length;
                            drawCard(next);
                            drawCard(next);
                            drawCard(next);
                            drawCard(next);
                            nextTurn();
                        }
                        mostrarTodasLasManos();
                        mostrarCartaDescarte();
                        nextTurn();
                        mostrarTodasLasManos();
                        mostrarCartaDescarte();
                        turnoBot();
                    });
                    return false; // Espera a que elija color
                } else {
                    const coloresEnMano = players[playerIndex].cards.map(c => c.color).filter(c => ['red','green','blue','yellow'].includes(c));
                    if (coloresEnMano.length > 0) {
                        currentColor = coloresEnMano[Math.floor(Math.random() * coloresEnMano.length)];
                    } else {
                        const colores = ['red','green','blue','yellow'];
                        currentColor = colores[Math.floor(Math.random() * 4)];
                    }
                }
                if (card.value === 'draw4') {
                    const next = (currentPlayerIndex + direction + players.length) % players.length;
                    drawCard(next);
                    drawCard(next);
                    drawCard(next);
                    drawCard(next);
                    nextTurn();
                }
            }
            if (card.type !== 'wild') {
                currentColor = card.color;
            }
            return true;
        }
    }
    return false;
}

function drawCard(playerIndex){
    if(deck.length === 0) return; // No hay cartas para robar
    const card = deck.pop();
    players[playerIndex].cards.push(card);
}
//
function nextTurn(){
    for(let i=0; i<players.length; i++){
        if(players[i].cards.length==0){
            over=true;
        }
    }if(over){
        alert('FELICIDADES JUGADOR '+players[currentPlayerIndex].name+' has ganado esta ronda, ahora se mostrará el puntaje');
        countPoints(currentPlayerIndex);
        localStorage.setItem('players', JSON.stringify(players))
        window.location.href='ResultadoJuego_index.html';
    }else{
        currentPlayerIndex = (currentPlayerIndex + direction + players.length) % players.length;
        renderPoints();
    }
}

function checkUNO(playerIndex){
    // Si al jugador le queda una carta, debe decir UNO
    if(players[playerIndex].cards.length === 1){
        players[playerIndex].saidUNO = true;
        return true;
    }
    return false;
}

function countPoints(winnerIndex){
    // Suma los puntos de las cartas de los demás jugadores
    let points = 0;
    players.forEach((p,i)=>{
        if(i!==winnerIndex){
            p.cards.forEach(card=>{
                if(card.type==='number') points += card.value;
                else if(card.value==='draw2'||card.value==='reverse'||card.value==='jump') points += 20;
                else points += 50; // comodines
            });
        }
    });
    players[winnerIndex].points += points;
}

function resetRound(){
    // Mantiene los puntos, reinicia mazo y manos
    initializeDeck();
    dealCards();
    currentPlayerIndex = 0;
    direction = 1;
    discardPile = [deck.pop()];
    players.forEach(p=>{
        p.cards = [];
        for(let j=0; j<7; j++){
            p.cards.push(deck.pop());
        }
        p.saidUNO = false;
    });
}

function obtenerRutaImagen(card) {
    if (card.type === 'number' || card.type === 'special') {
        // Mapeo de color JS a nombre de carpeta y sufijo
        const colores = {
            red: { carpeta: 'cartas rojas', sufijo: 'rojo' },
            blue: { carpeta: 'cartas azules', sufijo: 'azul' },
            yellow: { carpeta: 'carta amarillas', sufijo: 'amarillo' },
            green: { carpeta: 'cartas verdes', sufijo: 'verde' }
        };
        const color = colores[card.color];
        if (!color) return '';
        // Cartas especiales
        if (card.type === 'special') {
            if (card.value === 'draw2') return `images/Cartas/${color.carpeta}/+2_${color.sufijo}.png`;
            if (card.value === 'reverse') return `images/Cartas/${color.carpeta}/reversa_${color.sufijo}.png`;
            if (card.value === 'jump') return `images/Cartas/${color.carpeta}/comodin_salto_${color.sufijo}.png`;
        }
        // Cartas numéricas
        return `images/Cartas/${color.carpeta}/${card.value}_${color.sufijo}.png`;
    }
    // Comodines
    if (card.type === 'wild') {
        if (card.value === 'draw4') return 'images/Cartas/comodines generales/+4_comodin.png';
        if (card.value === 'wild') return 'images/Cartas/comodines generales/cambio_color.png';
        if (card.value === 'bomba') return 'images/Cartas/comodines generales/carta_bomba.jpeg';
        if (card.value === 'escudo') return 'images/Cartas/comodines generales/escudo.jpeg';
        if (card.value === 'robo') return 'images/Cartas/comodines generales/robo.jpeg';
        if (card.value === 'camaleon') return 'images/Cartas/comodines generales/camaleon.jpeg';
        if (card.value === 'rebote') return 'images/Cartas/comodines generales/rebote.jpeg';
    }
    return '';
}

function turnoBot() {
    const bot = players[currentPlayerIndex];
    if (!bot || bot.isHuman) return;

    // Buscar la primera carta jugable
    const top = discardPile[discardPile.length - 1];
    const cartaJugada = bot.cards.find(card =>
        card.color === top.color || card.value === top.value || card.type === 'wild'
    );

    if (cartaJugada) {
        playCard(currentPlayerIndex, cartaJugada);
        mostrarTodasLasManos();
        mostrarCartaDescarte();
        setTimeout(() => {
            nextTurn();
            mostrarTodasLasManos();
            mostrarCartaDescarte();
            turnoBot(); // Por si hay varios bots seguidos
        }, 700);
    } else {
        drawCard(currentPlayerIndex);
        mostrarTodasLasManos();
        setTimeout(() => {
            nextTurn();
            mostrarTodasLasManos();
            turnoBot();
        }, 700);
    }
}

function mostrarTodasLasManos() {
    const posiciones = ['mano-abajo', 'mano-izquierda', 'mano-arriba', 'mano-derecha'];
    for (let i = 0; i < players.length; i++) {
        const div = document.getElementById(posiciones[i]);
        if (!div) continue;
        const manoDiv = div.querySelector('.div-mano');
        manoDiv.innerHTML = '';
        players[i].cards.forEach((card, idx) => {
            let img = document.createElement('img');
            let div=document.createElement('div'); //linea nueva
            if (i === currentPlayerIndex) {
                img.src = obtenerRutaImagen(card);
                img.alt = `${card.value} ${card.color}`;
                img.className = 'carta-img';
                div.className='carta'; //linea nueva
                img.style.cursor = 'pointer';
                img.addEventListener('click', function() {
                    if (playCard(currentPlayerIndex, card)) {
                        mostrarTodasLasManos();
                        mostrarCartaDescarte();
                        nextTurn();
                        mostrarTodasLasManos();
                        mostrarCartaDescarte();
                        turnoBot();
                    }
                });
            } else {
                img.src = 'images/Cartas/carta trasera/carta_parte_trasera.png';
                img.alt = 'Carta oculta';
                img.className = 'carta-img';
                div.className='carta'; //linea nueva
            }
            div.appendChild(img); //linea nueva
            manoDiv.appendChild(div); //meto el div
        });
        // Si es el jugador actual, agrego botón para robar carta si no hay jugada válida
        if (i === currentPlayerIndex) {
            const puedeJugar = players[currentPlayerIndex].cards.some(card => {
                const top = discardPile[discardPile.length - 1];
                const colorToMatch = currentColor || top.color;
                return card.color === colorToMatch || card.value === top.value || card.type === 'wild';
            });
            let btnRoba = document.createElement('button');
            btnRoba.textContent = 'Robar carta';
            btnRoba.style.marginLeft = '10px';
            btnRoba.onclick = function() {
                if (puedeJugar) {
                    alert('Aún tienes jugadas válidas.');
                } else {
                    drawCard(currentPlayerIndex);
                    mostrarTodasLasManos();
                    nextTurn();
                    mostrarTodasLasManos();
                    turnoBot();
                }
            };
            manoDiv.appendChild(btnRoba);
            // Botón UNO si solo queda una carta y no ha dicho UNO
            if (
                players[i].cards.length === 1 &&
                players[i].isHuman &&
                !players[i].saidUNO
            ) {
                const btnUNO = document.createElement('button');
                btnUNO.className = 'boton-uno';
                btnUNO.textContent = 'UNO';
                btnUNO.onclick = () => {
                    players[i].saidUNO = true;
                    btnUNO.disabled = true;
                    btnUNO.textContent = '¡UNO!';
                };
                manoDiv.appendChild(btnUNO);
            }
        }
    }
}

function mostrarCartaDescarte() {
    const zonaDescarte = document.getElementById('zona-descarte');
    zonaDescarte.innerHTML = '';//quité el descarte ed aquí
    if (discardPile.length > 0) {
        const carta = discardPile[discardPile.length - 1];
        let img = document.createElement('img'); //linea nueva
        let div=document.createElement('div');
        img.src = obtenerRutaImagen(carta);
        img.alt = `${carta.value} ${carta.color}`;
        img.className = 'carta-img';
        div.className='carta'; //linea nueva
        div.appendChild(img); //linea nueva
        zonaDescarte.appendChild(div); //meto el div
    }
    // Mostrar el color actual siempre
    let color = currentColor;
    if (!color && discardPile.length > 0) color = discardPile[discardPile.length-1].color;
    const colorBox = document.createElement('div');
    colorBox.className = `color-actual color-${color || 'ninguno'}`;
    colorBox.textContent = `Color actual: ${colorNombreEspanol(color)}`;
    zonaDescarte.appendChild(colorBox);
}

function colorNombreEspanol(color) {
    return {
        red: 'Rojo',
        green: 'Verde',
        blue: 'Azul',
        yellow: 'Amarillo'
    }[color] || 'Ninguno';
}

function mostrarMazo() {
    const zonaMazo = document.getElementById('zona-baraja');
    zonaMazo.innerHTML = '';
    if (deck.length > 0) {
        let img = document.createElement('img');
        let div = document.createElement('div'); //linea nueva
        img.src = 'images/Cartas/carta trasera/carta_parte_trasera.png';
        img.alt = 'Mazo para robar';
        img.className = 'carta-img';
        div.className='carta'; //linea nueva
        div.appendChild(img); //linea nueva
        zonaMazo.appendChild(div); //meto el div en vez de la img
        zonaMazo.appendChild(document.createTextNode(''));
    } else {
        zonaMazo.appendChild(document.createTextNode('BARAJA VACÍA'));
    }
}

function renderPoints(){
    const ul=document.getElementById('lista-marcador')
    ul.innerHTML=''

    players.forEach((p,i)=>{
        const li=document.createElement('li')
        const nameSpan=document.createElement('span');
        const pointSpan=document.createElement('span');

        nameSpan.textContent=p.name+': ';
        pointSpan.textContent=p.points;
        li.appendChild(nameSpan)
        li.appendChild(pointSpan)
        ul.appendChild(li)
    })
}
//A partir de acá es mostrar resultados

function mostrarPuntaje(){
    let intermedio=localStorage.getItem('players');
    let jugadores=intermedio?JSON.parse(intermedio):[];
    //let jugador;
    //let puntos;
    
    let jugador=document.getElementById('1-nombre');
    let puntaje=document.getElementById('1-puntaje');
    for(let i=0; i<jugadores.length; i++){
        if(i=0){
            jugador=document.getElementById('1-nombre');
            puntaje=document.getElementById('1-puntaje');
            jugador.innerHTML=jugadores[i].name;
            puntaje.innerHTML=jugadores[i].points;}
        else if(i=1){
            jugador=document.getElementById('2-nombre');
            puntaje=document.getElementById('2-puntaje');
            jugador.innerHTML=jugadores[i].name;
            puntaje.innerHTML=jugadores[i].points;}
        else if(i=2){
            jugador=document.getElementById('3-nombre');
            puntaje=document.getElementById('3-puntaje');
            jugador.innerHTML=jugadores[i].name;
            puntaje.innerHTML=jugadores[i].points;}
        else if(i=3){
            jugador=document.getElementById('4-nombre');
            puntaje=document.getElementById('4-puntaje');
            jugador.innerHTML=jugadores[i].name;
            puntaje.innerHTML=jugadores[i].points;}
    }
}

let gameId = null;
let ws = null;
let gameState = null;

// 1. Mostrar el gameId en la pantalla de juego (Juego_index.html)
function mostrarGameIdEnJuego(gameId) {
    let gameIdDiv = document.getElementById('game-id-info');
    if (!gameIdDiv) {
        gameIdDiv = document.createElement('div');
        gameIdDiv.id = 'game-id-info';
        gameIdDiv.style.position = 'fixed';
        gameIdDiv.style.top = '10px';
        gameIdDiv.style.right = '10px';
        gameIdDiv.style.background = 'rgba(255,255,255,0.9)';
        gameIdDiv.style.border = '2px solid #f9c80e';
        gameIdDiv.style.borderRadius = '10px';
        gameIdDiv.style.padding = '12px 24px';
        gameIdDiv.style.fontFamily = "'very_simple_chalk', sans-serif";
        gameIdDiv.style.fontSize = '1.2em';
        gameIdDiv.style.zIndex = '2000';
        document.body.appendChild(gameIdDiv);
    }
    gameIdDiv.textContent = 'ID de partida: ' + gameId;
}

// 2. Modificar startGameClient para crear partida con 1 jugador
function startGameClient() {
    console.log('Iniciando partida...');
    fetch('http://localhost:3001/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numPlayers: 1 }) // Solo el host al inicio
    })
    .then(res => res.json())
    .then(data => {
        gameId = data.gameId;
        gameState = data;
        connectWebSocket(gameId);
        updateGameStateUI(data);
        mostrarGameIdEnJuego(gameId); // Mostrar el gameId en la pantalla de juego
        // Mostrar el gameId en la UI de lobby si existe
        const gameIdDiv = document.getElementById('current-game-id');
        if (gameIdDiv) gameIdDiv.textContent = 'ID de partida: ' + gameId;
    });
}

function connectWebSocket(gameId) {
    ws = new WebSocket('ws://localhost:3001');
    ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'subscribe', gameId }));
    };
    ws.onmessage = (e) => {
        const msg = JSON.parse(e.data);
        handleWebSocketEvent(msg);
    };
    ws.onclose = () => {
        console.log('WebSocket closed');
    };
}

function showNotification(message, type = 'info') {
    let notif = document.getElementById('notification-area');
    if (!notif) {
        notif = document.createElement('div');
        notif.id = 'notification-area';
        notif.style.position = 'fixed';
        notif.style.top = '20px';
        notif.style.left = '50%';
        notif.style.transform = 'translateX(-50%)';
        notif.style.zIndex = '1000';
        notif.style.background = '#fffbe6';
        notif.style.border = '1px solid #e0c200';
        notif.style.padding = '12px 24px';
        notif.style.borderRadius = '8px';
        notif.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
        notif.style.fontWeight = 'bold';
        notif.style.fontSize = '1.1em';
        notif.style.display = 'none';
        document.body.appendChild(notif);
    }
    notif.textContent = message;
    notif.style.display = 'block';
    setTimeout(() => {
        notif.style.display = 'none';
    }, type === 'alert' ? 4000 : 2000);
}

function highlightTurn(turn) {
    // Resalta el nombre del jugador actual
    for (let i = 0; i < 4; i++) {
        const playerLabel = document.getElementById('player-label-' + (i + 1));
        if (playerLabel) {
            playerLabel.style.fontWeight = (i === turn) ? 'bold' : 'normal';
            playerLabel.style.color = (i === turn) ? '#1a73e8' : '';
            playerLabel.style.textShadow = (i === turn) ? '0 0 8px #fff' : '';
        }
    }
}

// 4. Llamar mostrarGameIdEnJuego también cuando se actualiza el estado del juego
function updateGameStateUI(state) {
    gameState = state;
    // Renderizado visual unificado para multijugador y local
    if (localStorage.getItem('modoJuego') === 'multijugador') {
        // Simular estructura de players y deck para las funciones visuales existentes
        players = [{
            id: 'player1',
            name: 'Jugador 1',
            cards: state.clientCards || [],
            points: state.scores ? state.scores[0] : 0,
            saidUNO: false,
            isHuman: true
        }];
        // Otros jugadores (solo para mostrar el reverso de cartas)
        if (state.otherPlayers) {
            for (let i = 0; i < state.otherPlayers.length; i++) {
                players.push({
                    id: 'player' + (i + 2),
                    name: state.otherPlayers[i].name || ('Jugador ' + (i + 2)),
                    cards: Array(state.otherPlayers[i].count).fill({}),
                    points: state.scores ? state.scores[i + 1] : 0,
                    saidUNO: false,
                    isHuman: false
                });
            }
        }
        currentPlayerIndex = state.turn || 0;
        direction = state.direction || 1;
        currentColor = state.currentColor || null;
        discardPile = [state.discardPile];
        deck = Array.isArray(state.deck) ? state.deck : [];
        mostrarTodasLasManos();
        mostrarCartaDescarte();
        mostrarMazo();
        renderPoints();
    }
    if (state.gameId) mostrarGameIdEnJuego(state.gameId);
    // Add more UI updates as needed
}

function isCardPlayable(card) {
    const top = gameState.discardPile;
    const colorToMatch = gameState.currentColor || top.color;
    return (
        card.color === colorToMatch ||
        card.value === top.value ||
        card.type === 'wild'
    );
}

function playCardClient(card, chosenColor = null) {
    if (!isCardPlayable(card)) {
        alert('You cannot play this card');
        return;
    }
    fetch('http://localhost:3001/play', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId, card, chosenColor })
    });
}

function canDrawCard() {
    if (gameState.turn !== 0) return false; // Only if it's your turn
    return !gameState.clientCards.some(isCardPlayable);
}

function drawCardClient() {
    if (!canDrawCard()) {
        alert('You cannot draw a card now');
        return;
    }
    fetch('http://localhost:3001/draw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId })
    });
}

function updateUnoButton(cards) {
    const btnUno = document.getElementById('btn-uno');
    if (!btnUno) return;
    btnUno.disabled = !(cards.length === 1);
}

function sayUnoClient() {
    fetch('http://localhost:3001/uno', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId })
    });
}

function handleWebSocketEvent(msg) {
    if (msg.gameState) {
        updateGameStateUI(msg.gameState);
    }
    // Notificaciones y marcador
    if (msg.type === 'round_score') {
        showNotification(`¡Fin de ronda! Ganador: ${msg.winner}. Puntos: ${msg.roundScore}. Marcador: ${msg.scores.join(', ')}`, 'alert');
    }
    if (msg.type === 'client_play') {
        showNotification(`${msg.player} jugó una carta`, 'info');
    }
    if (msg.type === 'client_draw_from_deck') {
        showNotification(`${msg.player} tomó una carta del mazo`, 'info');
    }
    if (msg.type === 'client_uno') {
        showNotification(`${msg.player} dijo ¡UNO!`, 'info');
    }
    if (msg.type === 'uno_warning') {
        showNotification('¡Solo te queda una carta, tienes 4 segundos para cantar UNO!', 'alert');
    }
    if (msg.type === 'uno_penalty') {
        showNotification('Has sido penalizado por no cantar UNO', 'alert');
    }
    if (msg.type === 'draw_penalty') {
        showNotification(`${msg.affectedPlayer} recibió una penalización de ${msg.amount} cartas`, 'alert');
    }
    if (msg.type === 'bot_play') {
        showNotification(`${msg.player} (bot) jugó una carta`, 'info');
    }
    if (msg.type === 'bot_draw_from_deck') {
        showNotification(`${msg.player} (bot) tomó una carta del mazo`, 'info');
    }
    if (msg.type === 'bot_uno') {
        showNotification(`${msg.player} (bot) dijo ¡UNO!`, 'info');
    }
}

function renderScores(scores) {
    const scoreboard = document.getElementById('scoreboard');
    if (!scoreboard) return;
    scoreboard.innerHTML = scores.map((s, i) => `Player ${i+1}: ${s}`).join('<br>');
}

function renderPlayerCards(cards) {
    const handDiv = document.getElementById('player-hand');
    if (!handDiv) return;
    handDiv.innerHTML = '';
    cards.forEach(card => {
        let cardDiv = document.createElement('div');
        cardDiv.className = 'card';
        cardDiv.textContent = `${card.value} ${card.color || ''}`;
        cardDiv.onclick = () => playCardClient(card);
        handDiv.appendChild(cardDiv);
    });
}

function renderTurn(turn) {
    const turnDiv = document.getElementById('turn-info');
    if (!turnDiv) return;
    turnDiv.textContent = `Current turn: Player ${turn + 1}`;
}

function restartGameClient() {
    startGameClient();
}

// 3. Modificar joinExistingGame para que el jugador se una a la partida y se añada automáticamente
function joinExistingGame() {
    const input = document.getElementById('join-game-id');
    const id = input.value.trim();
    if (!id) {
        alert('Por favor ingresa un ID de partida válido');
        return;
    }
    gameId = id;
    // Lógica para notificar al backend que se añade un nuevo jugador
    fetch('http://localhost:3001/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId })
    })
    .then(res => res.json())
    .then(data => {
        connectWebSocket(gameId);
        updateGameStateUI(data);
        mostrarGameIdEnJuego(gameId);
        const gameIdDiv = document.getElementById('current-game-id');
        if (gameIdDiv) gameIdDiv.textContent = 'ID de partida: ' + gameId;
    });
}

// Attach event listeners to buttons
window.onload = () => {
    const mode = localStorage.getItem('modoJuego');
    if (mode === 'multijugador') {
        if (document.getElementById('btn-start')) {
            console.log('Iniciando partida...');
            document.getElementById('btn-start').addEventListener('click', startGameClient());
        }
        if (document.getElementById('btn-join-game')) document.getElementById('btn-join-game').onclick = joinExistingGame;
        if (document.getElementById('btn-restart')) document.getElementById('btn-restart').onclick = restartGameClient;
    } else {
        // Inicializa lógica local correctamente
        const numJugadores = Number(localStorage.getItem('numJugadores')) || 4;
        const tipoJuego = localStorage.getItem('tipoJuego') || 'bots';
        startGame(numJugadores, tipoJuego);
        mostrarTodasLasManos();
        mostrarCartaDescarte();
        mostrarMazo();
        renderPoints();
    }
};
