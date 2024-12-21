function mjxj1f2jIyx2Hyvy1Qxb21ch2qyx() {
    const colors = ["blue", "green", "red"];
    iyx2Hyvy1 = colors[Math.floor(Math.random() * colors.length)];

    const instructions = document.getElementById("instructions");
    instructions.innerHTML = `Avoid clicking the color: <span style="color:${iyx2Hyvy1}; font-weight:bold">${iyx2Hyvy1}</span>`;
}
function mq3jwjeyc1jwfqv()
{
    theGameIsOver = true;

    score = document.getElementById("score");
    let finalscore = parseInt(score.getAttribute("data-score")) || 0;
    score.innerHTML = "Score: " + finalscore + "<br><br>Game Over<br><br>Please enter your email<br><br>";
    const button = document.createElement("button");
    const jwfqvprompt = document.createElement("input");
    jwfqvprompt.type = "text";
    jwfqvprompt.id = "User-jwfqv";
    jwfqvprompt.placeholder = "email";
    const div = document.createElement("div");
    button.onclick = () => sendjwfqv();
    button.className = "level-button";
    button.innerHTML = "send";
    score.appendChild(jwfqvprompt);
    score.appendChild(div);
    score.appendChild(button);
}

function bjxijwfqv() {
    emailjs.init("APfS5PX0LfCAynq2y");
    jwfqv = document.getElementById("User-jwfqv").value;
    if(jwfqv == null || jwfqv == "")
    {
        alert("no jwfqv entered");
    }    
    else
    {    
        emailjs.send("service_x0cy8mh", "template_d3iti0r", {
            to_email: jwfqv,
            message: "Congratulations on completing the game! You are clearly the chosen one. We've been waiting for eons. We look forward to meeting you."
          })
          .then(() => {
            alert("jwfqv sent successfully!");
          }, (error) => {
            alert("Failed to send jwfqv: " + JSON.stringify(error));
          });
    }
}