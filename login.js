// =========================================================
// ZERO-KNOWLEDGE CLIENT STORAGE (INDEXEDDB + WEB CRYPTO)
// =========================================================

const DB_NAME = "BND_ClientVault";
const DB_VERSION = 1;
const STORE_NAME = "secure_userdata";

// 1. Initialize IndexedDB
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: "username" });
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// 2. Cryptographic Key Derivation (PBKDF2 -> AES-GCM 256-bit)
async function deriveEncryptionKey(passcode, salt) {
    const encoder = new TextEncoder();
    const baseKey = await window.crypto.subtle.importKey(
        "raw",
        encoder.encode(passcode),
        "PBKDF2",
        false,
        ["deriveKey"]
    );

    return window.crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: salt,
            iterations: 150000,
            hash: "SHA-256"
        },
        baseKey,
        { name: "AES-GCM", length: 256 },
        false, // Key cannot be extracted from browser memory
        ["encrypt", "decrypt"]
    );
}

// 3. Encrypt JSON Game Data
async function encryptData(dataObject, passcode, salt) {
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(JSON.stringify(dataObject));
    const aesKey = await deriveEncryptionKey(passcode, salt);
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    const ciphertext = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        aesKey,
        encodedData
    );

    return { iv, ciphertext };
}

// 4. Decrypt Raw Buffers
async function decryptData(encryptedRecord, passcode) {
    try {
        const aesKey = await deriveEncryptionKey(passcode, encryptedRecord.salt);
        const decryptedBuffer = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv: encryptedRecord.iv },
            aesKey,
            encryptedRecord.ciphertext
        );
        return JSON.parse(new TextDecoder().decode(decryptedBuffer));
    } catch (e) {
        return null; // Decryption failed (invalid passcode or corrupted record)
    }
}

// =========================================================
// VAULT OPERATIONS
// =========================================================

async function registerClientAccount(orgUsername, passcode) {
    const db = await openDB();
    const normUser = orgUsername.toLowerCase().trim();

    const existing = await new Promise(res => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const req = tx.objectStore(STORE_NAME).get(normUser);
        req.onsuccess = () => res(req.result);
        req.onerror = () => res(null);
    });

    if (existing) {
        return { success: false, reason: "Organization vault already exists on this device." };
    }

    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const initialOrgVault = {
        organizationName: orgUsername,
        registeredAt: new Date().toISOString(),
        nextParticipantId: 101,
        participants: {},
        leaderboard: []
    };

    const { iv, ciphertext } = await encryptData(initialOrgVault, passcode, salt);

    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        tx.objectStore(STORE_NAME).put({ username: normUser, salt, iv, ciphertext });
        tx.oncomplete = () => {
            sessionStorage.setItem("activeUser", normUser);
            sessionStorage.setItem("activePass", passcode);
            sessionStorage.setItem("lastActiveTimestamp", Date.now().toString());
            resolve({ success: true, data: initialOrgVault });
        };
        tx.onerror = () => reject(tx.error);
    });
}

async function unlockClientVault(orgUsername, passcode) {
    const db = await openDB();
    const normUser = orgUsername.toLowerCase().trim();

    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const req = tx.objectStore(STORE_NAME).get(normUser);
        req.onsuccess = async () => {
            const record = req.result;
            if (!record) return resolve({ success: false, reason: "Org vault not found." });

            const data = await decryptData(record, passcode);
            if (data) {
                sessionStorage.setItem("activeUser", normUser);
                sessionStorage.setItem("activePass", passcode);
                sessionStorage.setItem("lastActiveTimestamp", Date.now().toString());
                resolve({ success: true, data });
            } else {
                resolve({ success: false, reason: "Incorrect password." });
            }
        };
        req.onerror = () => reject(req.error);
    });
}


