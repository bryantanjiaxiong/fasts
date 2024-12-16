
var z = [[0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0]];

// Level Manager for Think's Game
let dontColor = "black"; // Default color to avoid

/**
 * Starts the levels with a given set of timings.
 * @param {Array<number>} timings - Array of time delays for adding colors.
 */
function startLevels(timings)
{
    addRowToBoard(0);
    setTimeout(()=>{level1(timings[8]); },0);
    setTimeout(()=>{level1(timings[5]); },15000);
    setTimeout(()=>{blink(1,500,20000); },16000);
    setTimeout(()=>{level1(timings[3]); },30000);
    setTimeout(()=>{level1(timings[1]); },45000);
    setTimeout(()=>{level1(timings[0]); },60000);
    setTimeout(()=>{if(theGameIsOver == false) {addRowToBoard(1);}},75000);
    setTimeout(()=>{if(theGameIsOver == false) {addRowToBoard(2);}},75100);
    setTimeout(()=>{level7(timings[8]); },76000);
    setTimeout(()=>{level7(timings[4]); },91000);
    setTimeout(()=>{level7(timings[1]); },106000);
    setTimeout(()=>{widenedButton(3,true); },107000);
    setTimeout(()=>{level7(timings[0]); },121000);
    setTimeout(()=>{level7(timings[0]); },134000);
    setTimeout(()=>{blink(3,500,20000); },135000);
    setTimeout(()=>{widenedButton(3,false); },136000);
    setTimeout(()=>{if(theGameIsOver == false) {addRowToBoard(3);}},149000);
    setTimeout(()=>{if(theGameIsOver == false) {addRowToBoard(4);}},149100);
    setTimeout(()=>{if(theGameIsOver == false) {addRowToBoard(5);}},149200);
    setTimeout(()=>{if(theGameIsOver == false) {addRowToBoard(6);}},149300);
    setTimeout(()=>{if(theGameIsOver == false) {addRowToBoard(7);}},149400);
    setTimeout(()=>{if(theGameIsOver == false) {addRowToBoard(8);}},149500);
    setTimeout(()=>{level10(timings[8]); },150000); 
    setTimeout(()=>{level10(timings[5]); },165000);
    setTimeout(()=>{level10(timings[1]); },180000);
    setTimeout(()=>{blink(9,500,20000); },181000);
    setTimeout(()=>{level10(timings[0]); },195000);
    setTimeout(()=>{level10(timings[0]); },210000);
    setTimeout(()=>{widenedButton(9,true); },211000);
    setTimeout(()=>{level10(timings[3]); },225000); 
    setTimeout(()=>{level10(timings[2]); },240000);
    setTimeout(()=>{widenedButton(9,false); },241000);
    setTimeout(()=>{level12(timings[3]); },255000); 
    setTimeout(()=>{level12(timings[2]); },270000);
    setTimeout(()=>{level12(timings[1]); },285000);
    setTimeout(()=>{level12(timings[0]); },300000);
    setTimeout(()=>{level12(timings[0]); },315000);
}

/**
 * add the nth rows to the page
 * @param {*} rowindex the nth row.
 */
function addRowToBoard(rowindex) {
    const gameBoard = document.getElementById("game-board");
    const row = document.createElement("tr");

    // Add 9 cells to the row
    for (let i = 0; i < 9; i++) {
        const cell = document.createElement("td");
        const button = document.createElement("button");

        button.className = "box"; // CSS styling for game buttons
        button.id = `z[${rowindex}][${i}]`;
        button.style.backgroundColor = "white";
        button.onclick = () => handleCellClick(rowindex,i);

        cell.appendChild(button);
        row.appendChild(cell);
    }

    gameBoard.appendChild(row);
}

/**
 * Resets the boxes to white when users click.
 * @param {*} rowindex nth row.
 * @param {*} columnindex nth column.
 */
function handleCellClick(rowindex, columnindex) {
    if (document.getElementById("z[" + rowindex + "][" + columnindex + "]").style.backgroundColor === dontColor) {
        // End game logic if restricted color is clicked
        alert(`Game Over! You clicked the restricted color: ${dontColor}`);
        gameover();
    }
    else if(document.getElementById("z[" + rowindex + "][" + columnindex + "]").style.backgroundColor === "white")
        {
            const colors = ["red", "blue", "green"];
            setColor = colors[Math.floor(Math.random() * colors.length)];
            document.getElementById("z[" + rowindex + "][" + columnindex + "]").style.backgroundColor = setColor;
            z[rowindex][columnindex] = 1;
        } 
    else {
		document.getElementById("z[" + rowindex + "][" + columnindex + "]").style.backgroundColor = "white";
        incrementScore();
        z[rowindex][columnindex] = 0;
    }
}


