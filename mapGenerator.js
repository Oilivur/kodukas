// MapGenerator

let playerCount;
let playerColor;
let boardConfig = [];
let assignedNumbers;
// Declare a variable to keep track of the current player
let currentPlayerIndex = 0;

const hexSize = 50; // Adjust the size of hexagons as needed
let hexBoard;

function startGame() {
    console.log("Start Game function called");
    // Get selected options
    const playerCount = document.getElementById('player-count').value;

    // Hide the main menu
    document.getElementById('main-menu').style.display = 'none';

    // Clear existing content in the game board
    const gameBoard = document.getElementById('game-board');
    gameBoard.innerHTML = '';

    // Initialize players based on user input
    const players = initializePlayers(playerCount);

    saveGameState(players, currentPlayerIndex);

    // Initialize the game with the selected options
    initializeGame();

    // Generate and display the grid
    createHexagonalGrid(hexSize, assignedNumbers);

    // Display the current player's turn
    displayCurrentPlayer(currentPlayerIndex, players);

    // Start the first turn
    currentPlayerIndex = performTurnActions(currentPlayerIndex, players);
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

    // Array to store assigned dice roll numbers
    assignedNumbers = [];
    
    for (let i = 0; i < numTiles; i++) {
        if (i === desertIndex) {
            boardConfig.push('desert');
            assignedNumbers.push(1);
        } else {
            // Randomly assign other resource types
            let randomResource;
            do {
                randomResource = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
            } while (resourceCounts[randomResource] >= standardCounts[randomResource]);

            resourceCounts[randomResource]++;
            boardConfig.push(randomResource);

            // Assign a dice roll number
            const diceRoll = assignDiceRoll(assignedNumbers);
            assignedNumbers.push(diceRoll);
            console.log(diceRoll)
        }
    }
}

// Initialize the possibleNumbers array with all possible dice roll numbers
let possibleNumbers = [3, 4, 5, 6, 8, 9, 10, 11, 2, 12, 3, 4, 5, 6, 8, 9, 10, 11];

function assignDiceRoll(assignedNumbers) {
    // Check if there are remaining possible numbers
    if (possibleNumbers.length === 0) {
        console.error('No more possible numbers.');
        return null; // or handle this case appropriately
    }

    // Shuffle the possibleNumbers array to randomize the assignment
    for (let i = possibleNumbers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [possibleNumbers[i], possibleNumbers[j]] = [possibleNumbers[j], possibleNumbers[i]];
    }

    let diceRoll;

    while (true) {
        // Get the first number from the shuffled list without popping it
        diceRoll = possibleNumbers[possibleNumbers.length - 1];

        // Check if the assigned number is valid
        if (isValidDiceRoll(diceRoll, assignedNumbers)) {
            // If valid, pop the number from the array and exit the loop
            possibleNumbers.pop();
            break;
        } else {
            // If not valid, try again with a different number
            possibleNumbers.unshift(possibleNumbers.pop());
        }
    }

    return diceRoll;
}

function isValidDiceRoll(diceRoll, assignedNumbers) {
    // Check if the diceRoll violates any of the specified guidelines
    const lastNumber = assignedNumbers.length > 0 ? assignedNumbers[assignedNumbers.length - 1] : null;
    const secondLastNumber = assignedNumbers.length > 1 ? assignedNumbers[assignedNumbers.length - 2] : null;

    if (
        (lastNumber === diceRoll) ||
        (lastNumber + 1 === diceRoll && lastNumber % 2 === 0) ||
        (lastNumber - 1 === diceRoll && lastNumber % 2 !== 0) ||
        (secondLastNumber === 6 && lastNumber === 8 && (diceRoll === 5 || diceRoll === 9)) ||
        (secondLastNumber === 5 && lastNumber === 9 && (diceRoll === 6 || diceRoll === 8))
    ) {
        return false;
    }

    return true;
}

function createHexagonalGrid(size, assignedNumbers) {
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
            const diceRoll = assignedNumbers[index]; // Get the assigned dice roll
            const hexagon = createHexagon(0, 0, size, boardConfig[index], diceRoll, index);
            hexagon.style.margin = '3px'; // Set the margin property
            rowDiv.appendChild(hexagon);
            index++;
        }
    }
}

function createHexagon(q, r, size, tileType, diceRoll, tileId) {
    const x = size * Math.sqrt(3) * (q + r / 2);
    const y = size * (3 / 2) * r;

    const hexagon = document.createElement('div');
    hexagon.id = `tile-${tileId}`; // Assign an ID to each tile
    hexagon.className = `hexagon ${tileType} ${getNumberClassName(diceRoll)}`; // Add the tile type and dice roll as classes
    hexagon.style.transform = `translate(${x}px, ${y}px)`;

    // Create a text element for displaying the dice roll number
    const numberText = document.createElement('div');
    numberText.className = 'number-text';
    numberText.textContent = diceRoll || ''; // Display the dice roll if available

    // Append the text element to the hexagon
    hexagon.appendChild(numberText);

    return hexagon;
}

function getNumberClassName(diceRoll) {
    return diceRoll ? `number-${diceRoll}` : ''; // Add a class for the dice roll number
}