// Function to call whenever the player finishes a game:
async function updateGameStats(callback) {
    const activeUser = sessionStorage.getItem("activeUser");
    const activePass = sessionStorage.getItem("activePass");
    if (!activeUser || !activePass) return null;

    const db = await openDB();
    const record = await new Promise(res => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const req = tx.objectStore(STORE_NAME).get(activeUser);
        req.onsuccess = () => res(req.result);
        req.onerror = () => res(null);
    });

    if (!record) return null;
    const vault = await decryptData(record, activePass);
    if (!vault) return null;

    const updatedVault = callback(vault);
    const { iv, ciphertext } = await encryptData(updatedVault, activePass, record.salt);
    record.iv = iv;
    record.ciphertext = ciphertext;

    return new Promise(res => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        tx.objectStore(STORE_NAME).put(record);
        tx.oncomplete = () => res(updatedVault);
        tx.onerror = () => res(null);
    });
}

// =========================================================
// UI CONTROLS & POPUP
// =========================================================

let isSignUpMode = false;

function showLoginPopup() {
    const useracc = document.getElementById("user-acc");
    useracc.innerHTML = `
        <div id="login-popup" class="auth-modal">
            <button class="modal-close-btn" onclick="closeLoginPopup()">&times;</button>
            <h2 id="auth-title">${isSignUpMode ? 'Register Org Vault' : 'Unlock Org Vault'}</h2>
            <p class="auth-subtitle">Business-level zero-knowledge local storage.</p>
            <input type="text" id="username" placeholder="Org / Clinic Name" class="auth-input">
            <input type="password" id="password" placeholder="Master Passcode" class="auth-input">
            <div id="auth-error" class="auth-error" style="display:none;"></div>
            <button class="auth-submit-btn" onclick="handleAuthSubmit()">
                ${isSignUpMode ? 'Create Master Vault' : 'Unlock'}
            </button>
            <button class="auth-toggle-btn" onclick="toggleAuthMode()">
                ${isSignUpMode ? 'Have a vault? Log In' : 'New Org? Register'}
            </button>
        </div>
    `;
    useracc.style.display = "block";
}

function closeLoginPopup() {
    const useracc = document.getElementById("user-acc");
    useracc.innerHTML = "";
    useracc.style.display = "none";
}

function toggleAuthMode() {
    isSignUpMode = !isSignUpMode;
    showLoginPopup();
}

async function handleAuthSubmit() {
    const username = document.getElementById("username").value.trim();
    const passcode = document.getElementById("password").value;
    const errorEl = document.getElementById("auth-error");

    if (!username || !passcode) {
        errorEl.textContent = "Please fill in all fields.";
        errorEl.style.display = "block";
        return;
    }

    errorEl.style.display = "none";

    const result = isSignUpMode 
        ? await registerClientAccount(username, passcode)
        : await unlockClientVault(username, passcode);

    if (result.success) {
        closeLoginPopup();
        // Pass both the name AND the decrypted participants to populate the dropdown
        updateLoginButtonUI(username, result.data.participants || {});
        alert(isSignUpMode ? "Vault created! Your data is encrypted locally." : "Welcome back! Org vault unlocked.");
    } else {
        errorEl.textContent = result.reason;
        errorEl.style.display = "block";
    }
}

// function updateLoginButtonUI(username) {
//     const btn = document.getElementById("login-btn");
//     if (btn) {
//         btn.textContent = `👤 ${username}`;
//         btn.onclick = () => {
//             if (confirm(`Logged in as ${username}. Do you want to lock your vault (Log out)?`)) {
//                 sessionStorage.clear();
//                 btn.textContent = "Login/Signup";
//                 btn.onclick = showLoginPopup;
//             }
//         };
//     }
// }

// Shows username, export, and logout buttons when logged in
function updateLoginButtonUI(orgName, participants = {}) {
    const loginBtn = document.getElementById("login-btn");
    const profileBar = document.getElementById("user-profile-bar");
    const badge = document.getElementById("active-username");

    if (orgName) {
        if (loginBtn) loginBtn.style.display = "none";
        if (profileBar) profileBar.style.display = "flex";
        if (badge) badge.textContent = `🏢 ${orgName}`;
        populateParticipantDropdown(participants);
    } else {
        if (loginBtn) loginBtn.style.display = "inline-block";
        if (profileBar) profileBar.style.display = "none";
        currentParticipantId = null;
    }
}
function toggleProfileCard() {
    const card = document.getElementById("user-profile-bar");
    if (card) {
        card.classList.toggle("collapsed");
    }
}

