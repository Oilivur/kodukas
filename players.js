// players.js

// Player object constructor
function Player(id, color) {
    this.id = id;
    this.color = color;
    this.resources = {
        wood: 0,
        brick: 0,
        ore: 0,
        wheat: 0,
        sheep: 0
    };
    // Add more player-related properties as needed
}

// Array to store player objects
let players = [];

// Function to initialize players based on user input
function initializePlayers(playerCount) {
    players = []; // Clear existing players

    for (let i = 1; i <= playerCount; i++) {
        const color = document.getElementById(`player${i}-color`).value;
        const player = new Player(i, color);
        players.push(player);
    }

    console.log(players);

    // Save the players array to local storage
    localStorage.setItem('players', JSON.stringify(players));
    return players;
}
