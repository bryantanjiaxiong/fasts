/**
 * generates color that are not able to be clicked.
 */
function generateDontColorInstruction() {
    const colors = ["blue", "green", "red"];
    dontColor = colors[Math.floor(Math.random() * colors.length)];

    const instructions = document.getElementById("instructions");
    instructions.innerHTML = `Avoid clicking the color: <span style="color:${dontColor}; font-weight:bold">${dontColor}</span>`;
}
