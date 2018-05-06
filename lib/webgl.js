// Rendering engine variables.
var gl,
    shaderProgram,
    vertices,
    matrix = mat4.create(),
    bpMatrix = mat4.create(),
    vertexCount = 1000;
    
// Gameplay-related variables.
var player1,
    player2,
    line,
    ball,
    ballDx,
    ballDy,
    keyState;

// Sound-related variables.
var lost,
    wall,
    squashed;

// Initialization of graphics and game settings.
initGL();
initGameVariables();
initSoundVariables();
createShaders();

// Gameplay start-up.
pongGameplay();

// Event handlers.
document.addEventListener('keydown', function (event) {
    const key = event.key; // "ArrowRight", "ArrowLeft", "ArrowUp", or "ArrowDown"
    switch (event.key) {
        case "ArrowLeft":
            // Left pressed
            keyState.left = true;
            break;
        case "ArrowRight":
            // Right pressed
            keyState.right = true;
            break;
        case 'a':
            // a pressed
            keyState.a = true;
            break;
        case 'd':
            // d pressed
            keyState.d = true;
            break;
    }
});

document.addEventListener('keyup', function (event) {
    const key = event.key; // "ArrowRight", "ArrowLeft", "ArrowUp", or "ArrowDown"
    switch (event.key) {
        case "ArrowLeft":
            // Left pressed
            keyState.left = false;
            break;
        case "ArrowRight":
            // Right pressed
            keyState.right = false;
            break;
        case 'a':
            // a pressed
            keyState.a = false;
            break;
        case 'd':
            // d pressed
            keyState.d = false;
            break;
    }
});

function initGL() {
    var canvas = document.getElementById("canvas");
    console.log(canvas);

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    gl = canvas.getContext("webgl");
    gl.enable(gl.DEPTH_TEST);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 1);
}

function initGameVariables() {
    // Registered state of the key movements.
    keyState = {
        left: false,
        right: false,
        a: false,
        d: false
    };
    
    // Starting coordinates for the first player.
    player1 = [
        -0.3, 0.8, 0.9, 1, 1, 1, 1,
        0.3, 0.8, 0.9, 1, 1, 1, 1,
        -0.3, 0.9, 0.9, 1, 1, 1, 1,
        0.3, 0.9, 0.9, 1, 1, 1, 1,
    ];

    // Starting coordinates for the second player.
    player2 = [
        -0.3, -0.8, 0.9, 1, 1, 1, 1,
        0.3, -0.8, 0.9, 1, 1, 1, 1,
        -0.3, -0.9, 0.9, 1, 1, 1, 1,
        0.3, -0.9, 0.9, 1, 1, 1, 1
    ];
    
    // Starting coordinates for the ball.
    ball = [0, 0, 0.9, 255, 255, 0, 1];
    
    // Coordinates for the line separating the parts of the field.
    line = [-1, 0, 0, 1, 1, 1, 0.5,
       1, 0, 0, 1, 1, 1, 0.5];
    
    // Initial speed of the ball.
    ballDx = 0.01;
    ballDy = 0.01;
}

function initSoundVariables() {
    lost = new Audio('lib/ball_lost.wav');
    wall = new Audio('lib/ball_wall.wav');
    squashed = new Audio('lib/ball_squashed.wav');
}

function createShaders() {
    var vertexShader = getShader(gl, "shader-vs");
    var fragmentShader = getShader(gl, "shader-fs");

    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);

    gl.linkProgram(shaderProgram);
    gl.useProgram(shaderProgram);
}

function generateStars() {
    vertices = [];

    for (var i = 0; i < vertexCount; i++) {
        vertices.push(Math.random() * 2 - 1);
        vertices.push(Math.random() * 2 - 1);
        vertices.push(Math.random() * (-1));
        vertices.push(1);
        vertices.push(1);
        vertices.push(1);
        vertices.push(1);
    }

    return vertices;
}

function createVertices(vertices, POINT_SIZE) {

    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    var coords = gl.getAttribLocation(shaderProgram, "coords");
    gl.vertexAttribPointer(coords, 3, gl.FLOAT, false, Float32Array.BYTES_PER_ELEMENT * 7, 0);
    gl.enableVertexAttribArray(coords);

    var colorsLocation = gl.getAttribLocation(shaderProgram, "colors");
    gl.vertexAttribPointer(colorsLocation, 4, gl.FLOAT, false, Float32Array.BYTES_PER_ELEMENT * 7, Float32Array.BYTES_PER_ELEMENT * 3);
    gl.enableVertexAttribArray(colorsLocation);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    var pointSize = gl.getAttribLocation(shaderProgram, "pointSize");
    gl.vertexAttrib1f(pointSize, POINT_SIZE);
}

