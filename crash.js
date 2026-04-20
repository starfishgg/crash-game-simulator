let balance = 100.00; // starting money
const betAmount = 1.00;

let startTime = 0
let crashPoint = 0;
let running = false;
let playerActive = false;
let roundEnded = false;
let multiplier = 1.0;

let speed = 0.05; // controls how fast it grows

const eV = 0.97; // expected value, to ensure profitability
const houseEdge = 1 - eV;
const multiplierCap = 20;



// Crash Point Tuning
let K =3 // 3 = safe, 5 = balanced, 7 = agressive


document.addEventListener('DOMContentLoaded', function() {
    updateBalanceUI();
});


function animate(timestamp) {
    if (!running) return;

    if (!startTime) startTime = timestamp;

    const elapsed = timestamp - startTime;
    const seconds = elapsed / 1000;

    let t = Math.pow(seconds * speed, 1.6);
    multiplier = 1 + t + Math.pow(t, 2.2) * 1.5;

    // Update the multiplier inside this if/else so it doesn't get bigger than the crashpoint at high values
    if (multiplier >= crashPoint) {
        document.getElementById("multiplier").innerText = crashPoint.toFixed(2) + "x";
        endRound();
        return;
    }
    else {
        document.getElementById("multiplier").innerText = multiplier.toFixed(2) + "x";
    }

    requestAnimationFrame(animate);
}


function updateBalanceUI() {
    document.getElementById("balance").innerText = balance.toFixed(2);
    document.getElementById("cost").innerText = betAmount.toFixed(2);
}


// If r is small, result close to 1
// If r is close to 1, result explodes upward

function getCrashPoint() {
    // Simple "house edge" style randomness
    const r = Math.random();

    // Ultra-fast crash branch (can allow us to have more long games if we implement)
    if (r <= houseEdge) {
        return 1.01; // instant crash
    }

    // create a "crash curve"
    // Examples:
    // | r (Math.random) | 1 / (1 - r)
    // | 0.10               1.11
    // | 0.25               1.33
    // | 0.50               2.00
    // | 0.70               3.33
    // | 0.80               5.00
    // | 0.90              10.00
    // | 0.95              20.00
    // | 0.97              33.33
    // | 0.99             100.00
    raw = Math.min(r + 2 * houseEdge, 0.99); // be VERY careful adding on houseEdge to not become unprofitable. I believe we can afford it at the moment due to 20x multiplier cap being > 0.97% chance

    let crash = (1 - houseEdge) / (1 - raw);

    // If we clamp extremes, we can probably allow more wiggle room for longer average games?
    // currently taking a random amount betweeen 1 and 10 off if it got clamped at 20 multiplier to make it more 'random'.
    let crashPoint = Math.min(crash, multiplierCap-Math.random()-Math.floor(Math.random() * 10));
    //document.getElementById("debug").innerText = "CrashPoint: " + crashPoint.toFixed(2) + "x";
    return crashPoint;
}


function startRound() {
    if (running) 
        return;

    roundEnded = false;

    if (balance < betAmount) {
        document.getElementById("result").innerText = "❌ Not enough balance";
        return;
    }

    // 💸 take bet
    balance -= betAmount;
    updateBalanceUI();

    multiplier = 1.0;
    crashPoint = getCrashPoint();
    running = true;
    playerActive = true;
    startTime = 0;

    document.getElementById("multiplier").innerText = "1.00x";
    document.getElementById("result").innerText = "";

    requestAnimationFrame(animate);
}


function cashOut() {
    if (!running || !playerActive)
        return;

    playerActive = false;

    const winnings = betAmount * multiplier;
    balance += winnings;
    
    document.getElementById("result").innerText = "✅ Cashed out at " + multiplier.toFixed(2) + "x";

    updateBalanceUI();
}


function endRound() {
    if (roundEnded) 
        return;
    
    roundEnded = true;
    running = false;

    if (playerActive) {
        // player didn't cash out -> loss
        document.getElementById("result").innerText = "💥 Crashed at " + crashPoint.toFixed(2) + "x";

    }
    else {
        // player already cashed out -> just show crash info
        document.getElementById("result").innerText +=
            " | 💥 Crashed at " + crashPoint.toFixed(2) + "x";
    }

    updateBalanceUI();
}