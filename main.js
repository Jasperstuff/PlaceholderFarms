// ======================================================
// IDLE FARMSTEAD — MAIN SCRIPT
// v0.1
// ======================================================

// ==== 1. CROP DEFINITIONS ====
let crops = {};        // Object: { wheat: {...}, corn: {...}, etc. }
let cropOrder = [];     // Array: ["wheat", "corn", "potato", "cucumber"]

async function loadCrops() {
  try {
    const response = await fetch("crops.json");
    if (!response.ok) throw new Error("Failed to load crop data!");
    const data = await response.json();

    // Convert array to object for easier lookups
    crops = {};
    cropOrder = [];

    data.forEach(crop => {
      crops[crop.key] = crop;    // Store by key (e.g., crops["wheat"])
      cropOrder.push(crop.key);  // Keep track of order for upgrades
    });

    console.log("✅ Crops loaded:", crops);
  } catch (error) {
    console.error("❌ Error loading crops:", error);
  }
}

let currentCrop = "wheat";
let permanentLog = [];

// ======================================================
// 2. DOM ELEMENTS
// ======================================================
// ==== ELEMENT REFERENCES ====
const cropCount = document.getElementById("crop-count");
const harvesterCount = document.getElementById("harvester-count");
const buyAutoBtn = document.getElementById("buy-auto");
const nextUpgradeBtn = document.getElementById("next-upgrade-btn");
const currentCropLabel = document.getElementById("current-crop");
const currentCropDisplay = document.getElementById("current-crop-display");
const resetBtn = document.getElementById("reset-btn");
const log = document.getElementById("log");
const viewLogBtn = document.getElementById("view-log-btn");
const logModal = document.getElementById("log-modal");
const closeLogModal = document.getElementById("close-log-modal");
const fullLogDiv = document.getElementById("full-log");
const manualSaveBtn = document.getElementById("manual-save-btn");
const saveNotice = document.getElementById("saveNotice");
const prevCropBtn = document.getElementById("prev-crop-btn");
const nextCropBtn = document.getElementById("next-crop-btn");
const cropClicker = document.getElementById("crop-clicker");

//Debug Debug Debug Debug Debug Debug Debug Debug Debug Debug Debug Debug Debug
const debugToggle = document.getElementById("debug-toggle");
const debugOptions = document.getElementById("debug-options");
debugToggle.addEventListener("click", () => {
  debugOptions.style.display = debugOptions.style.display === "block" ? "none" : "block";
});

const debugAdd1000Btn = document.getElementById("debug-add-1000");

debugAdd1000Btn.addEventListener("click", () => {
  const crop = crops[currentCrop];
  if (!crop) return; // safety check
  crop.amount += 1000;
  logMessage(`💰 Added 1000 ${crop.name}!`);
  updateUI();
  updateCropClicker();
});


//Debug Debug Debug Debug Debug Debug Debug Debug Debug Debug Debug Debug Debug

// ======================================================
// 3. CORE GAME FUNCTIONS
// ======================================================

// Save the current game state
function saveGame() {
  const saveData = { crops, currentCrop, permanentLog };
  localStorage.setItem("idleFarmsteadSave", JSON.stringify(saveData));
}

// Manual save with on-screen notice
manualSaveBtn.addEventListener("click", saveAndShowNotice);
function saveAndShowNotice() {
  saveGame();
  logMessage("💾 Game saved!");
  saveNotice.classList.add("show");
  setTimeout(() => saveNotice.classList.remove("show"), 1000);
}

// UI update for crop & harvester info
function updateUI() {
  const crop = crops[currentCrop];
  cropCount.textContent = `${crop.name}: ${Math.floor(crop.amount)}`;
  harvesterCount.textContent = `Harvesters: ${crop.autoHarvesters}`;
  buyAutoBtn.textContent = `Buy Auto-Harvester (${crop.harvesterCost} ${crop.name})`;
  buyAutoBtn.disabled = crop.amount < crop.harvesterCost;
  currentCropLabel.textContent = `Current Crop: ${crop.name} ${crop.emoji}`;
  updateNextUpgradeButton();
}

// Basic log entry system
function logMessage(msg) {
  permanentLog.push(msg); // add to permanent log
  const entry = document.createElement("div");
  entry.classList.add("log-entry");
  entry.style.opacity = 1;
  entry.textContent = msg;
  log.prepend(entry);
  if (log.children.length > 20) log.removeChild(log.lastChild);
}


