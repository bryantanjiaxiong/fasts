
let score = 0;
let theGameIsOver = false;

document.getElementById("start-easy").addEventListener("click", () => startCountdown(0));
document.getElementById("start-normal").addEventListener("click", () => startCountdown(1));
document.getElementById("start-intended").addEventListener("click", () => startCountdown(2));

/**
 * start game countdown, for users to prepare before the game starts, given the difficulty chosen.
 * @param {*} difficulty the difficulty of the game.
 */
function startCountdown(difficulty) {
    let timer = 3;
    const startButton = document.getElementById("instructions");
    const button1 = document.getElementById("start-easy");
    const button2 = document.getElementById("start-normal");
    const button3 = document.getElementById("start-intended");
    button1.style.display = "none";
    button2.style.display = "none";
    button3.style.display = "none";

    const interval = setInterval(() => {
        startButton.innerHTML = timer > 0 ? timer-- : "Starting...";
    }, 1000);

    setTimeout(() => {
        clearInterval(interval);
        document.getElementById("instructions").innerHTML = "";
        score = 0;
        theGameIsOver = false;
        document.getElementById("score").innerHTML = `Score: ${score}`;
        startGame(difficulty);
    }, 4000);
}

/**
 * starts the game, given the difficulty.
 * @param {*} difficulty game difficulty.
 */
function startGame(difficulty) {
    // Different difficulty settings
    const levelTimings = [
        [480, 485, 490, 500, 650, 700, 800, 900, 1000, 1200],
        [300, 470, 480, 500, 650, 700, 800, 900, 1000, 1200],
        [300, 300, 400, 500, 600, 700, 800, 850, 900, 1000]
    ];

    startLevels(levelTimings[difficulty]);
    var fiveMinutes = 60 * 5,
    display = document.querySelector('#timer');
    startTimer(fiveMinutes, display)
}

function startTimer(duration, display) {
    var timer = duration, minutes, seconds;
    setInterval(function () {
      minutes = parseInt(timer / 60, 10);
      seconds = parseInt(timer % 60, 10);
  
      minutes = minutes < 10 ? "0" + minutes : minutes;
      seconds = seconds < 10 ? "0" + seconds : seconds;
  
      display.textContent = minutes + ":" + seconds;
  
      if (--timer < 0) {
        timer = duration;
        // Optional: Perform an action when the timer reaches 0
        alert("Time's up!");
      }
    }, 1000);
  }
