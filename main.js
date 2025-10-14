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
      bg: "linear-gradient(to bottom, #e3d8b2, #d2c498)",
      panel: "#f7f1dc",
      border: "#bda96b",
      text: "#3a2e1f",
      button: "#88c057",
      hover: "#7ab14f",
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
const switchCropBtn = document.getElementById('switch-crop');
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

switchCropBtn.addEventListener('click', () => {
  if (currentCrop === "wheat" && crops.corn.unlocked) {
    currentCrop = "corn";
    logMessage(`🌽 Switched to growing Corn!`);
  } else {
    currentCrop = "wheat";
    logMessage(`🌾 Switched back to growing Wheat!`);
  }
  applyTheme(crops[currentCrop].theme);
  updateUI();
});

// ==== RESET BUTTON ====
const resetBtn = document.getElementById('reset-btn');
resetBtn.addEventListener('click', () => {
  const confirmReset = confirm("Are you sure you want to reset all progress? This cannot be undone.");
  if (confirmReset) {
    localStorage.removeItem('idleFarmsteadSave');
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
  if (!crops.corn.unlocked && crops.wheat.amount >= 100) {
    crops.corn.unlocked = true;
    switchCropBtn.disabled = false;
    logMessage(`🌽 You unlocked Corn! Switch crops to start farming it.`);
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
  switchCropBtn.disabled = !crops.corn.unlocked;
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

// Start the fade loop
fadeLogEntries();


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
closeLogModal.addEventListener('click', closeModal);
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
    crops = data.crops;
    currentCrop = data.currentCrop;
    permanentLog = data.permanentLog || [];
  }
}


// ==== INIT ====
loadGame();
applyTheme(crops[currentCrop].theme);
updateUI();

