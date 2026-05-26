/* =========================================================
   VitalAI — app.js
   Beginner-friendly JavaScript:
   - Simple functions
   - if/else logic
   - Array methods: .push(), .filter(), .reduce()
   - LocalStorage for persistence
   ========================================================= */

/* ---------- LocalStorage keys ---------- */
const KEY_PROFILE = "vitalai_profile";
const KEY_FOODS   = "vitalai_foods_today";
const KEY_HISTORY = "vitalai_history";

/* ---------- App state (kept simple) ---------- */
let profile = null;            // user info + smart plan
let foods   = [];              // today's foods: {id, name, calories, estimated}
let history = [];              // finished days
let activeTab = "dashboard";

/* ---------- Mini "AI" food database ---------- */
const FOOD_DB = {
  "apple": 95, "banana": 105, "orange": 62, "grape": 3, "strawberry": 4,
  "bread": 80, "toast": 80, "rice": 200, "pasta": 220, "pizza": 285,
  "burger": 354, "fries": 365, "chicken": 165, "egg": 78, "milk": 103,
  "yogurt": 100, "cheese": 113, "salad": 150, "soup": 170, "sandwich": 250,
  "coffee": 5, "tea": 2, "juice": 110, "soda": 140, "water": 0,
  "chocolate": 210, "cookie": 50, "cake": 235, "ice cream": 137,
  "steak": 271, "fish": 206, "tuna": 132, "salmon": 208, "shrimp": 99,
  "potato": 161, "carrot": 25, "broccoli": 31, "tomato": 18, "cucumber": 16,
  "oatmeal": 150, "cereal": 110, "pancake": 175, "waffle": 218, "donut": 195,
};

/* =========================================================
   1. INITIALIZATION
   ========================================================= */
function init() {
  // Load saved data from LocalStorage
  const savedProfile = localStorage.getItem(KEY_PROFILE);
  const savedFoods   = localStorage.getItem(KEY_FOODS);
  const savedHistory = localStorage.getItem(KEY_HISTORY);

  if (savedProfile) profile = JSON.parse(savedProfile);
  if (savedFoods)   foods   = JSON.parse(savedFoods);
  if (savedHistory) history = JSON.parse(savedHistory);

  // Wire up event listeners
  document.getElementById("setupForm").addEventListener("submit", handleSetupSubmit);
  document.getElementById("foodForm").addEventListener("submit", handleAddFood);
  document.getElementById("endDayBtn").addEventListener("click", handleEndDay);
  document.getElementById("closeSummaryBtn").addEventListener("click", closeSummary);
  document.getElementById("resetProfileBtn").addEventListener("click", handleResetProfile);

  // Tab switching
  document.querySelectorAll(".custom-tabs .nav-link").forEach(function (btn) {
    btn.addEventListener("click", function () {
      switchTab(btn.dataset.tab);
    });
  });

  // Show correct screen
  renderApp();
}

/* =========================================================
   2. SMART PLAN CALCULATION (the "AI" part)
   ========================================================= */
function buildSmartProfile(input) {
  const { age, gender, height, weight, duration, water } = input;

  // BMR using Mifflin-St Jeor formula
  let bmr;
  if (gender === "male") {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }
  // Assume light activity factor
  const maintenance = Math.round(bmr * 1.4);

  // BMI
  const heightM = height / 100;
  const bmi = +(weight / (heightM * heightM)).toFixed(1);

  // Healthy weight range
  const healthyMin = +(18.5 * heightM * heightM).toFixed(1);
  const healthyMax = +(24.9 * heightM * heightM).toFixed(1);

  // Decide plan
  let plan, targetWeight, calorieGoal, predictionMessage;

  if (bmi >= 25) {
    plan = "lose";
    targetWeight = healthyMax;
    calorieGoal = maintenance - 500;
    const kgToLose = +(weight - targetWeight).toFixed(1);
    const kgPerWeek = (500 * 7) / 7700; // ~0.45 kg/week
    const projected = +(kgPerWeek * (duration / 7)).toFixed(1);
    predictionMessage = `Goal: lose ~${kgToLose} kg. In ${duration} days you could lose about ${projected} kg by eating ${calorieGoal} kcal/day.`;
  } else if (bmi < 18.5) {
    plan = "gain";
    targetWeight = healthyMin;
    calorieGoal = maintenance + 400;
    const kgToGain = +(targetWeight - weight).toFixed(1);
    const projected = +(((400 * 7) / 7700) * (duration / 7)).toFixed(1);
    predictionMessage = `Goal: gain ~${kgToGain} kg. In ${duration} days you could gain about ${projected} kg by eating ${calorieGoal} kcal/day.`;
  } else {
    plan = "maintain";
    targetWeight = weight;
    calorieGoal = maintenance;
    predictionMessage = `You're in a healthy range. Maintain at ${calorieGoal} kcal/day for the next ${duration} days.`;
  }

  return {
    age, gender, height, weight, duration,
    waterGoal: water,
    bmi, healthyMin, healthyMax,
    targetWeight, plan, calorieGoal,
    predictionMessage,
  };
}

