const prizes = [
    { text: "Free Aloo roll\n& softy", color: "#FFC72C", code: "ALOOSOFTY" },
    { text: "Free 2 softy", color: "#FFFFFF", code: "2SOFTY" },
    { text: "Free large\nfries", color: "#FFC72C", code: "FRIES" },
    { text: "Free Aloo roll", color: "#FFFFFF", code: "ALOO" },
    { text: "Free Aloo roll\n& softy", color: "#FFC72C", code: "ALOOSOFTY" },
    { text: "Free 2 softy", color: "#FFFFFF", code: "2SOFTY" },
    { text: "Free large\nfries", color: "#FFC72C", code: "FRIES" },
    { text: "Free Aloo roll", color: "#FFFFFF", code: "ALOO" }
];

const wheel = document.getElementById('wheel');
const spinBtn = document.getElementById('spin-btn');
const modal = document.getElementById('winner-modal');
const winTitle = document.getElementById('win-title');
const winDesc = document.getElementById('win-description');
const winCode = document.getElementById('win-code');
const copyBtn = document.getElementById('copy-btn');
const closeBtn = document.getElementById('close-modal');

const totalSlices = prizes.length;
const sliceAngle = 360 / totalSlices;

// Build the wheel gradients and labels
let gradientParts = [];
prizes.forEach((prize, index) => {
    const startAngle = index * sliceAngle;
    const endAngle = (index + 1) * sliceAngle;
    gradientParts.push(`${prize.color} ${startAngle}deg ${endAngle}deg`);
    
    // Create text element
    const textEl = document.createElement('div');
    textEl.classList.add('slice-text');
    textEl.innerText = prize.text;
    
    // Position text: rotate to point outwards (radial layout)
    const textRotation = startAngle + (sliceAngle / 2);
    // Use CSS variable so we can easily adjust radius in CSS media queries
    textEl.style.setProperty('--rot', `${textRotation - 90}deg`);
    
    wheel.appendChild(textEl);
});

// Add edge pegs
for (let i = 0; i < totalSlices; i++) {
    const peg = document.createElement('div');
    peg.classList.add('peg');
    const angle = i * sliceAngle;
    peg.style.setProperty('--rot', `${angle}deg`);
    wheel.appendChild(peg);
}

wheel.style.background = `conic-gradient(${gradientParts.join(', ')})`;

let currentRotation = 0;
let isSpinning = false;

// Registration Logic
const regOverlay = document.getElementById('registration-overlay');
const regForm = document.getElementById('registration-form');

// Check if user already registered/spun on load
if(localStorage.getItem('userName')) {
    regOverlay.classList.remove('active');
    if(localStorage.getItem('hasSpun')) {
        spinBtn.disabled = true;
        spinBtn.innerText = "ALREADY SPUN";
        
        // Automatically pop up their prize so they never lose their code
        winTitle.innerText = "Welcome Back!";
        winDesc.innerText = localStorage.getItem('winningDesc') || "Here is your prize code.";
        winCode.innerText = localStorage.getItem('winningCode') || "N/A";
        modal.classList.add('active');
    }
}

regForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('user-name').value;
    const phone = document.getElementById('user-phone').value;
    if (name && phone) {
        localStorage.setItem('userName', name);
        localStorage.setItem('userPhone', phone);
        regOverlay.classList.remove('active');
        
        // Show their prize if they already spun before
        if(localStorage.getItem('hasSpun')) {
            spinBtn.disabled = true;
            spinBtn.innerText = "ALREADY SPIN";
            winTitle.innerText = "Welcome Back!";
            winDesc.innerText = localStorage.getItem('winningDesc') || "Here is your prize code.";
            winCode.innerText = localStorage.getItem('winningCode') || "N/A";
            modal.classList.add('active');
        }
    }
});

// Generate unique marketing code
function generateUniqueCode(prizeCode) {
    const randomChars = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `COUNTRYROLLS-${prizeCode}-${randomChars}`;
}