// ======================================================
// 4. HARVESTING & AUTOMATION
// ======================================================
buyAutoBtn.addEventListener("click", () => {
  const crop = crops[currentCrop];
  if (crop.amount >= crop.harvesterCost) {
    crop.amount -= crop.harvesterCost;
    crop.autoHarvesters++;
    crop.harvesterCost = Math.round(crop.harvesterCost * 1.5);
    logMessage(`🧑‍🌾 Hired a new ${crop.name} harvester! (${crop.autoHarvesters} total)`);
    updateUI();
  }
});

// ======================================================
// 5. CROP ROTATION
// ======================================================\
function updateCropDisplay() {
  const crop = crops[currentCrop];
  currentCropDisplay.textContent = `Your current crop is: ${crop.emoji} ${crop.name}`;
}

prevCropBtn.addEventListener("click", () => {
  let index = cropOrder.indexOf(currentCrop);
  do {
    index = (index - 1 + cropOrder.length) % cropOrder.length;
  } while (!crops[cropOrder[index]].unlocked);

  currentCrop = cropOrder[index];

  // Apply theme first
  if (crops[currentCrop] && crops[currentCrop].theme) {
    applyTheme(crops[currentCrop].theme);
  }

  // Then update display and UI
  updateCropDisplay();
  updateUI();
  updateCropClicker();
});


nextCropBtn.addEventListener("click", () => {
  let index = cropOrder.indexOf(currentCrop);
  do {
    index = (index + 1) % cropOrder.length;
  } while (!crops[cropOrder[index]].unlocked);

  currentCrop = cropOrder[index];

  // Apply theme first
  if (crops[currentCrop] && crops[currentCrop].theme) {
    applyTheme(crops[currentCrop].theme);
  }

  // Then update display and UI
  updateCropDisplay();
  updateUI();
  updateCropClicker();
});


function getNextUnlockableCrop() {
  // Find the first crop that is locked but has an unlock condition
  for (const key of cropOrder) {
    const crop = crops[key];
    if (!crop.unlocked && crop.unlockThreshold) {
      const prevCrop = crops[crop.unlockThreshold.prevCrop];
      if (prevCrop && prevCrop.unlocked) {
        return crop;
      }
    }
  }
  return null;
}



// Crop Clicker function
cropClicker.addEventListener("click", () => {
  crops[currentCrop].amount++;
  checkUnlocks();
  updateUI();
  updateCropClicker(); // refresh emoji (optional)
});

// Update the crop clicker emoji
function updateCropClicker() {
  const crop = crops[currentCrop]; // fixed typo
  const clickerDiv = document.getElementById("crop-clicker"); // fixed typo
  clickerDiv.textContent = crop.emoji;
}

// ======================================================
// 6. UPGRADES & UNLOCKS
// ======================================================
function updateNextUpgradeButton() {
  const nextCrop = getNextUnlockableCrop();

  // Always make the button visible
  nextUpgradeBtn.style.opacity = 1;
  nextUpgradeBtn.style.visibility = "visible";
  nextUpgradeBtn.disabled = true;

  if (!nextCrop) {
    // No crops available to unlock yet
    nextUpgradeBtn.textContent = "No upgrades available";
    nextUpgradeBtn.style.background = "#888"; // gray fallback
    return;
  }

  // Get previous crop and requirement
  const prevCrop = crops[nextCrop.unlockThreshold?.prevCrop];
  const requiredAmount = nextCrop.unlockThreshold?.amount || 0;

  // Update text to show unlock info
  nextUpgradeBtn.textContent = `Unlock ${nextCrop.name} (${requiredAmount} ${prevCrop?.name || "?"})`;

  // Enable when player has enough
  if (prevCrop && prevCrop.amount >= requiredAmount) {
    nextUpgradeBtn.disabled = false;
    if (nextCrop.theme && nextCrop.theme.button) {
      nextUpgradeBtn.style.background = nextCrop.theme.button;
    } else {
      nextUpgradeBtn.style.background = "#4CAF50"; // fallback green
    }
  } else {
    nextUpgradeBtn.disabled = true;
    nextUpgradeBtn.style.background = "#888"; // gray disabled
  }
}



