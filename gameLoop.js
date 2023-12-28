// gameloop.js

function displayCurrentPlayer(currentPlayerIndex) {
    const currentPlayerElement = document.getElementById('current-player');
    currentPlayerElement.textContent = `Player ${players[currentPlayerIndex].id}`;
}

function endTurn() {
    // Retrieve the players array from local storage
    const players = JSON.parse(localStorage.getItem('players'));

    // Retrieve the current player index from local storage
    let currentPlayerIndex = parseInt(localStorage.getItem('currentPlayerIndex'));

    // Increment the current player index
    currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
    console.log("End turn pressed, ", currentPlayerIndex);

    // Display the updated current player's turn
    displayCurrentPlayer(currentPlayerIndex, players);
    updatePlayerStats(currentPlayerIndex, players);

    // Save the current state to local storage
    saveGameState(players, currentPlayerIndex);

    // Call the next turn or game continuation logic as needed
    return currentPlayerIndex;
}

function performTurnActions(currentPlayerIndex) {
    // Your turn-specific actions here
    console.log(`Player ${players[currentPlayerIndex].id}'s turn`);

    // Example: Perform some actions specific to the player's turn

    // Call endTurn to handle the end of the current player's turn
    currentPlayerIndex = endTurn(currentPlayerIndex);

    // Continue with the game logic
    return currentPlayerIndex;
}

function saveGameState(players, currentPlayerIndex) {
    // Save players to local storage
    localStorage.setItem('players', JSON.stringify(players));

    // Save current player index to local storage
    localStorage.setItem('currentPlayerIndex', currentPlayerIndex.toString());
}

function loadGameState() {
    // Load the previous game state from local storage
    const storedPlayers = localStorage.getItem('players');
    if (storedPlayers) {
        players = JSON.parse(storedPlayers);
    }
}

function updatePlayerStats(currentPlayerIndex, players) {
    const currentPlayer = players[currentPlayerIndex];

    // Update player id and color
    document.getElementById('player-id').textContent = currentPlayer.id;
    document.getElementById('player-color').textContent = currentPlayer.color;

    // Update resource counts
    document.getElementById('wood-count').textContent = currentPlayer.resources.wood;
    document.getElementById('brick-count').textContent = currentPlayer.resources.brick;
    document.getElementById('ore-count').textContent = currentPlayer.resources.ore;
    document.getElementById('wheat-count').textContent = currentPlayer.resources.wheat;
    document.getElementById('sheep-count').textContent = currentPlayer.resources.sheep;

    // Update victory points
    document.getElementById('victory-points').textContent = calculateVictoryPoints(currentPlayer); // You need to implement calculateVictoryPoints function
}

// Example function to calculate victory points (customize as needed)
function calculateVictoryPoints(player) {
    // Your logic to calculate victory points based on player's resources, buildings, etc.
    // For now, let's assume each resource is worth 1 victory point
    return Object.values(player.resources).reduce((total, count) => total + count, 0);
}