function populateParticipantDropdown(participants = {}) {
    const select = document.getElementById("participant-select");
    if (!select) return;
    select.innerHTML = '<option value="">-- Select Player --</option>';

    Object.values(participants).forEach(p => {
        const opt = document.createElement("option");
        opt.value = p.id;
        opt.textContent = `${p.displayName} (${p.id})`;
        select.appendChild(opt);
    });

    if (currentParticipantId && participants[currentParticipantId]) {
        select.value = currentParticipantId;
    }
}

function handleParticipantChange(val) {
    currentParticipantId = val || null;
}

function showAddPlayerPrompt() {
    const name = prompt("Enter participant display name or ID:");
    if (name) registerParticipant(name);
}

async function showLeaderboardPopup() {
    const activeUser = sessionStorage.getItem("activeUser");
    const activePass = sessionStorage.getItem("activePass");
    if (!activeUser || !activePass) return alert("Unlock org vault first.");

    const db = await openDB();
    const record = await new Promise(res => {
        const req = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(activeUser);
        req.onsuccess = () => res(req.result);
    });

    const vault = await decryptData(record, activePass);
    const leaders = (vault && vault.leaderboard) || [];

    const leadersHtml = leaders.length > 0
        ? leaders.map((l, i) => `<p style="margin:8px 0; color:#f5f6f8;">#${i + 1} <b>${l.displayName}</b> — ${l.highScore} pts</p>`).join("")
        : "<p style=\"color:#9ea8b6;\">No sessions recorded yet.</p>";

    const useracc = document.getElementById("user-acc");
    useracc.innerHTML = `
        <div class="auth-modal">
            <button class="modal-close-btn" onclick="closeLoginPopup()">&times;</button>
            <h2 id="auth-title">🏆 Top 3 Leaderboard</h2>
            <div style="margin: 16px 0; width:100%; text-align:left;">${leadersHtml}</div>
            <button class="auth-submit-btn" onclick="closeLoginPopup()">Close</button>
        </div>
    `;
    useracc.style.display = "block";
}

// Explicit logout action
function handleLogout() {
    if (confirm("Lock organization vault?")) {
        sessionStorage.clear();
        updateLoginButtonUI(null);
    }
}


// =========================================================
// PARTICIPANT & ROUND RECORDING
// =========================================================

async function registerParticipant(displayName) {
    if (!displayName || !displayName.trim()) return;

    let createdId = null;

    const updatedVault = await updateGameStats((vault) => {
        if (!vault.participants) vault.participants = {};
        if (!vault.nextParticipantId) vault.nextParticipantId = 101;

        createdId = `UID-${vault.nextParticipantId++}`;
        vault.participants[createdId] = {
            id: createdId,
            displayName: displayName.trim(),
            createdAt: new Date().toISOString(),
            highScore: 0,
            sessionHistory: []
        };
        return vault;
    });

    if (updatedVault && createdId) {
        currentParticipantId = createdId;
        populateParticipantDropdown(updatedVault.participants);
        const select = document.getElementById("participant-select");
        if (select) select.value = createdId;
    }
}

async function recordGameSession(sessionData) {
    if (!currentParticipantId) {
        console.warn("No participant selected. Session discarded.");
        return false;
    }

    return await updateGameStats((vault) => {
        const player = vault.participants[currentParticipantId];
        if (!player) return vault;

        const accuracyRate = sessionData.totalClicks > 0
            ? ((sessionData.truePositives / sessionData.totalClicks) * 100).toFixed(2)
            : "0.00";

        player.sessionHistory.push({
            sessionId: player.sessionHistory.length + 1,
            timestamp: new Date().toISOString(),
            score: sessionData.score,
            truePositives: sessionData.truePositives,
            falsePositives: sessionData.falsePositives,
            totalClicks: sessionData.totalClicks,
            accuracyPercentage: accuracyRate,
            result: sessionData.result || "Finished"
        });

        if (sessionData.score > (player.highScore || 0)) {
            player.highScore = sessionData.score;
        }

        // Recompute Top 3 Leaderboard
        vault.leaderboard = Object.values(vault.participants)
            .map(p => ({ displayName: p.displayName, highScore: p.highScore }))
            .sort((a, b) => b.highScore - a.highScore)
            .slice(0, 3);

        return vault;
    });
}

