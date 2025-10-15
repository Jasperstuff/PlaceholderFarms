// ======================================================
// IDLE FARMSTEAD — MAIN SCRIPT
// v0.1
// ======================================================

// ==== 1. CROP DEFINITIONS ====
let crops = {};        // Object: { wheat: {...}, corn: {...}, etc. }
let cropOrder = [];     // Array: ["wheat", "corn", "potato", "cucumber"]

async function loadCrops() {
  try {
    const response = await fetch("json/crops.json");
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
    console.log("Current crop key:", currentCrop);

  } catch (error) {
    console.error("❌ Error loading crops:", error);
  }
}

let currentCrop = "wheat";
let permanentLog = [];

// ======================================================
// 2. DOM and DEBUG
// ======================================================
// ==== ELEMENT REFERENCES ====
const cropCount = document.getElementById("crop-count");
if (!cropCount) console.warn("Element #crop-count not found");
const harvesterCount = document.getElementById("harvester-count");
const buyAutoBtn = document.getElementById("buy-auto");
const nextUpgradeBtn = document.getElementById("next-upgrade-btn");
const currentCropLabel = document.getElementById("current-crop");
const resetBtn = document.getElementById("reset-btn");
const log = document.getElementById("log");
const viewLogBtn = document.getElementById("view-log-btn");
const logModal = document.getElementById("log-modal");
const closeLogModal = document.getElementById("close-log-modal");
const fullLogDiv = document.getElementById("full-log");
const manualSaveBtn = document.getElementById("manual-save-btn");
const saveNotice = document.getElementById("saveNotice");
const cropClicker = document.getElementById("crop-clicker");
const cropEmoji = document.getElementById("crop-emoji");

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
  updateCropSelectorBar();
  updateCropClicker();
});
//Debug Debug Debug Debug Debug Debug Debug Debug Debug Debug Debug Debug Debug

// ======================================================
// 3. CORE GAME FUNCTIONS
// ======================================================

// Save the current game state
function saveGame() {
  try {
    const saveData = { crops, currentCrop, permanentLog };
    localStorage.setItem("idleFarmsteadSave", JSON.stringify(saveData));
  } catch (e) {
    console.error("Failed to save game:", e);
  }
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
  if (!crop) return; //safety check
  cropCount.textContent = `${crop.name}: ${Math.floor(crop.amount)}`;
  harvesterCount.textContent = `Harvesters: ${crop.autoHarvesters}`;
  buyAutoBtn.textContent = `Buy Auto-Harvester (${crop.harvesterCost} ${crop.name})`;
  buyAutoBtn.disabled = crop.amount < crop.harvesterCost;
  currentCropLabel.textContent = `Current Crop: ${crop.name} ${crop.emoji}`;
  updateNextUpgradeButton();
}

// Basic log entry system
function logMessage(msg) {
  const now = new Date();
  
  //convert time to 12-hr AM/PM format
  let hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  if (hours === 0) hours = 12;
  
  // timestamp
  const timestamp = `${hours}:${minutes} ${ampm}`;
  
  // add to permanent log
  permanentLog.push(`[${timestamp}] ${msg}`); 
  
  const entry = document.createElement("div");
  entry.classList.add("log-entry");
  entry.style.opacity = 1;
  entry.textContent = `[${timestamp}] ${msg}`;
  log.prepend(entry);
  if (log.children.length > 20) log.removeChild(log.lastChild);
}


// ======================================================
// 4. HARVESTING & AUTOMATION
// ======================================================
buyAutoBtn.addEventListener("click", () => {
  const crop = crops[currentCrop];
  if (!crop) return;
  if (crop.amount >= crop.harvesterCost) {
    crop.amount -= crop.harvesterCost;
    crop.autoHarvesters++;
    crop.harvesterCost = Math.round(crop.harvesterCost * 1.5);
    logMessage(`🧑‍🌾 Hired a new ${crop.name} harvester! (${crop.autoHarvesters} total)`);
    updateUI();
    updateCropSelectorBar();
  }
});

// ======================================================
// 5. CROP ROTATION
// ======================================================

function refreshAllUI(){
  updateCropDisplay();
  updateCropClicker();
  updateCropSelectorBar();
  updateUI();
}

function updateCropDisplay() {
  const crop = crops[currentCrop];
  if (crop) {
    currentCropLabel.textContent = `Your current crop is: ${crop.emoji} ${crop.name}`;
  } else {
    currentCropLabel.textContent = `Your current crop is: ❓ Unknown`;
    console.warn("Invalid crop key:", currentCrop);
  }
}

// Update the crop clicker emoji
function updateCropClicker() {
  const crop = crops[currentCrop];
  if (!crop) return;
  cropEmoji.textContent = crop.emoji;
}


function updateCropSelectorBar() {
  const bar = document.getElementById("crop-selector-bar");
  bar.innerHTML = "";
  
  cropOrder.forEach(key => {
    const crop = crops[key];
    if (!crop) return;
    
    const emojiDiv = document.createElement("div");
    emojiDiv.textContent = crop.emoji;
    emojiDiv.classList.add("crop-selector-emoji");
    
    if (!crop.unlocked) {
      emojiDiv.classList.add("locked");
      emojiDiv.title = "Locked. Unlock previous crop first!";
    } else {
      emojiDiv.addEventListener("click", () => {
        currentCrop = key;
        refreshAllUI();
        if (crops[currentCrop]?.theme) applyTheme(crops[currentCrop].theme);
      });
    }
    
    bar.appendChild(emojiDiv);
  });
}

