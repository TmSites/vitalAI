# VitalAI — Personal Health & Calorie Tracker

VitalAI is a lightweight, zero-friction, privacy-focused web application designed to help users track their daily nutritional intake and calculate health metrics seamlessly. Built completely client-side, VitalAI removes the traditional friction of health tracking by operating entirely without accounts, cloud databases, or mandatory internet connectivity.

---

## 🚀 Features

- **Automated Health Calculator:** Instantly calculates Basal Metabolic Rate (BMR) and Body Mass Index (BMI) using the scientifically validated **Mifflin-St Jeor Equation** based on user profile settings (age, gender, height, weight).
- **Instant Food Lookup & Auto-Count:** Automatically parses entered food items against a local dictionary to tally dynamic calorie totals instantly.
- **Fallback Heuristic Estimation:** Provides automated "smart estimation" metrics for items not natively found in the local dictionary, preventing tracking interruptions.
- **Dynamic Glassmorphic Dashboard:** Real-time visual updates including reactive progress bars tracking caloric thresholds, hydration targets, and targeted goals (Lose, Gain, or Maintain weight).
- **100% Privacy via Local Storage:** Keeps user personal details, history logs, and baseline parameters strictly within the local browser runtime using the Web Storage API.

---

## 🛠️ Built With

The application is built completely using vanilla web frontend architectures to guarantee ultra-fast response times (<5 seconds per log entry) and native performance:

* **HTML5** — Document object structuring, semantic forms, and layout shells.
* **CSS3 / Bootstrap 5** — Styling framework, glassmorphic layout elements, and fully fluid responsive viewports across mobile and desktop interfaces.
* **JavaScript (ES6+)** — Client-side logic engine, state management, algorithmic math blocks, and asynchronous Document Object Model (DOM) rendering.

---

## ⚙️ Architecture & Data Flow



The application runs purely on the client-side architecture. The interaction engine flows through three sequential core tiers:

1. **The Local Dictionary:** A dictionary maps base metrics to specific inputs.
2. **The Processing Listener:** Forms listen to submit behaviors, prevent standard server reloads, parse input values, and compute calculations using:
   $$\text{Calories Consumed} = \frac{\text{Base Calories per 100g} \times \text{Weight Input (g)}}{100}$$
3. **The Reactive DOM Engine:** Updates interface tokens, shifts CSS widths corresponding to percentage progress thresholds, and switches contextual banners.

---

## 💻 Getting Started

Because VitalAI requires no backend server environments or tracking configurations, initializing the app is straightforward:

### Prerequisites
You only need a modern web browser (Google Chrome, Mozilla Firefox, Microsoft Edge, or Safari).