// =========================================================
// CSV EXPORT (ALL PARTICIPANTS UNDER ORG)
// =========================================================

async function exportUserDataAsCSV() {
    const activeUser = sessionStorage.getItem("activeUser");
    const activePass = sessionStorage.getItem("activePass");
    if (!activeUser || !activePass) return alert("Unlock org vault first.");

    const db = await openDB();
    const record = await new Promise(res => {
        const req = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(activeUser);
        req.onsuccess = () => res(req.result);
    });

    const vault = await decryptData(record, activePass);
    if (!vault) return alert("Failed to decrypt vault.");

    const headers = [
        "Participant ID",
        "Display Name",
        "Session ID",
        "Timestamp (ISO)",
        "Score",
        "Hits (TP)",
        "Misses (FP)",
        "Total Clicks",
        "Accuracy (%)",
        "Result"
    ];

    const rows = [];
    Object.values(vault.participants || {}).forEach(player => {
        player.sessionHistory.forEach(sess => {
            rows.push([
                player.id,
                `"${player.displayName}"`,
                sess.sessionId,
                `"${sess.timestamp}"`,
                sess.score,
                sess.truePositives,
                sess.falsePositives,
                sess.totalClicks,
                `${sess.accuracyPercentage}%`,
                `"${sess.result}"`
            ]);
        });
    });

    if (rows.length === 0) return alert("No participant sessions recorded yet.");

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${activeUser}_all_participants_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Auto-check if session is already active on load
document.addEventListener("DOMContentLoaded", async () => {
    const activeUser = sessionStorage.getItem("activeUser");
    const activePass = sessionStorage.getItem("activePass");

    if (activeUser && activePass) {
        try {
            const db = await openDB();
            const record = await new Promise(res => {
                const req = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(activeUser);
                req.onsuccess = () => res(req.result);
                req.onerror = () => res(null);
            });

            if (record) {
                const vault = await decryptData(record, activePass);
                if (vault) {
                    updateLoginButtonUI(activeUser, vault.participants || {});
                }
            }
        } catch (e) {
            console.error("Failed to restore session vault:", e);
        }
    }
});

// // Login functionality
// function showLoginPopup() {
//     const useracc = document.getElementById("user-acc");
//     useracc.innerHTML = `
//         <div id="login-popup" style="position:fixed; z-index:9999; left:50%; top:50%; transform:translate(-50%, -50%); background: #fff5ef; border:1px solid #ccc; padding:20px; box-shadow:0 2px 8px rgba(0,0,0,0.1); height:40%; width:30%; border-radius:10px; display:flex; flex-direction:column; align-items:center; justify-content:center;">
//             <button style= "color:red; position:absolute; top:20px; right:30px; cursor:pointer; background:none; border:none; font-size:24px;" onclick= "closeLoginPopup()" >&times</button>
//             <h2>Login/Signup</h2>
//             <input type="text" id="username" placeholder="Username" style="display:block; margin:10px; width:50%; padding:8px;">
//             <input type="password" id="password" placeholder="Password" style="display:block; margin: 10px; width:50%; padding:8px;">
//             <button id="login-submit" style="padding:10px 20px; background:#007bff; color:#fff; border:none; cursor:pointer;" onclick="handleLogin()">Submit</button>
//         </div>
//     `;

// }

// function closeLoginPopup() {
//     const loginpopup = document.getElementById("login-popup");
//     loginpopup.style.display = "none";
// }



// // Initialize EmailJS
// (function() { emailjs.init("APfS5PX0LfCAynq2y"); })();

// // --- CRYPTO HELPERS ---

// // 1. Hash a string (passcode) for storage comparison
// async function hashString(str) {
//     const encoder = new TextEncoder();
//     const data = encoder.encode(str);
//     const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
//     return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
// }

// // 2. Encrypt Data using the hashed passcode as the key
// async function encryptGameData(data, passcode) {
//     const encoder = new TextEncoder();
//     const encodedData = encoder.encode(data);
    
//     // Generate a temporary key from the passcode
//     const passwordKey = await window.crypto.subtle.importKey(
//         "raw", encoder.encode(passcode), "PBKDF2", false, ["deriveKey"]
//     );
//     const aesKey = await window.crypto.subtle.deriveKey(
//         { name: "PBKDF2", salt: encoder.encode("game-salt"), iterations: 100000, hash: "SHA-256" },
//         passwordKey, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]
//     );

//     const iv = window.crypto.getRandomValues(new Uint8Array(12)); // Initialization Vector
//     const encrypted = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, aesKey, encodedData);

//     // Return as Base64 string for cookie storage: IV + Data
//     return btoa(JSON.stringify({
//         iv: Array.from(iv),
//         content: Array.from(new Uint8Array(encrypted))
//     }));
// }

// // 3. Decrypt Data
// async function decryptGameData(encryptedStr, passcode) {
//     try {
//         const { iv, content } = JSON.parse(atob(encryptedStr));
//         const encoder = new TextEncoder();
//         const passwordKey = await window.crypto.subtle.importKey(
//             "raw", encoder.encode(passcode), "PBKDF2", false, ["deriveKey"]
//         );
//         const aesKey = await window.crypto.subtle.deriveKey(
//             { name: "PBKDF2", salt: encoder.encode("game-salt"), iterations: 100000, hash: "SHA-256" },
//             passwordKey, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]
//         );

//         const decrypted = await window.crypto.subtle.decrypt(
//             { name: "AES-GCM", iv: new Uint8Array(iv) },
//             aesKey, new Uint8Array(content)
//         );
//         return new TextDecoder().decode(decrypted);
//     } catch (e) {
//         return null; // Decryption failed (wrong password)
//     }
// }

// async function registerUser(email, password) {
//     const hash = await hashString(password);
//     localStorage.setItem("registeredEmail", email);
//     localStorage.setItem("registeredHash", hash);
    
//     // Create some initial encrypted game data
//     const initialStats = JSON.stringify({ truePositive: 0, clickRate: 0 });
//     const encrypted = await encryptGameData(initialStats, password);
    
//     // Save to cookie (expires in 7 days)
//     const d = new Date();
//     d.setTime(d.getTime() + (7*24*60*60*1000));
//     document.cookie = `userData=${encrypted}; expires=${d.toUTCString()}; path=/; SameSite=Strict`;
    
//     console.log("User registered and initial data encrypted in cookie.");
// }

// async function handleLogin() {
//     const emailInp = document.getElementById("username").value;
//     const passInp = document.getElementById("password").value;
    
//     const hashedPassInput = await hashString(passInp);
    
//     // Retrieve stored credentials (assumes you saved them during signup)
//     const storedEmail = localStorage.getItem("registeredEmail");
//     const storedHash = localStorage.getItem("registeredHash");

//     // Check if user exists/is correct
//     if (emailInp === storedEmail && hashedPassInput === storedHash) {
        
//         // 1. Mark as logged in
//         localStorage.setItem("loggedInUser", emailInp);
        
//         // 2. Try to fetch and decrypt user game data from cookies
//         const encryptedCookie = getCookie("userData");
//         if (encryptedCookie) {
//             const gameData = await decryptGameData(encryptedCookie, passInp);
//             if (gameData) {
//                 console.log("Game Data Loaded:", JSON.parse(gameData));
//                 alert("Welcome back! Your stats are loaded.");
//             }
//         }
        
//         closeLoginPopup();
//     } else {
//         // FAIL: Send alert via EmailJS
//         sendAlertEmail(emailInp);
//         alert("Verification failed. An alert has been sent.");
//     }
// }

// function sendAlertEmail(attemptedEmail) {
//     emailjs.send("service_x0cy8mh", "template_d3iti0r", {
//         user_email: attemptedEmail,
//         time: new Date().toLocaleString()
//     });
// }

// // Helper to get cookies
// function getCookie(name) {
//     let value = `; ${document.cookie}`;
//     let parts = value.split(`; ${name}=`);
//     if (parts.length === 2) return parts.pop().split(';').shift();
// }