nextUpgradeBtn.addEventListener("click", () => {
  const nextCrop = getNextUnlockableCrop();
  if (!nextCrop) return;
  const prevCrop = crops[nextCrop.unlockThreshold?.prevCrop];
  if (prevCrop.amount >= nextCrop.harvesterCost) {
    prevCrop.amount -= nextCrop.harvesterCost;
    nextCrop.unlocked = true;
    nextCrop.availableToUnlock = false;
    currentCrop = nextCrop.key;
    applyTheme(nextCrop.theme);
    logMessage(`🌱 You unlocked ${nextCrop.name}!`);
    updateCropDisplay();
    updateUI();
  }
});

function checkUnlocks() {
  Object.values(crops).forEach(crop => {
    if (!crop.unlocked && crop.unlockThreshold) {
      const prev = crops[crop.unlockThreshold.prevCrop];
      if (prev && prev.amount >= crop.unlockThreshold.amount) {
        // no need to set availableToUnlock
        logMessage(`🌱 ${crop.name} is available to unlock!`);
        updateNextUpgradeButton();
      }
    }
  });
}


// ======================================================
// 7. THEME & SAVE / LOAD SYSTEM
// ======================================================
function applyTheme(theme) {
  const root = document.documentElement;
  root.style.setProperty("--bg-color", theme.bg);
  root.style.setProperty("--panel-color", theme.panel);
  root.style.setProperty("--border-color", theme.border);
  root.style.setProperty("--text-color", theme.text);
  root.style.setProperty("--button-color", theme.button);
  root.style.setProperty("--button-hover", theme.hover);
  root.style.setProperty("--accent-color", theme.accent);

  const modalContent = document.getElementById("log-modal-content");
  if (modalContent) {
    modalContent.style.backgroundColor = theme.panel;
    modalContent.style.color = theme.text;
    modalContent.style.borderColor = theme.border;
  }
}

function loadGame() {
  const saved = localStorage.getItem("idleFarmsteadSave");
  if (saved) {
    const data = JSON.parse(saved);
    Object.keys(crops).forEach(key => {
      if (data.crops[key]) crops[key] = data.crops[key];
    });
    currentCrop = data.currentCrop || "wheat";
    permanentLog = data.permanentLog || [];
  }
}

// Autosave every 90 seconds
setInterval(() => {
  saveGame();
  logMessage("💾 Game saved! (autosave)");
}, 90000);

// ======================================================
// 8. RESET & IDLE LOOP
// ======================================================
resetBtn.addEventListener("click", () => {
  const confirmReset = confirm("Are you sure you want to reset all progress? This cannot be undone.");
  if (confirmReset) {
    localStorage.removeItem("idleFarmsteadSave");
    permanentLog = [];
    location.reload();
  }
});

setInterval(() => {
  Object.values(crops).forEach(crop => {
    crop.amount += crop.autoHarvesters;
  });
  checkUnlocks();
  updateUI();
}, 1000);

// ======================================================
// 9. LOG MODAL
// ======================================================
viewLogBtn.addEventListener("click", () => {
  fullLogDiv.innerHTML = "";
  permanentLog.forEach(msg => {
    const entry = document.createElement("div");
    entry.textContent = msg;
    fullLogDiv.appendChild(entry);
  });
  logModal.classList.add("show");
  logModal.style.display = "block";
});

closeLogModal.addEventListener("click", () => {
  logModal.classList.remove("show");
  logModal.addEventListener("transitionend", function handler(e) {
    if (e.propertyName === "opacity") {
      logModal.style.display = "none";
      logModal.removeEventListener("transitionend", handler);
    }
  });
});

window.addEventListener("click", (event) => {
  if (event.target === logModal) {
    logModal.classList.remove("show");
  }
});

// ======================================================
// 10. INIT
// ======================================================
async function startGame() {
  await loadCrops();
  loadGame();

  if (!crops[currentCrop]) {
    currentCrop = cropOrder[0];
  }

  if (crops[currentCrop] && crops[currentCrop].theme) {
    applyTheme(crops[currentCrop].theme);
  }

  updateCropDisplay();
  updateCropClicker();
  updateUI();

  // Check unlocks immediately to show the next upgrade button if available
  checkUnlocks();
  updateNextUpgradeButton();

  logMessage("Welcome back to Idle Farmstead!");
}


// Start the game
startGame();
checkUnlocks();
updadeNextUpgradeButton();