function drawBackground() {
    createVertices(generateStars(), 1);

    var transformMatrix = gl.getUniformLocation(shaderProgram, "transformMatrix");
    gl.uniformMatrix4fv(transformMatrix, false, matrix);

    gl.drawArrays(gl.POINTS, 0, vertexCount);
}

function drawPlayer(player) {
    createVertices(player, 1);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

function drawBall() {
    createVertices(ball, 30);
    gl.drawArrays(gl.POINT, 0, 1);
}

function drawLine() {
    createVertices(line, 1);
    gl.drawArrays(gl.LINES, 0, 2);
}

function moveBall() {
    ball[0] += ballDx;
    ball[1] += ballDy;

    // Handles the ball falling out of the field.
    if (ball[1] > 1 || ball[1] < -1) {
        // Play sound
        lost.play();
        
        // Resets the ball to the primary position.
        ball[0] = 0;
        ball[1] = 0;
        
        // Set the random dx, dy for the ball.
        var movements = [-0.01, 0.01, -0.02, 0.02];
        ballDx = movements[Math.floor(Math.random() * movements.length)];
        ballDy = movements[Math.floor(Math.random() * movements.length)];
    }

    // Handles the ball bouncing off the edges.
    if (ball[0] <= -1 || ball[0] >= 1) {
        ballDx = -ballDx;
        wall.play();
    }

    // Handles the collision with the player 1.
    if ((ball[0] >= player1[0] && ball[0] <= player1[7]) && (ball[1] >= player1[1])) {
        
        // Reverse the direction if ball is on the left edge.
        if (ball[0] < (Math.abs(player1[0] + player1[7])) / 2)
            ballDx = -ballDx;

        ballDy = -ballDy;
        squashed.play();
    }

    // Handles the collision with the player 2.
    if ((ball[0] >= player2[0] && ball[0] <= player2[7]) && (ball[1] <= player2[1])) {

        // Reverse the direction if ball is on the left edge.
        if (ball[0] > (Math.abs(player2[0] + player2[7])) / 2)
            ballDx = -ballDx;

        ballDy = -ballDy;
        squashed.play();
    }
}

// Updates player position based on the keyboard input.
function updatePlayerPositions() {
    
    if (keyState.a) {
        player1[0] = player1[0] - 0.01;
        player1[14] = player1[14] - 0.01;
        player1[7] = player1[7] - 0.01;
        player1[21] = player1[21] - 0.01;
    }
    if (keyState.d) {
        player1[0] = player1[0] + 0.01;
        player1[7] = player1[7] + 0.01;
        player1[14] = player1[14] + 0.01;
        player1[21] = player1[21] + 0.01;
    }
    if (keyState.left) {
        player2[0] = player2[0] - 0.01;
        player2[7] = player2[7] - 0.01;
        player2[14] = player2[14] - 0.01;
        player2[21] = player2[21] - 0.01;
    }
    if (keyState.right) {
        player2[0] = player2[0] + 0.01;
        player2[7] = player2[7] + 0.01;
        player2[14] = player2[14] + 0.01;
        player2[21] = player2[21] + 0.01;
    }
}

function pongGameplay() {

    // Initial setup
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Performs the movement of the ball
    moveBall();

    // Draws the background.
    drawBackground();
    drawLine();

    // Checks for the player's movement and updates the player's position accordingly.
    updatePlayerPositions();

    // Draws the players on the screen.
    drawPlayer(player1);
    drawPlayer(player2);

    // Draws the ball.
    drawBall();

    // Requests the next animation frame.
    requestAnimationFrame(pongGameplay);
}

/*
 * https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Adding_2D_content_to_a_WebGL_context
 */
function getShader(gl, id) {
    var shaderScript, theSource, currentChild, shader;

    shaderScript = document.getElementById(id);

    if (!shaderScript) {
        return null;
    }

    theSource = "";
    currentChild = shaderScript.firstChild;

    while (currentChild) {
        if (currentChild.nodeType == currentChild.TEXT_NODE) {
            theSource += currentChild.textContent;
        }

        currentChild = currentChild.nextSibling;
    }
    if (shaderScript.type == "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        // Unknown shader type
        return null;
    }
    gl.shaderSource(shader, theSource);

    // Compile the shader program
    gl.compileShader(shader);

    // See if it compiled successfully
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}
