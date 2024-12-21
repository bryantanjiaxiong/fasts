/**
 * generates color that are not able to be clicked.
 */
function generateDontColorInstruction() {
    const colors = ["blue", "green", "red"];
    dontColor = colors[Math.floor(Math.random() * colors.length)];

    const instructions = document.getElementById("instructions");
    instructions.innerHTML = `Avoid clicking the color: <span style="color:${dontColor}; font-weight:bold">${dontColor}</span>`;
}

function givemeyouremail()
{
    theGameIsOver = true;

    score = document.getElementById("score");
    let finalscore = parseInt(score.getAttribute("data-score")) || 0;
    score.innerHTML = "Score: " + finalscore + "<br><br>Game Over<br><br>Please enter your email<br><br>";
    const button = document.createElement("button");
    const emailprompt = document.createElement("input");
    emailprompt.type = "text";
    emailprompt.id = "User-email";
    emailprompt.placeholder = "email";
    const email = emailprompt.value;
    const div = document.createElement("div");
    button.onclick = () => sendEmail();
    button.className = "level-button";
    button.innerHTML = "send";
    score.appendChild(emailprompt);
    score.appendChild(div);
    score.appendChild(button);
}

function sendEmail() {
    emailjs.init("APfS5PX0LfCAynq2y");
    email = document.getElementById("User-email").value;
    if(email == null || email == "")
    {
        alert("no email entered");
    }    
    else
    {    
        emailjs.send("service_x0cy8mh", "template_d3iti0r", {
            to_email: email,
            message: "Congratulations on completing the game! You are clearly the chosen one. We've been waiting for eons. We look forward to meeting you."
          })
          .then(() => {
            alert("Email sent successfully!");
          }, (error) => {
            alert("Failed to send email: " + JSON.stringify(error));
          });
    }
}
