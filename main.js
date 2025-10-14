// ==== GAME STATE ====
let crops = {
  wheat: {
    name: "Wheat",
    emoji: "🌾",
    amount: 0,
    autoHarvesters: 0,
    harvesterCost: 10,
    unlocked: true,
    autoHarvestRate: 2000,
    theme: {
      bg: "linear-gradient(to bottom, #F8E5A5, #EAD38E)",
      panel: "#f7f1dc",
      border: "#bda96b",
      text: "#3a2e1f",
      button: "#c2a67c",
      hover: "#ad946d",
      accent: "#f1b24a"
    }
  },
  corn: {
    name: "Corn",
    emoji: "🌽",
    amount: 0,
    autoHarvesters: 0,
    harvesterCost: 100,
    unlocked: false,
    autoHarvestRate: 2500,
    theme: {
      bg: "linear-gradient(to bottom, #ffe680, #f2c14e)",
      panel: "#fff6cf",
      border: "#d1a73b",
      text: "#5a4419",
      button: "#e0a53e",
      hover: "#d69930",
      accent: "#fdd36a"
    }
  },
  potato: {
  name: "Potato",
  emoji: "🥔",
  amount: 0,
  autoHarvesters: 0,
  harvesterCost: 500,
  unlocked: false,
  autoHarvestRate: 3000,
  theme: {
    bg: "linear-gradient(to bottom, #f2e3d3, #d9b79c)",
    panel: "#f5e6d1",
    border: "#c79c70",
    text: "#5a3d2c",
    button: "#d8a76f",
    hover: "#c88e56",
    accent: "#f1c57c"
  }
 },
cucumber: {
  name: "Cucumber",
  emoji: "🥒",
  amount: 0,
  autoHarvesters: 0,
  harvesterCost: 300,
  unlocked: false,
  autoHarvestRate: 3500,
  theme: {
    bg: "linear-gradient(to bottom, #d3f2d3, #a3d9a5)",
    panel: "#e0f5e0",
    border: "#7fc87f",
    text: "#2e4f2e",
    button: "#6cc26c",
    hover: "#55a055",
    accent: "#88d588"
  }
}


};

let currentCrop = "wheat";

// ==== UI ELEMENTS ====
const harvestBtn = document.getElementById('harvest-btn');
const buyAutoBtn = document.getElementById('buy-auto');
const manualSaveBtn = document.getElementById('manual-save-btn');
const cropCount = document.getElementById('crop-count');
const harvesterCount = document.getElementById('harvester-count');
const currentCropLabel = document.getElementById('current-crop');
const log = document.getElementById('log');

// ==== CORE FUNCTIONS ====
manualSaveBtn.addEventListener('click', () => {
  saveAndShowNotice();
});

harvestBtn.addEventListener('click', () => {
  crops[currentCrop].amount++;
  checkUnlocks();
  updateUI();
});

buyAutoBtn.addEventListener('click', () => {
  const crop = crops[currentCrop];
  if (crop.amount >= crop.harvesterCost) {
    crop.amount -= crop.harvesterCost;
    crop.autoHarvesters++;
    crop.harvesterCost = Math.round(crop.harvesterCost * 1.5);
    logMessage(`🧑‍🌾 Hired a new ${crop.name} harvester! (${crop.autoHarvesters} total)`);
    updateUI();
  }
});



// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!===== DEBUG MENU TOGGLE =====
//////////////////////////////////////////////////// DELETE ME BEFORE LIVE
const debugToggle = document.getElementById('debug-toggle');
const debugOptions = document.getElementById('debug-options');

debugToggle.addEventListener('click', () => {
  if (debugOptions.style.display === 'block') {
    debugOptions.style.display = 'none';
  } else {
    debugOptions.style.display = 'block';
  }
});

