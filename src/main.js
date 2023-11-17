// https://github.com/CrazyTim/spin-wheel
if (typeof spinwheeldata === 'undefined') {
    let err = "items.js in the main folder is missing. Use the example in the README.md"
    alert(err);
    throw new Error(err);
}

const data = spinwheeldata;
const result_table = document.getElementById("result_table");
const result_header = document.getElementById("result_header");
let time_btn = document.querySelector("#time button");
let games_btn = document.querySelector("#games button");
let wins_btn = document.querySelector("#wins button");
let globalResetOk = false;
let currentGame = {
    time: null,
    games: {},
    wins: null,
    winsToGo: null,
}

let winsWheel = null, timeWheel = null, gamesWheel = null;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function changeFontSizeOfCtx(ctx_, newSize) {
    let fontArgs = ctx_.font.split(' ');
    ctx_.font = newSize + 'px ' + fontArgs[fontArgs.length - 1];
}

function lerp(a, b, t) {
    return a + (b - a) * t;
}

function rgbToHex(r, g, b) {
    const red = r.toString(16).padStart(2, '0');
    const green = g.toString(16).padStart(2, '0');
    const blue = b.toString(16).padStart(2, '0');
    return `#${red}${green}${blue}`;
}

function generateGradient(i) {
    // Define the starting color (light green) and ending color (light red)
    const startColor = { r: 144, g: 238, b: 144 };
    const endColor = { r: 255, g: 100, b: 100 };

    // Initialize the array to store the gradient colors
    const gradientColors = [];

    // Generate the gradient colors
    for (let j = 0; j < i; j++) {
        // Calculate the interpolation parameter
        const t = j / (i - 1);

        // Interpolate between the starting and ending colors
        const r = Math.round(lerp(startColor.r, endColor.r, t));
        const g = Math.round(lerp(startColor.g, endColor.g, t));
        const b = Math.round(lerp(startColor.b, endColor.b, t));

        // Convert the RGB components to a CSS color string
        //const color = `rgb(${r}, ${g}, ${b})`;
        const color = rgbToHex(r,g,b);
        // Add the color to the gradient array
        gradientColors.push(color);
    }

    // Return the array of gradient colors
    return gradientColors;
}

function activateButtons(state) {
    time_btn.disabled = !state;
    wins_btn.disabled = !state;
    games_btn.disabled = !state;
}

function addGame(g) {
    let cg = currentGame;
    let td = null;
    if (g in cg.games) {
        cg.games[g].wins += 1;
        td = cg.games[g].td;
    } else {
        let tr = document.createElement("tr");
        td = document.createElement("td");
        tr.appendChild(td);
        result_table.appendChild(tr);
        cg.games[g] = {
            wins: 1,
            td: td
        }
    }
    td.innerHTML = `<b>${cg.games[g].wins}x</b> ${g.toUpperCase()}`;
    cg.winsToGo -= 1;
    if (cg.winsToGo != 0) {
        games_btn.innerHTML = `${cg.winsToGo}x GAMES`;
    } else {
        games_btn.innerHTML = "GAMES";
        games_btn.disabled = true;
    }
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min); 
  // The maximum is exclusive and the minimum is inclusive
}

/* wins */
function wins() {
    const prop = {
        items: data.wins.map((x) => ({ "label": ""+x }))
    }
    const backgroundColors = generateGradient(prop.items.length)
    for (let i = 0; i < prop.items.length; i++) {
        prop.items[i]["backgroundColor"] = backgroundColors[i];
    }
    const wheel = new spinWheel.Wheel(document.querySelector('#wins-wheel'), prop);    
    wheel.itemLabelRotation = 90;
    wheel.itemLabelFontSizeMax = 100;
    wheel.itemLabelBaselineOffset = -0.5;
    wheel.itemLabelAlign = "center";
    wheel.overlayImage = './imgs/wheel-overlay.svg';
    wheel.lineWidth = 1.5;
    wheel.rotationSpeedMax = 1000;
    wheel.rotationResistance = -240;
    wheel.image = "./imgs/hyiep.png"
    wheel.onRest = async (e) => {
        let cg = currentGame;
        await wheelFinishAnimation(wheel, wheel._items[e.currentIndex]);
        cg.wins = wheel._items[e.currentIndex].label;
        cg.winsToGo = cg.wins;
        wins_btn.disabled = true;
        result_header.innerHTML = `In <b>${cg.time}</b> win <b>${cg.wins}</b> games:`;
        result_table.innerHTML = "";
        games_btn.innerHTML = `${cg.wins}x GAMES`;
    };
    return wheel;
}


