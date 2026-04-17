let balance = 100.00; // starting money
const betAmount = 1.00;

let startTime = 0
let crashPoint = 0;
let running = false;
let playerActive = false;
let roundEnded = false;
let multiplier = 1.0;
let speed = 0.05; // controls how fast it grows

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
/*     let t = seconds * speed;

    let slow = Math.pow(t, 1.8);

    let fast = Math.exp(t) - 1;

    let blend = Math.min(1, slow / 1.2);

    // smooth exponential growth over time
    multiplier = 1 + (slow * (1 - blend) + fast * blend); */

    document.getElementById("multiplier").innerText = multiplier.toFixed(2) + "x";

    if (multiplier >= crashPoint) {
        endRound();
        return;
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

    // 3% ultra-fast crash branch
    if (r < 0.03) {
        return 1.01; // instant crash
    }

    // create a "crash curve"
    // Examples:
// | r (Math.random) | raw = -ln(1 - r) | crash = 1 + raw * 5 |
// | --------------- | ---------------- | ------------------- |
// | 0.10            | 0.105            | 1.53x               |
// | 0.25            | 0.288            | 2.44x               |
// | 0.50            | 0.693            | 4.47x               |
// | 0.70            | 1.204            | 7.02x               |
// | 0.80            | 1.609            | 9.04x               |
// | 0.90            | 2.303            | 12.52x              |
// | 0.95            | 2.996            | 15.98x              |
// | 0.97            | 3.507            | 18.53x              |
// | 0.99            | 4.605            | 24.03x              |

    let raw = -Math.log(1 - r);
    let crash = 1 + raw * K;
    
    // clamp extremes
    let crashPoint = Math.max(1.2, Math.min(crash, 50));

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