/* =========================================================
   3. EVENT HANDLERS
   ========================================================= */
function handleSetupSubmit(e) {
  e.preventDefault();

  const input = {
    age:      parseInt(document.getElementById("age").value),
    gender:   document.getElementById("gender").value,
    height:   parseFloat(document.getElementById("height").value),
    weight:   parseFloat(document.getElementById("weight").value),
    duration: parseInt(document.getElementById("duration").value),
    water:    parseInt(document.getElementById("water").value),
  };

  profile = buildSmartProfile(input);
  localStorage.setItem(KEY_PROFILE, JSON.stringify(profile));
  renderApp();
}

function handleAddFood(e) {
  e.preventDefault();
  const nameInput = document.getElementById("foodName");
  const name = nameInput.value.trim();
  if (!name) return;

  const result = lookupCalories(name);

  // Push new food into the array
  foods.push({
    id: Date.now(),
    name: name,
    calories: result.calories,
    estimated: result.estimated,
  });

  localStorage.setItem(KEY_FOODS, JSON.stringify(foods));
  nameInput.value = "";

  if (result.estimated) {
    showToast(`"${name}" not found — estimated at ${result.calories} kcal`);
  }
  renderDashboard();
}

function handleDeleteFood(id) {
  // Use .filter() to remove a food
  foods = foods.filter(function (f) { return f.id !== id; });
  localStorage.setItem(KEY_FOODS, JSON.stringify(foods));
  renderDashboard();
}

function handleEndDay() {
  if (foods.length === 0) return;

  // Use .reduce() to sum calories
  const eaten = foods.reduce(function (sum, f) { return sum + f.calories; }, 0);
  const target = profile.calorieGoal;
  const diff = eaten - target;

  // Decide tone/message
  let tone, title, message;
  if (Math.abs(diff) <= 200) {
    tone = "success";
    title = "Perfect day!";
    message = "You hit your target perfectly. Great job staying consistent!";
  } else if (diff > 200) {
    tone = "warning";
    title = "Over your target";
    message = "You ate more than your target today. Try lighter meals tomorrow.";
  } else {
    tone = "info";
    title = "Under your target";
    message = "You ate significantly less than your recommended target. Make sure to get enough fuel!";
  }

  // Save to history
  history.push({
    day: history.length + 1,
    date: new Date().toLocaleDateString(),
    eaten: eaten,
    target: target,
    diff: diff,
    tone: tone,
    title: title,
  });
  localStorage.setItem(KEY_HISTORY, JSON.stringify(history));

  // Show summary
  showSummary({ tone, title, message, target, eaten, diff });

  // Reset today's foods
  foods = [];
  localStorage.setItem(KEY_FOODS, JSON.stringify(foods));
}

function handleResetProfile() {
  if (!confirm("Reset everything? This deletes your profile and history.")) return;
  localStorage.removeItem(KEY_PROFILE);
  localStorage.removeItem(KEY_FOODS);
  localStorage.removeItem(KEY_HISTORY);
  profile = null; foods = []; history = [];
  renderApp();
}

/* =========================================================
   4. CALORIE LOOKUP
   ========================================================= */
function lookupCalories(name) {
  const key = name.toLowerCase().trim();

  // Exact match
  if (FOOD_DB[key] !== undefined) {
    return { calories: FOOD_DB[key], estimated: false };
  }
  // Partial match
  const keys = Object.keys(FOOD_DB);
  for (let i = 0; i < keys.length; i++) {
    if (key.includes(keys[i]) || keys[i].includes(key)) {
      return { calories: FOOD_DB[keys[i]], estimated: false };
    }
  }
  // Estimate: random 200–400 kcal
  const estimate = Math.floor(Math.random() * 201) + 200;
  return { calories: estimate, estimated: true };
}

/* =========================================================
   5. RENDERING
   ========================================================= */
function renderApp() {
  const setupScreen     = document.getElementById("setupScreen");
  const dashboardScreen = document.getElementById("dashboardScreen");
  const resetBtn        = document.getElementById("resetProfileBtn");

  if (profile) {
    setupScreen.classList.add("d-none");
    dashboardScreen.classList.remove("d-none");
    resetBtn.classList.remove("d-none");
    renderDashboard();
    renderHistory();
  } else {
    setupScreen.classList.remove("d-none");
    dashboardScreen.classList.add("d-none");
    resetBtn.classList.add("d-none");
  }
}

