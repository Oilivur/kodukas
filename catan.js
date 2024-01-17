const canvas = document.getElementById("catanCanvas");
const ctx = canvas.getContext("2d");

// Resource distribution
const resourceDistribution = [
    "brick", "brick", "brick", "wood", "wood", "wood", "wood", 
    "wheat", "wheat", "wheat", "wheat", "ore", "ore", "ore",
    "sheep", "sheep", "sheep", "sheep", "desert"
]

// Allowed dice rolls
const allowedDiceRolls = [
    2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12
];

// Function to get or initialize players from local storage
function getPlayers() {
    const playersFromStorage = localStorage.getItem("players");
    return playersFromStorage ? JSON.parse(playersFromStorage) : [];
}

// Function to save players to local storage
function savePlayers(players) {
    localStorage.setItem("players", JSON.stringify(players));
}

// Function to get or initialize hexagons from local storage
function getHexagons() {
    const hexagonsFromStorage = localStorage.getItem("hexagons");
    return hexagonsFromStorage ? JSON.parse(hexagonsFromStorage) : [];
}

// Function to save hexagons to local storage
function saveHexagons(hexagons) {
    localStorage.setItem("hexagons", JSON.stringify(hexagons));
}

// Sample player data
let players = getPlayers();
if (players.length === 0) {
    players = [
        { color: "red", resources: 0 },
        { color: "blue", resources: 0 },
        // Add more players as needed
    ];
    savePlayers(players);
}

// Constants for hexagon dimensions and layout
const hexRadius = 30;
const hexWidth = Math.sqrt(3) * hexRadius;
const hexHeight = 1.8 * hexRadius;

// Increased horizontal and vertical spacing
const horizontalSpacing = 2; // Adjust as needed
const verticalSpacing = 2.3; // Adjust as needed

// Array to store hexagon objects
let hexagons = getHexagons();
if (hexagons.length === 0) {
    hexagons = [];
    function createHexagon(id, x, y, rotation = 0, resource, diceroll) {
        return {
            id: id,
            x: x,
            y: y,
            rotation: rotation,
            resource: resource,
            diceroll: diceroll
        };
    }

    let hexagonId = 1; // Start with the first id

    for (let row = 0; row < 5; row++) {
        const yOffset = hexHeight * row * verticalSpacing * 0.75 + 150; // Adjusting for hexagon vertical offset
        const hexesInRow = [3, 4, 5, 4, 3][row];

        // Calculate the starting X position for each row
        let startXForRow;
        if (row === 0) {
            startXForRow = 354; // Row 1
        } else if (row === 1) {
            startXForRow = 302; // Row 2
        } else if (row === 2) {
            startXForRow = 250; // Row 3
        } else if (row === 3) {
            startXForRow = 302; // Row 4
        } else {
            startXForRow = 354; // Row 5
        }

        for (let col = 0; col < hexesInRow; col++) {
            const x = startXForRow + col * hexWidth * horizontalSpacing;
            const y = yOffset;

            // Rotate hexagons
            const rotation = Math.PI / 6; // 30 degrees in radians

            // Assign random resource from the distribution list
            const randomIndex = Math.floor(Math.random() * resourceDistribution.length);
            const resource = resourceDistribution[randomIndex];
            resourceDistribution.splice(randomIndex, 1)
            console.log(hexagonId + " ressource is: " + resource)
            console.log("Resources left: " + resourceDistribution)
            
            let diceRoll = "";
            if (resource !== "desert") {
                const randomDiceRoll = Math.floor(Math.random() * allowedDiceRolls.length);
                diceRoll = allowedDiceRolls[randomDiceRoll];
                allowedDiceRolls.splice(randomDiceRoll, 1);
            }

            const hexagon = createHexagon(hexagonId++, x, y, rotation, resource, diceRoll);
            hexagons.push(hexagon);
        }
    }

    //saveHexagons(hexagons);
}

// Function to draw a single hexagon with rotation, id, and resource
function drawHexagon(hexagon) {
    // Set the fill style based on the hexagon's resource
    switch (hexagon.resource) {
        case 'brick':
            ctx.fillStyle = 'brown';
            break;
        case 'wood':
            ctx.fillStyle = 'green';
            break;
        case 'wheat':
            ctx.fillStyle = 'gold';
            break;
        case 'ore':
            ctx.fillStyle = 'gray';
            break;
        case 'sheep':
            ctx.fillStyle = 'limegreen';
            break;
        case 'desert':
            ctx.fillStyle = 'sandybrown';
            break;
        default:
            ctx.fillStyle = 'lightgray'; // Default color for unknown resources
            break;
    }
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i + hexagon.rotation;
        const newX = hexagon.x + hexWidth * Math.cos(angle);
        const newY = hexagon.y + hexHeight * Math.sin(angle);
        if (i === 0) {
            ctx.moveTo(newX, newY);
        } else {
            ctx.lineTo(newX, newY);
        }
    }
    ctx.closePath();
    ctx.stroke();

    // Fill the hexagon with the specified color
    ctx.fill();

    // Draw the ID and resource in the center of the hexagon
    ctx.fillStyle = "black";
    ctx.font = "12px Arial";
    ctx.fillText(`${hexagon.diceroll}`, hexagon.x, hexagon.y - 10);
    ctx.fillText(`${hexagon.resource}`, hexagon.x, hexagon.y + 10);
}

// Draw the initial game state with a beehive pattern, rotation, and id
function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const hexagon of hexagons) {
        drawHexagon(hexagon);
    }
}

// Update player resources and redraw the board
function updatePlayer(playerIndex, resourceChange) {
    players[playerIndex].resources += resourceChange;
    savePlayers(players);
    drawBoard();
}

// Handle mouse click events
canvas.addEventListener("click", (event) => {
    const mouseX = event.clientX - canvas.getBoundingClientRect().left;
    const mouseY = event.clientY - canvas.getBoundingClientRect().top;

    // Check if the click is inside any hexagon
    for (const hexagon of hexagons) {
        const dx = mouseX - hexagon.x;
        const dy = mouseY - hexagon.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= hexRadius) {
            // Clicked on this hexagon, print its id in the console
            console.log(`Clicked on hexagon ${hexagon.id}`);
            break;
        }
    }
});

// Initial draw
drawBoard();