spinBtn.addEventListener('click', () => {
    spinBtn.disabled = true;
    spinBtn.innerText = "SPINNING...";
    
    // A perfectly shuffled deck of exactly 50 codes so they appear random but never repeat!
    const shuffledSequence = [27, 14, 42, 8, 31, 49, 5, 18, 36, 11, 45, 2, 23, 38, 16, 29, 7, 50, 21, 4, 34, 12, 41, 26, 3, 47, 19, 9, 33, 25, 46, 1, 39, 15, 28, 43, 10, 24, 37, 20, 6, 44, 30, 13, 35, 48, 22, 40, 17, 32];
    
    // Fetch sequence FIRST
    fetch('https://api.counterapi.dev/v1/countryrolls_v4/spins/up')
        .then(res => res.json())
        .then(data => data.count)
        .catch(e => {
            console.error("Counter API failed", e);
            return Math.floor(Math.random() * 50) + 1; // fallback
        })
        .then(spinCount => {
            // Map the sequential visitor number to our shuffled random code!
            let index = (spinCount - 1) % 50;
            let mappedCodeNumber = shuffledSequence[index];
            
            let possibleIndices = [];
            
            // C001-C013: 1 Aloo Roll + Softy Free
            if (mappedCodeNumber >= 1 && mappedCodeNumber <= 13) {
                possibleIndices = [0, 4];
            } 
            // C014-C026: Softy Free
            else if (mappedCodeNumber >= 14 && mappedCodeNumber <= 26) {
                possibleIndices = [1, 5];
            } 
            // C027-C038: Free Large Fries
            else if (mappedCodeNumber >= 27 && mappedCodeNumber <= 38) {
                possibleIndices = [2, 6];
            } 
            // C039-C050: 1 Free Aloo Roll
            else {
                possibleIndices = [3, 7];
            }
            
            const targetSliceIndex = possibleIndices[Math.floor(Math.random() * possibleIndices.length)];
            
            // Calculate exact degree to land on target slice
            const baseCurrent = Math.ceil(currentRotation / 360) * 360;
            let nextRotation = baseCurrent + 1800 + (360 - (targetSliceIndex * sliceAngle));
            nextRotation += (Math.random() * 30 - 15); // random offset within the slice limits
            currentRotation = nextRotation;
            
            // Spin the wheel
            wheel.style.transition = 'transform 4s cubic-bezier(0.1, 0.7, 0.1, 1)';
            wheel.style.transform = `rotate(${currentRotation}deg)`;
            
            // Wait for exact CSS animation time, then pop up winner
            setTimeout(() => {
                const actualDeg = currentRotation % 360;
                const sliceIndex = Math.floor((360 - actualDeg + (sliceAngle / 2)) % 360 / sliceAngle);
                const winningPrize = prizes[sliceIndex];
                showWinner(winningPrize, mappedCodeNumber);
            }, 4000);
        });
});

function showWinner(prize, spinCount) {
    winTitle.innerText = "YOU WON!";
    winTitle.style.color = "var(--primary-yellow)";
    winTitle.style.webkitTextStroke = "1px var(--black)";
    winDesc.innerText = prize.text;
    
    // Format Sequential Code: C001
    const paddedCount = (spinCount || 1).toString().padStart(3, '0');
    const code = `C${paddedCount}`;
    winCode.innerText = code;
    
    // Calculate Expiration Date (48 hours from now)
    const expDate = new Date();
    expDate.setHours(expDate.getHours() + 48);
    const expString = expDate.toLocaleString();
    
    // 1-SPIN LIMIT ENABLED FOR PRODUCTION
    localStorage.setItem('hasSpun', 'true');
    localStorage.setItem('winningCode', code);
    localStorage.setItem('winningDesc', prize.text);
    
    // --- SEND DATA TO GOOGLE SHEETS ---
    const scriptURL = "https://script.google.com/macros/s/AKfycbxF2Z5p6GiEag6o8sQJWg8YXHKPhAGa3Mg1O8U2IkkNS-jwNMAwqOJ14xfobtlOGmhC/exec"; 
    if (scriptURL !== "YOUR_GOOGLE_SCRIPT_WEB_APP_URL_HERE") {
        fetch(scriptURL, {
            method: 'POST',
            body: JSON.stringify({
                name: localStorage.getItem('userName'),
                phone: localStorage.getItem('userPhone'),
                prize: prize.text,
                code: `${code} (Expires: ${expString})`
            }),
            // Using plain text prevents CORS preflight errors with Google Apps Script
            headers: { "Content-Type": "text/plain;charset=utf-8" } 
        }).then(response => console.log("Saved to Google Sheets!"))
          .catch(error => console.error("Error saving to sheets", error));
    }
    
    // Trigger Confetti
    if (typeof confetti === 'function') {
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#FFC72C', '#111111', '#FFFFFF']
        });
    }
    
    spinBtn.disabled = true;
    spinBtn.innerText = "SPIN COMPLETE";
    modal.classList.add('active');
}

copyBtn.addEventListener('click', () => {
    const code = winCode.innerText;
    navigator.clipboard.writeText(code);
    copyBtn.innerText = "Copied!";
    setTimeout(() => { copyBtn.innerText = "Copy"; }, 2000);
});

closeBtn.addEventListener('click', () => {
    modal.classList.remove('active');
});