/**
 * Sets the color of the boxes at random.
 * @param {*} rows number of rows.
 * @param {*} columns number of columns.
 */
function getRandomColor(rows,columns) {
    const colors = ["red", "blue", "green"];
    setColor = colors[Math.floor(Math.random() * colors.length)];
    var i = Math.floor(Math.random() * rows);
    var j = Math.floor(Math.random() * columns);
    if(z[i][j] == 0)
    {
        document.getElementById("z[" + i + "][" + j + "]").style.backgroundColor = setColor;
        z[i][j] = 1;
    }
    checkboxes(rows);
}

/**
 * check all boxes of the row, given the number of rows.
 * @param {*} rows number of rows
 */
function checkboxes(rows)
{
    for(var i =0; i < rows; i++)
    {    
        let colored = 0;
        for (var j = 0; j < 9; j++) 
        {
            if (z[i][j] == 1) 
            {
                colored++;
                if (colored == 9) 
                {
                    gameover();
                }
            }
        }
    }
}

/**
 * Stops the game and prompts user to restart.
 */
function gameover()
{
    theGameIsOver = true;

    score = document.getElementById("score");
    let finalscore = parseInt(score.getAttribute("data-score")) || 0;
    score.innerHTML = "Score: " + finalscore + "<br><br>Game Over<br><br>";
    const button = document.createElement("button");
    button.onclick = () => resetgame();
    button.className = "level-button";
    button.innerHTML = "reset";
    score.appendChild(button);
}

/**
 * Resets the game by refreshing the window.
 */
function resetgame()
{
    location.reload();
}


/**
 * Increments the game score and updates the UI.
 */
function incrementScore() {
    let scoreElement = document.getElementById("score");
    let currentScore = parseInt(scoreElement.getAttribute("data-score")) || 0;
    currentScore += 1; // Increment score
    scoreElement.setAttribute("data-score", currentScore);
    scoreElement.innerHTML = `Score: ${currentScore}`;
}

/**
 * hides all buttons, given number of rows
 * @param {*} rows number of rows
 */
function hideButton(rows)
{
    for(var i =0; i < rows; i++)
    {
        for(var j=0; j < 9 ; j++)
        {   
            var button = document.getElementById("z[" + i + "][" + j + "]")
            button.style.opacity = "0";
        }
    }
}

/**
 * show all buttons, given number of rows
 * @param {*} rows number of rows
 */
function showButton(rows)
{
    for(var i =0; i < rows; i++)
    {
        for(var j=0; j < 9 ; j++)
        {   
            var button = document.getElementById("z[" + i + "][" + j + "]")
            button.style.opacity = "1";
        }
    }
}

/**
 * blink the buttons, given the blinking interval and length of the blinking.
 * @param {*} rows number of rows.
 * @param {*} interval interval between the hiding and showing the button.
 * @param {*} length length of the blinking.
 */
function blink(rows, interval, length)
{
    var test;
    var test2;
    setTimeout(()=>{test = setInterval(function() {hideButton(rows)},2000);},0);
    setTimeout(()=>{test2 = setInterval(function() {showButton(rows)},2000);},interval);
    setTimeout(()=>{clearInterval(test)},length-interval)
    setTimeout(()=>{clearInterval(test2)},length)
}

/**
 * Widened the buttons, given the number of rows and if its true.
 * @param {*} rows number of rows
 * @param {*} bool true for widen the rows, false for unwiden.
 */
function widenedButton(rows,bool)
{
    if(bool)
    {    
        for(var i =0; i < rows; i++)
        {
            for(var j=0; j < 9 ; j++)
            {   
                var button = document.getElementById("z[" + i + "][" + j + "]")
                button.className = "spreadoutbox";
            }
        }
    }
    else
    {
        for(var i =0; i < rows; i++)
            {
                for(var j=0; j < 9 ; j++)
                {   
                    var button = document.getElementById("z[" + i + "][" + j + "]")
                    button.className = "box";
                }
            }
    }
}