const debugAdd1000 = document.getElementById('debug-add-1000');
if (debugAdd1000) {
  debugAdd1000.addEventListener('click', () => {
    // add 1000 to the currently selected crop
    if (typeof currentCrop === 'string' && crops[currentCrop]) {
      crops[currentCrop].amount = (crops[currentCrop].amount || 0) + 1000;
      updateUI();
      logMessage(`🔧 Debug: +1000 ${crops[currentCrop].name}`);
    } else {
      console.warn('Debug add: currentCrop or crops not available.');
    }
  });
}

////////////////////////////////////////////////////////////////////////

// ==== Crop rotation =====
const cropOrder = ["wheat", "corn", "potato", "cucumber"];
const prevCropBtn = document.getElementById('prev-crop');
const nextCropBtn = document.getElementById('next-crop');
const currentCropDisplay = document.getElementById('current-crop-display');

function updateCropDisplay() {
  const crop = crops[currentCrop];
  currentCropDisplay.textContent = `Your current crop is: ${crop.emoji} ${crop.name}`;
}

// Previous crop button
prevCropBtn.addEventListener('click', () => {
  let index = cropOrder.indexOf(currentCrop);
  do {
    index = (index - 1 + cropOrder.length) % cropOrder.length;
  } while (!crops[cropOrder[index]].unlocked);
  currentCrop = cropOrder[index];
  applyTheme(crops[currentCrop].theme);
  updateCropDisplay();
  updateUI();
});

// Next crop button
nextCropBtn.addEventListener('click', () => {
  let index = cropOrder.indexOf(currentCrop);
  do {
    index = (index + 1) % cropOrder.length;
  } while (!crops[cropOrder[index]].unlocked);
  currentCrop = cropOrder[index];
  applyTheme(crops[currentCrop].theme);
  updateCropDisplay();
  updateUI();
});

// Call once on load
updateCropDisplay();

// ==== RESET BUTTON ====
const resetBtn = document.getElementById('reset-btn');
resetBtn.addEventListener('click', () => {
  const confirmReset = confirm("Are you sure you want to reset all progress? This cannot be undone.");
  if (confirmReset) {
    localStorage.removeItem('idleFarmsteadSave');
    permanentLog = [];
    location.reload();
  }
});


// ==== IDLE LOOP ====
setInterval(() => {
  Object.keys(crops).forEach(key => {
    const crop = crops[key];
    crop.amount += crop.autoHarvesters;
  });
  checkUnlocks();
  updateUI();
}, 1000);

// ==== UNLOCK LOGIC ====
function checkUnlocks() {
  const wheat = crops.wheat;
  const corn= crops.corn;
  const potato = crops.potato;
if (!crops.corn.unlocked && crops.wheat.amount >= 100) {
  crops.corn.unlocked = true;
  logMessage(`🌽 Corn unlocked!`);
}

if (!crops.potato.unlocked && crops.corn.amount >= 200) {
  crops.potato.unlocked = true;
  logMessage(`🥔 Potatoes unlocked!`);
}

if (!crops.cucumber.unlocked && crops.potato.amount >= 300) {
  crops.cucumber.unlocked = true;
  logMessage(`🥒 Cucumbers unlocked!`);
}

}

// ==== UI UPDATE ====
function updateUI() {
  const crop = crops[currentCrop];
  cropCount.textContent = `${crop.name}: ${Math.floor(crop.amount)}`;
  harvesterCount.textContent = `Harvesters: ${crop.autoHarvesters}`;
  buyAutoBtn.textContent = `Buy Auto-Harvester (${crop.harvesterCost} ${crop.name})`;
  buyAutoBtn.disabled = crop.amount < crop.harvesterCost;
  currentCropLabel.textContent = `Current Crop: ${crop.name} ${crop.emoji}`;
}

// ==== LOG ====
const minOpacity = 0.1; // minimum opacity for oldest entry
const maxOpacity = 1;   // opacity for newest entry
const baseFadeSpeed = 0.002; // amount to reduce opacity per frame

let permanentLog = [];

function logMessage(msg) {
  const entry = document.createElement('div');
  entry.classList.add('log-entry');
  entry.style.opacity = maxOpacity; // start fully visible
  entry.textContent = msg;
  log.prepend(entry);
  if (log.children.length > 20) log.removeChild(log.lastChild);
}