// clicky clicky
cropClicker.addEventListener("click", () => {
  const crop = crops[currentCrop];
  if (!crop) return;
  crop.amount++;
  checkUnlocks();
  refreshAllUI();
});

// ======================================================
// 6. UPGRADES & UNLOCKS
// ======================================================
function getNextUnlockableCrop() {
  return Object.values(crops).find(crop => !crop.unlocked && crop.unlockThreshold);
}

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


// unlock upgrade button handler
nextUpgradeBtn.addEventListener("click", () => {
  const nextCrop = getNextUnlockableCrop();
  if (!nextCrop) return;
  const prevCrop = crops[nextCrop.unlockThreshold?.prevCrop];
  if (prevCrop.amount >= nextCrop.harvesterCost) {
    prevCrop.amount -= nextCrop.harvesterCost;
    nextCrop.unlocked = true;
    nextCrop.availableToUnlock = false;
    nextCrop.availableNotified = false;
    currentCrop = nextCrop.key;
    applyTheme(nextCrop.theme);
    logMessage(`🌱 You unlocked ${nextCrop.name}!`);
    updateCropDisplay();
    updateUI();
    updateCropSelectorBar();
    updateCropClicker();
    animateCropEmoji(cropAnimations[nextCrop.key]);
  }
});

function checkUnlocks() {
  Object.values(crops).forEach(crop => {
    if (!crop.unlocked && crop.unlockThreshold) {
      const prev = crops[crop.unlockThreshold.prevCrop];
      if (prev && prev.amount >= crop.unlockThreshold.amount) {
        if (!crop.availableNotified) {
          logMessage(`🌱 ${crop.name} is available to unlock!`);
          crop.availableNotified = true;
          updateNextUpgradeButton();
        }
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

  const borderCol = theme.buttonBorder || theme.border;

  // ===== Crop Clicker Button =====
  const cropBtn = document.getElementById("crop-clicker");
  if (cropBtn) {
    cropBtn.style.backgroundColor = theme.button;
    cropBtn.style.color = theme.text;
    cropBtn.style.borderColor = borderCol;
    cropBtn.style.boxShadow = `0 8px 0 ${borderCol}`;
  }

  // ===== Modal =====
  const modalContent = document.getElementById("log-modal-content");
  if (modalContent) {
    modalContent.style.backgroundColor = theme.panel;
    modalContent.style.color = theme.text;
    modalContent.style.borderColor = theme.border;
  }
}


function loadGame() {
  const saved = localStorage.getItem("idleFarmsteadSave");
  if (!saved) return;
  const data = JSON.parse(saved);
  
  //Make sure crops exist before applying savedata
  if (data.crops) {
    for (const key of Object.keys(data.crops)) {
      if(crops[key]) {
        Object.assign(crops[key], data.crops[key]);
      } else {
        console.warn("Unknown crop in the field: ${key}");
      }
    }
  }
  if (data.currentCrop && crops[data.currentCrop]) {
    currentCrop = data.currentCrop;
  } else {
    currentCrop = cropOrder[0];
  }
  permanentLog = data.permanentLog || [];
  
  console.log("✅ Game loaded successfully.");
  console.log("Current crop key after load:", currentCrop);
  console.log("Crops object keys:", Object.keys(crops));
}

// ===== shimmer effect =====
const title = document.querySelector("h1");
let shimmerPlaying = false;

function playShimmer() {
  // prevent spam
  if (shimmerPlaying) return;
  
  // Remove class if it exists to reset the animation
  title.classList.remove("shimmer");

  // Force reflow to restart animation
  void title.offsetWidth;

  // Add class to play animation
  title.classList.add("shimmer");
  
  setTimeout(() => {
    shimmerPlaying = false;
  }, 1500);
}

// Play shimmer on page load
window.addEventListener("load", () => {
  playShimmer();
});

// Autosave every 120 seconds and shimmer
setInterval(() => {
  saveGame();
  logMessage("💾 Game saved! (autosave)");
  playShimmer();
}, 120000);

// Hover shimmer (only once per hover) 
title.addEventListener("mouseenter", () => playShimmer());

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
  updateCropSelectorBar();
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
//       Animations
// ======================================================

// Animation map
const cropAnimations = {
  wheat: "bounce 1s ease-in-out",
  corn: "shake 0.5s linear",
  potato: "spin 2s linear",
  cucumber: "wiggle 0.7s ease-in-out"
};

let emojiAnimating = false;

// Core function to animate emoji
function animateCropEmoji(animationName) {
  if (!animationName) return;
  if (emojiAnimating) return; // prevent spamming

  emojiAnimating = true;
  cropEmoji.style.animation = animationName;

  // Remove animation after it finishes
  const duration = parseFloat(animationName.match(/\d+(\.\d+)?s/)[0]) * 1000;
  setTimeout(() => {
    cropEmoji.style.animation = "";
    emojiAnimating = false;
  }, duration);
}


// Optional: play once on hover
cropClicker.addEventListener("mouseenter", () => {
  const crop = crops[currentCrop];
  animateCropEmoji(cropAnimations[crop.key]);
});

// ======================================================
//     init
// ======================================================
async function startGame() {
  await loadCrops(); //Load crops first
  loadGame(); //Then load save data

  if (!crops[currentCrop]) currentCrop = cropOrder[0];

  if (crops[currentCrop]?.theme) {
    applyTheme(crops[currentCrop].theme);
  }

  updateCropDisplay();
  updateCropClicker();
  updateUI();
  updateCropSelectorBar();
  checkUnlocks();   // Check unlocks immediately to show the next upgrade button if available
  updateNextUpgradeButton();

  logMessage("Welcome back to Idle Farmstead!");
}


// Start the game
startGame();
