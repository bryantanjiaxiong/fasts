/**
 * Starts level 1 (1 row)
 * @param {*} timings interval between colors, set by the game difficulty.
 */
function level1(timings)
{
    var test = setInterval(function() { if(theGameIsOver == false){getRandomColor(1,9);} }, timings);
    setTimeout(() => {clearInterval(test)}, 14500)
}
/**
 * Starts level 7 (3 rows)
 * @param {*} timings interval between colors, set by the game difficulty.
 */
function level7(timings)
{
    var test = setInterval(function() { if(theGameIsOver == false){getRandomColor(3,9);} }, timings);
    setTimeout(() => {clearInterval(test)}, 14500)
}
/**
 * Starts level 10 (9 rows)
 * @param {*} timings interval between colors, set by the game difficulty.
 */
function level10(timings)
{
    var test = setInterval(function() { if(theGameIsOver == false){getRandomColor(9,9);} }, timings);
    setTimeout(() => {clearInterval(test)}, 14500)
}
/**
 * Starts level 12 (9 rows) with dont touch color rules.
 * @param {*} timings interval between colors, set by the game difficulty.
 */
function level12(timings)
{
    var test = setInterval(function() { if(theGameIsOver == false){getRandomColor(9,9);} }, timings);
    generateDontColorInstruction();
    setTimeout(() => {clearInterval(test)}, 14500);
}