/* time */
function times() {
    const prop = {
        items: data.time.map((x) => ({ "label": ""+x }))
    }
    const backgroundColors = generateGradient(prop.items.length).reverse()
    for (let i = 0; i < prop.items.length; i++) {
        prop.items[i]["backgroundColor"] = backgroundColors[i];
    }
    const wheel = new spinWheel.Wheel(document.querySelector('#time-wheel'), prop);    
    wheel.itemLabelRotation = 90;
    wheel.itemLabelFontSizeMax = 100;
    wheel.itemLabelBaselineOffset = -0.5;
    wheel.itemLabelAlign = "center";
    wheel.overlayImage = './imgs/wheel-overlay.svg';
    wheel.lineWidth = 1.5;
    wheel.rotationSpeedMax = 1000;
    wheel.rotationResistance = -240;
    wheel.image = "./imgs/hyiep.png"
    wheel.onRest = async (e) => {
        await wheelFinishAnimation(wheel, wheel._items[e.currentIndex]);
        currentGame.time = wheel._items[e.currentIndex].label;
        time_btn.disabled = true;
        games_btn.disabled = false;
    };
    return wheel;
}


/* games */
function games() {
    const prop = { items: [] };
    for (let game_id in data.games) {
        let game = data.games[game_id];
        let item = {
            //"label" : game["name"],
            "image" : game["img"],
            "value" : game_id
        };
        if (game.color) {
            item["backgroundColor"] = game["color"];
        }
        prop.items.push(item);
    }
    const wheel = new spinWheel.Wheel(document.querySelector('#games-wheel'), prop);    
    wheel.overlayImage = './imgs/wheel-overlay.svg';
    wheel.itemLabelAlign = "center";
    wheel.lineWidth = 1.5;
    wheel.rotationSpeedMax = 1000;
    wheel.itemLabelFontSizeMax = 70;
    wheel.rotationResistance = -240;
    wheel.image = "./imgs/hyiep.png"
    wheel.onRest = async (e) => {
        let finishItem = wheel._items[e.currentIndex];
        await gameFinishAnimation(wheel, finishItem);
        addGame(data.games[finishItem.value].name);
    }
    return wheel;
}

async function wheelFinishAnimation(w, finishItem) {
    await sleep(300);
    let ctx = w._context;
    ctx.save();
    ctx.fillStyle = "#C1C1C1";
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#C1C1C1"; 
    const waitTime = Math.round(200 / w._items.length) 
    for (let i = 0; i < w._items.length; ++i) {
        let j = (finishItem.getIndex() + i) % w._items.length;
        ctx.fill(w._items[j].path);
        ctx.stroke(w._items[j].path);
        await sleep(waitTime);
    }
    ctx.fillStyle = finishItem.labelColor ?? "#000";
    changeFontSizeOfCtx(ctx, w.itemLabelFontSize*2.5);
    ctx.fillText(finishItem.label, w._center.x, w._center.y);
    ctx.restore();

}

async function gameFinishAnimation(w, finishItem) {
    await sleep(300);
    console.log(finishItem);
    let ctx = w._context;
    ctx.save();
    ctx.fillStyle = finishItem.backgroundColor ?? "#C1C1C1";
    ctx.lineWidth = 5;
    ctx.strokeStyle = ctx.fillStyle;
    const waitTime = Math.round(200 / w._items.length)
    for (let i = 0; i < w._items.length; ++i) {
        let j = (finishItem.getIndex() + i) % w._items.length;
        ctx.fill(w._items[j].path);
        ctx.stroke(w._items[j].path);
        await sleep(waitTime);
    } 
    ctx.fillStyle = finishItem.labelColor ?? "#FFFFFF";
    let fontSize = w.itemLabelFontSize*0.7
    changeFontSizeOfCtx(ctx, fontSize);
    // draw text
    for (let [i, line] of data.games[finishItem.value].name.split('\n').entries()) {
        ctx.fillText(line, w._center.x, w._center.y*1.4+i*fontSize);
    }
    // image draw
    const width = (w._size / 600) * finishItem.image.width * finishItem.imageScale;
    const height = (w._size / 600) * finishItem.image.height * finishItem.imageScale;
    const widthHalf = w._center.x - (width / 2);
    const heightHalf = w._center.y - (height / 1.3 );
    ctx.drawImage(finishItem.image, widthHalf, heightHalf, width, height);
    ctx.restore();

}

function resetGame() {
    if (winsWheel != null) winsWheel.remove();
    if (timeWheel != null) timeWheel.remove();
    if (gamesWheel != null) gamesWheel.remove();
    winsWheel = wins()
    timeWheel = times()
    gamesWheel = games()
}

function spinConfig(wheel, arr) {
    wheel.spinToItem(
        getRandomInt(0, arr.length), 
        2200, 
        false, 
        2,
        1,
        (t) => {
            // const t1 = t - 1;
            // return t < 0.5 ? 8 * t * t * t * t : 1 - 8 * t1 * t1 * t1 * t1;
            const t1 = t - 1;
            return 1 - t1 * t1 * t1 * t1;
        });
}

time_btn.addEventListener('click', (e) => { spinConfig(timeWheel, data.time); })
games_btn.addEventListener('click', (e) => { spinConfig(gamesWheel, gamesWheel.items); })
wins_btn.addEventListener('click', (e) => { spinConfig(winsWheel, data.wins); })

// GAME SETUP
resetGame();
games_btn.disabled = true;