function renderDashboard() {
  if (!profile) return;

  // Stats
  document.getElementById("statTargetWeight").textContent = profile.targetWeight;
  document.getElementById("statCalorieGoal").textContent  = profile.calorieGoal;
  document.getElementById("statWater").textContent        = profile.waterGoal;
  document.getElementById("predictionText").textContent   = profile.predictionMessage;

  // Eaten total
  const eaten = foods.reduce(function (s, f) { return s + f.calories; }, 0);
  document.getElementById("statEaten").textContent = eaten;

  // Progress bar (capped at 100%)
  const pct = Math.min(100, Math.round((eaten / profile.calorieGoal) * 100));
  document.getElementById("eatenProgress").style.width = pct + "%";

  // Food list
  const list = document.getElementById("foodList");
  const empty = document.getElementById("emptyFoods");
  document.getElementById("foodCount").textContent =
    foods.length + " item" + (foods.length === 1 ? "" : "s");

  list.innerHTML = "";
  if (foods.length === 0) {
    empty.classList.remove("d-none");
    list.classList.add("d-none");
  } else {
    empty.classList.add("d-none");
    list.classList.remove("d-none");
    foods.forEach(function (f) {
      const row = document.createElement("div");
      row.className = "food-row";
      row.innerHTML =
        '<div>' +
          '<strong>' + escapeHtml(f.name) + '</strong>' +
          (f.estimated ? '<span class="est-pill">est</span>' : '') +
          '<div class="text-muted-soft small">' + f.calories + ' kcal</div>' +
        '</div>' +
        '<button class="btn-delete" data-id="' + f.id + '">Remove</button>';
      row.querySelector(".btn-delete").addEventListener("click", function () {
        handleDeleteFood(f.id);
      });
      list.appendChild(row);
    });
  }

  // End-day button
  document.getElementById("endDayBtn").disabled = foods.length === 0;
}

function renderHistory() {
  document.getElementById("historyCount").textContent = history.length;

  const list  = document.getElementById("historyList");
  const empty = document.getElementById("emptyHistory");

  list.innerHTML = "";
  if (history.length === 0) {
    empty.classList.remove("d-none");
    list.classList.add("d-none");
    return;
  }
  empty.classList.add("d-none");
  list.classList.remove("d-none");

  // Newest day first
  const reversed = history.slice().reverse();
  reversed.forEach(function (h) {
    const li = document.createElement("li");
    li.className = "timeline-item tone-" + h.tone;
    li.innerHTML =
      '<span class="timeline-dot"></span>' +
      '<div class="timeline-card">' +
        '<div class="d-flex justify-content-between align-items-center mb-2">' +
          '<span class="day-label">Day ' + h.day + '</span>' +
          '<span class="text-muted-soft small">' + h.date + '</span>' +
        '</div>' +
        '<div class="d-flex justify-content-between align-items-center">' +
          '<span class="kcal-value">' + h.eaten + ' / ' + h.target + ' kcal</span>' +
          '<span class="status-pill pill-' + h.tone + '">' + h.title + '</span>' +
        '</div>' +
      '</div>';
    list.appendChild(li);
  });
}

function switchTab(tab) {
  activeTab = tab;
  document.querySelectorAll(".custom-tabs .nav-link").forEach(function (b) {
    if (b.dataset.tab === tab) b.classList.add("active");
    else b.classList.remove("active");
  });
  if (tab === "dashboard") {
    document.getElementById("tabDashboard").classList.remove("d-none");
    document.getElementById("tabHistory").classList.add("d-none");
  } else {
    document.getElementById("tabDashboard").classList.add("d-none");
    document.getElementById("tabHistory").classList.remove("d-none");
    renderHistory();
  }
}

/* =========================================================
   6. SUMMARY MODAL & TOAST
   ========================================================= */
function showSummary(data) {
  const modal = document.getElementById("summaryModal");
  const icon  = document.getElementById("summaryIcon");

  icon.className = "summary-icon icon-" + data.tone;
  icon.textContent = data.tone === "success" ? "✓" : data.tone === "warning" ? "!" : "i";

  document.getElementById("summaryTitle").textContent   = data.title;
  document.getElementById("summaryMessage").textContent = data.message;
  document.getElementById("sumTarget").textContent      = data.target;
  document.getElementById("sumEaten").textContent       = data.eaten;
  document.getElementById("sumDiff").textContent        = (data.diff > 0 ? "+" : "") + data.diff;

  modal.classList.remove("d-none");
}
function closeSummary() {
  document.getElementById("summaryModal").classList.add("d-none");
  renderDashboard();
  renderHistory();
}

function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.remove("d-none");
  setTimeout(function () { toast.classList.add("d-none"); }, 2600);
}

/* ---------- tiny helper to prevent HTML injection in food names ---------- */
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

/* ---------- Go! ---------- */
init();
