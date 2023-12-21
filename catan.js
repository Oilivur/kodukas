let playerCount;
let playerColor;
let boardConfig = [];

const boardRadius = 5; // Number of hexagons from the center to the edge
const hexSize = 50; // Adjust the size of hexagons as needed
let hexBoard;

function startGame() {
    console.log("Start Game function called");
    // Get selected options
    playerCount = document.getElementById('player-count').value;
    playerColor = document.getElementById('player-color').value;

    // Hide the main menu
    document.getElementById('main-menu').style.display = 'none';

    // Initialize the game with the selected options
    initializeGame();

    // Use setTimeout to delay setting the grid layout
    setTimeout(() => {
        // Clear existing content in the game board
        const gameBoard = document.getElementById('game-board');
        gameBoard.innerHTML = '';

        // Show the game board
        gameBoard.style.display = 'grid';

        // Generate and display the grid
        createHexagonalGrid(boardRadius, hexSize);
    }, 0);
}

function initializeGame() {
    console.log("Initialize Game function called");
    // You can add game initialization logic here based on the selected options

    // Set up the boardConfig
    boardConfig = [];

    // Generate a random boardConfig with the standard Catan distribution
    const resourceTypes = ['wood', 'brick', 'ore', 'wheat', 'sheep'];
    const numTiles = 19;
    const standardCounts = {
        'wood': 4,
        'brick': 3,
        'ore': 3,
        'wheat': 4,
        'sheep': 4
    };

    // Set the desert tile randomly
    const desertIndex = Math.floor(Math.random() * numTiles);

    // Ensure the standard count for each resource type
    const resourceCounts = {};
    resourceTypes.forEach(resource => {
        resourceCounts[resource] = 0;
    });
    
    for (let i = 0; i < numTiles; i++) {
        if (i === desertIndex) {
            boardConfig.push('desert');
        } else {
            // Randomly assign other resource types
            let randomResource;
            do {
                randomResource = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
            } while (resourceCounts[randomResource] >= standardCounts[randomResource]);

            resourceCounts[randomResource]++;
            boardConfig.push(randomResource);
        }
    }
    
    console.log(`Starting game with ${playerCount} players. Player 1 color: ${playerColor}`);
}

function createHexagonalGrid(radius, size) {
    const board = document.getElementById('game-board');
    
    const rows = [3, 4, 5, 4, 3];
    let index = 0;

    for (let row = 0; row < rows.length; row++) {
        const numHexagons = rows[row];

        // Create a new row div for each row
        const rowDiv = document.createElement('div');
        rowDiv.className = `hexagon-row row-${row + 1}`;
        board.appendChild(rowDiv);

        for (let col = 0; col < numHexagons; col++) {
            const hexagon = createHexagon(0, 0, size, boardConfig[index], index);
            hexagon.style.margin = '3px'; // Set the margin property
            rowDiv.appendChild(hexagon);
            index++;
        }
    }
}

function createHexagon(q, r, size, tileType, tileId) {
    const x = size * Math.sqrt(3) * (q + r / 2);
    const y = size * (3 / 2) * r;

    const hexagon = document.createElement('div');
    hexagon.id = `tile-${tileId}`; // Assign an ID to each tile
    hexagon.className = 'hexagon ' + tileType; // Add the tile type as a class
    hexagon.style.transform = `translate(${x}px, ${y}px)`;
    
    return hexagon;
}
