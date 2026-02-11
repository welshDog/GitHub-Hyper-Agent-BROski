# ⚡ Hyper Power Infrastructure Recommendations
**Target Use Case:** High-Fidelity Video Coding & Studio Recording  
**Status:** Approved for Implementation  
**Author:** BROski (Hyper Orchestrator)

---

## 1. Executive Summary
To maintain "Hyper" status, your studio needs a power backbone that ensures **Zero Downtime**, **Zero Noise**, and **Maximum Protection**. A standard surge protector is insufficient for a setup involving 4K rendering, sensitive microphones, and active studio monitors. Dirty power introduces hum into your audio, while voltage sags can corrupt your codebase during a commit.

This document outlines the **Hyper Power Stack**—a tiered approach to electrical infrastructure designed for the modern "Video Coder."

---

## 2. The Hyper Power Stack (Recommendations)

### 🟢 Tier 1: The Reactor Core (Uninterruptible Power Supply)
*Purpose: Critical backup for PC, Monitors, and External Drives. Prevents data loss.*

#### **Recommendation: CyberPower CP1500PFCLCD (PFC Sinewave)**
*   **Why:** "Pure Sine Wave" output is **mandatory** for modern PC power supplies (Active PFC) and ensures no electrical "buzz" is introduced into connected gear.
*   **Power Output:** 1500VA / 1000W.
*   **Runtime:** ~10-15 minutes at half load (enough to save & git commit).
*   **Connectivity:** USB HID (Auto-shutdown Windows/Linux via PowerPanel).

### 🔵 Tier 2: The Audio Shield (Power Conditioning)
*Purpose: Noise filtration for Speakers, Audio Interface, and Preamps.*

#### **Recommendation: Furman M-8x2 (Merit Series)**
*   **Why:** Standard surge strips do not filter RFI/EMI (Radio Frequency/Electromagnetic Interference). The Furman cleans the "dirty" electricity coming from the wall (or UPS) before it hits your sensitive audio gear, lowering the noise floor.
*   **Rating:** 15 Amps.
*   **Filtration:** Standard Level RFI/EMI Filtration.

### 🟣 Tier 3: The Infinite Flow (Peripheral Power)
*Purpose: Constant, clean power for Cameras, Stream Decks, and Mobile Devices.*

#### **Recommendation: Anker Prime 240W GaN Desktop Charger**
*   **Why:** Replaces multiple "wall warts" with a single, high-efficiency hub.
*   **Output:** 240W Total. Port 1 can hit 140W (enough for MacBook Pro 16").
*   **Ports:** 4 USB-C.

---

## 3. Comparative Analysis Matrix

| Feature | **CyberPower CP1500PFCLCD** | **APC Smart-UPS 1500 (SMT1500C)** | **Eaton 5P 1500VA** |
| :--- | :--- | :--- | :--- |
| **Type** | Line-Interactive (Pure Sine) | Line-Interactive (Pure Sine) | Line-Interactive (Pure Sine) |
| **Output (Watts)** | 1000W | 1000W | 1100W |
| **Topology** | Digital Hybrid | Traditional Transformer | High-Efficiency Transformer |
| **Efficiency** | High (GreenPower™) | Medium | High |
| **Noise Level** | Silent (Fan off usually) | Moderate (Fan cycles) | Silent (Fan off low load) |
| **LCD Display** | Color / Detailed | LCD Standard | Graphical LCD |
| **Cost** | 💲💲 ($220) | 💲💲💲 ($500+) | 💲💲💲 ($600+) |
| **Hyper Verdict** | ✅ **Best Value / Performance** | ⚠️ Overkill / Noisy | ⚠️ Enterprise Grade (Good but pricey) |

---

## 4. Technical Specifications & Safety

### **CyberPower CP1500PFCLCD**
*   **Input Voltage:** 100Vac - 130Vac.
*   **Output Frequency:** 60Hz ± 1%.
*   **Safety Certifications:** UL1778, cUL 107.3, FCC DoC Class B.
*   **Energy Star:** Yes.
*   **Compatibility:** Compatible with Active PFC Power Supplies (Critical for High-End GPUs).

### **Furman M-8x2**
*   **Maximum Output Current:** 15 Amps.
*   **Line Cord:** 6 ft, captive, 14 AWG, with 3-conductor Edison plug.
*   **Spike Protection Mode:** Line to Neutral.
*   **Safety Agency Listing:** cTUVus.

---

## 5. Implementation Plan

### **Phase A: Acquisition & Inspection**
1.  Verify total wattage of current PC setup (CPU + GPU TDP + 20%).
2.  Purchase **CyberPower CP1500PFCLCD** and **Furman M-8x2**.
3.  Buy 3-5x high-quality **14AWG IEC C13 Cables** (short lengths) to replace thin stock cables.

### **Phase B: Deployment Sequence**
1.  **Wall Outlet** ➔ **CyberPower UPS**.
2.  **CyberPower UPS (Battery Side)** ➔ **PC Tower** & **Main Monitor**.
3.  **CyberPower UPS (Surge Side)** ➔ **Furman M-8x2**.
    *   *Note:* Plugging the Furman into the UPS "Surge Only" side is safe. If you have ground loop issues, plug Furman directly into a separate Wall Outlet.
4.  **Furman M-8x2** ➔ **Audio Monitors**, **Interface**, **Key Lights**.
    *   *Rule:* Audio gear always shares the same ground point to prevent hum.

### **Phase C: Configuration**
1.  Install **PowerPanel Personal** software on the PC.
2.  Connect UPS via USB.
3.  Set "Shutdown PC" trigger to **5 minutes** of battery remaining.
4.  Disable "Audible Alarm" (So it doesn't beep and ruin a recording during a momentary sag).

### **Phase D: The "Hyper" Test**
1.  Start a heavy render (GPU Load 100%).
2.  Unplug the UPS from the wall.
3.  **Pass Criteria:** PC stays on, no flickering, no "buzz" from speakers.

---

## 6. Prerequisites & Dependencies
*   **Grounded Outlet:** You MUST have a properly grounded 3-prong wall outlet. Use a receptacle tester ($10) to verify.
*   **Space:** The UPS is heavy (25lbs) and needs airflow. Do not put it on carpet if possible (static/dust).
*   **USB Port:** One free USB-A port on the PC for data connection.