// Cascading fade function
function fadeLogEntries() {
  const entries = Array.from(log.children);
  entries.forEach((entry, index) => {
    let currentOpacity = parseFloat(entry.style.opacity);
    if (isNaN(currentOpacity)) currentOpacity = maxOpacity;

    // Older entries fade faster (index = 0 is newest, highest index is oldest)
    const fadeMultiplier = 1 + (index / entries.length) * 2; // older = faster
    currentOpacity -= baseFadeSpeed * fadeMultiplier;

    if (currentOpacity <= minOpacity) {
      // Move to permanent log and remove from visible box
      permanentLog.push(entry.textContent);
      entry.remove();
    } else {
      entry.style.opacity = currentOpacity;
    }
  });

  requestAnimationFrame(fadeLogEntries);
}

// ==== LOG MODAL ====
const viewLogBtn = document.getElementById('view-log-btn');
const logModal = document.getElementById('log-modal');
const closeLogModal = document.getElementById('close-log-modal');
const fullLogDiv = document.getElementById('full-log');

// Open modal and populate with permanent log entries
viewLogBtn.addEventListener('click', () => {
  fullLogDiv.innerHTML = ""; // clear previous content
  permanentLog.forEach(msg => {
    const entry = document.createElement('div');
    entry.textContent = msg;
    fullLogDiv.appendChild(entry);
  });

  logModal.classList.add('show');
  logModal.style.display = "block";
});

// Close modal
closeLogModal.addEventListener('click', () => {
  logModal.classList.remove('show');
  logModal.addEventListener('transitionend', function handler(e) {
    if (e.propertyName === 'opacity') {
      logModal.style.display = 'none';
      logModal.removeEventListener('transitionend', handler);
    }                         
  });
});
                               
function closeModal() {
  logModal.classList.remove('show');
}
                               
// Close modal if clicking outside the content box
window.addEventListener('click', (event) => {
  if (event.target === logModal) {
    closeModal();
  }
});


// ==== THEME HANDLER ====
function applyTheme(theme) {
  const root = document.documentElement;
  root.style.setProperty('--bg-color', theme.bg);
  root.style.setProperty('--panel-color', theme.panel);
  root.style.setProperty('--border-color', theme.border);
  root.style.setProperty('--text-color', theme.text);
  root.style.setProperty('--button-color', theme.button);
  root.style.setProperty('--button-hover', theme.hover);
  root.style.setProperty('--accent-color', theme.accent);
  const modalContent = document.getElementById('log-modal-content');
  modalContent.style.backgroundColor = theme.panel;
  modalContent.style.color = theme.text;
  modalContent.style.borderColor = theme.border;
}

// ==== SAVE GAME ====
function saveGame() {
  const saveData = {
    crops: crops,
    currentCrop: currentCrop, 
    permanentLog: permanentLog
  };
  localStorage.setItem('idleFarmsteadSave', JSON.stringify(saveData));
}

//autosave every 90 secs
setInterval(() => {
 saveGame();
  logMessage("💾 Game saved! (autosave)");
}, 90000); 

function saveAndShowNotice() {
  saveGame();
  logMessage("💾 Game saved!");
  const notice = document.getElementById('saveNotice');
  notice.classList.add('show');
  setTimeout(() => notice.classList.remove('show'), 1000);
}

// ==== LOAD GAME ====
function loadGame() {
  const saved = localStorage.getItem('idleFarmsteadSave');
  if (saved) {
    const data = JSON.parse(saved);
    // Merge loaded crops with default crops
    Object.keys(crops).forEach(key => {
      if (data.crops[key] !== undefined) {
        crops[key] = data.crops[key];
      }
    });
    currentCrop = data.currentCrop;
    permanentLog = data.permanentLog || [];
  }
}

// ==== INIT ====
loadGame();
fadeLogEntries();
applyTheme(crops[currentCrop].theme);
updateUI();

