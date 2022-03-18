var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');

var MPlayerButton = document.getElementById("multiplayerButton");
var SPlayerButton = document.getElementById("singlePlayerButton");

var result = document.getElementById('result').innerHTML;
var readyButton = document.getElementById('readyButton');
let gameOver = false;

const w = 200;
const h = 200;

var available = 9;

var board = [
    ['', '', ''],
    ['', '', ''],
    ['', '', '']
]

var players = ['X', 'O'];
let ai = 'X';
let human = 'O'

var player;
var enemy;

let yourTurn;
let gameMode = "";
let playerNumb = 0;
let ready = false;
let oppReady = false;

MPlayerButton.addEventListener('click', startMultiPlayer);
SPlayerButton.addEventListener('click', startSinglePlayer);

function startMultiPlayer() {
    const socket = io();

    socket.on('player-number', (numb) => {
        if (numb == -1) {
            document.getElementById("input").style.display = "block";
            document.getElementById("connections").style.display = "none";
            alert("Sorry, server is full");
        } else {
            document.getElementById("input").style.display = "none";
            document.getElementById("connections").style.display = "block";
            playerNumb = parseInt(numb);
            if (playerNumb == 0) yourTurn = true;
            player = players[playerNumb];
            enemy = player == 'X' ? 'O' : 'X';
            socket.emit('check-players');
        }
    });

    socket.on('player-connection', (numb) => {
        highlightInfo(numb, "connection");
    });

    socket.on('enemy-ready', (numb) => {
        oppReady = true;
        highlightInfo(numb, "ready");
        if (ready) startMultiPlayerGame(socket);
    });

    socket.on('check-players', (players) => {
        players.forEach((p, i) => {
            if (p.connected) highlightInfo(i, "connection");
            if (p.ready) {
                highlightInfo(i, "ready");
                if (i !== playerNumb) oppReady = true;
            }
        });
    });

    readyButton.onclick = () => {
        if (!ready) {
            socket.emit('player-ready');
            ready = true;
            highlightInfo(playerNumb, "ready");
            if (oppReady) startMultiPlayerGame(socket);
        }
    }

    function highlightInfo(index, info) {
        let parent = document.getElementById("p" + (index+1));
        parent.querySelector("#" + info).style.color = parent.querySelector("#" + info).style.color == "red" ? "green" : "red";
        if (index == playerNumb) document.getElementById("p" + (index+1)).style.fontWeight = 'bold';
    }
}

function startMultiPlayerGame(socket) {
    document.getElementById("connections").style.display = "none";
    let turnDisplay = document.getElementById("turnDisplay");
    if (yourTurn) turnDisplay.innerHTML = "Your Turn";
    else turnDisplay.innerHTML = "Opponents Turn";
    document.getElementById("game").style.display = "block";
    drawBoard();

    function mousePressed(evt) {
        if (!gameOver && yourTurn) {
                let i = Math.floor(evt.offsetX / w);
                let j = Math.floor(evt.offsetY / h);

                if (board[i][j] == '') {
                    board[i][j] = player;
                    socket.emit('player-move', {row: i, col: j});
                    drawBoard();

                    yourTurn = false;
                    turnDisplay.innerHTML = "Opponents Turn";

                    let result = checkWinner();
                    if (result != null) {
                        socket.emit('game-over', result);
                        gameOver = true;
                        let resultP = document.getElementById("result");
                        if (result == 'tie') resultP.innerHTML = 'Tie!';
                        else resultP.innerHTML = `${result} wins!`;
                        turnDisplay.innerHTML = "Game Over";
                    }
                }
        }
    }
    canvas.addEventListener('click', mousePressed);

    socket.on('player-move', move => {
        board[move.row][move.col] = enemy;
        drawBoard();
        yourTurn = true;
        turnDisplay.innerHTML = "Your Turn";
    });

    socket.on('game-over', result => {
        drawBoard();
        gameOver = true;
        let resultP = document.getElementById("result");
        if (result == 'tie') resultP.innerHTML = 'Tie!';
        else resultP.innerHTML = `${result} wins!`;
        turnDisplay.innerHTML = "Game Over";
    });
}

function startSinglePlayer() {
    document.getElementById("input").style.display = "none";
    document.getElementById("game").style.display = "block";
    bestMove();
    drawBoard();

    function mousePressed(evt) {
        if (!gameOver) {
                let i = Math.floor(evt.offsetX / w);
                let j = Math.floor(evt.offsetY / h);

                if (board[i][j] == '') {
                    board[i][j] = human;
                    available--;
                    drawBoard();
    
                    let resultP = document.getElementById("result");
                    let result = checkWinner();
                    if (result != null) {
                        gameOver = true;
                        if (result == 'tie') resultP.innerHTML = 'Tie!';
                        else resultP.innerHTML = `${result} wins!`;
                        return;
                    }
    
                    bestMove();
                    available--;
                    drawBoard();

                    result = checkWinner();
                    if (result != null) {
                        gameOver = true;
                        if (result == 'tie') resultP.innerHTML = 'Tie!';
                        else resultP.innerHTML = `${result} wins!`;
                        return;
                    }
                }
        }
    }
      
    canvas.addEventListener('click', mousePressed);
}

function equals3(a, b, c){
    return (a==b && b==c && a!='');
}

function checkWinner() {
    let winner = null;
  
    // horizontal
    for (let i = 0; i < 3; i++) {
      if (equals3(board[i][0], board[i][1], board[i][2])) {
        winner = board[i][0];
      }
    }
  
    // Vertical
    for (let i = 0; i < 3; i++) {
      if (equals3(board[0][i], board[1][i], board[2][i])) {
        winner = board[0][i];
      }
    }
  
    // Diagonal
    if (equals3(board[0][0], board[1][1], board[2][2])) {
      winner = board[0][0];
    }
    if (equals3(board[2][0], board[1][1], board[0][2])) {
      winner = board[2][0];
    }
  
    if (winner == null && available == 0) {
      return 'tie';
    } else {
      return winner;
    }
  }

function drawBoard(){
    rect(0, 0, canvas.width, canvas.height, "rgb(100, 100, 100)");

    line(w, 0, w, canvas.height);
    line(w*2, 0, w*2, canvas.height);
    line(0, h, canvas.width, h);
    line(0, h*2, canvas.width, h*2);

    for(var col = 0; col<3; col++){
        for(var row = 0; row<3; row++){
            var letter = board[row][col];

            var x = row*w;
            var y = col*w;

            if(letter == 'X'){
                line(x+20, y+20, x+w-20, y+h-20);
                line(x+w-20, y+20, x+20, y+h-20);
            } else if(letter == 'O'){
                ellipse(x+w/2, y+h/2, 85);
            }
        }
    }
}

function rect(x, y, width, height, color="black"){
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
}

function line(x1, y1, x2, y2){
    ctx.beginPath();
    ctx.lineWidth = 5;
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}

function ellipse(x, y, radius){
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI*2);
    ctx.stroke();
}