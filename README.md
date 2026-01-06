<div align="center">

# ☢️ Wasteland Survivor ☢️

> A Post-Apocalyptic Text Adventure Roguelike inspired by Fallout

[![React](https://img.shields.io/badge/React-19.2.0-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.2-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2.0-646CFF?logo=vite)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

_War. War never changes. But your story in the wasteland is just beginning._

</div>

---

## 📖 Introduction

**Wasteland Survivor** is an immersive text-based roguelike adventure set in a radiated post-apocalyptic world. Players take on the role of a Vault Dweller or Wasteland Drifter, struggling to survive, scavenge, and thrive amidst the ruins of the old world.

Powered by **Generative AI**, every journey is unique. Encounter different mutated creatures, discover lost vaults, and navigate complex faction politics in your quest for power and survival.

### ✨ Key Features

- 📟 **Pip-Boy Interface** - Authentic retro-futuristic monochrome green UI with CRT scanline effects.
- ☢️ **S.P.E.C.I.A.L. Progression** - Advance from a lowly Scavenger to a Legend of the Wastes (7 Tiers of evolution).
- 🎒 **Scavenging System** - Loot Caps, Stimpaks, RadAway, and legendary pre-war tech like the "Fat Man" or "Power Armor".
- 🐕 **Companions** - Recruit loyal allies like Dogmeat, Deathclaws, or Super Mutants to fight by your side.
- ⚔️ **Faction Warfare** - Join the **Brotherhood of Steel**, **The Institute**, **The Railroad**, or the **Enclave**.
- 🎰 **Lucky Find** - Try your luck with the Wasteland Lottery for rare blueprints and resources.
- 🏆 **Perks & Achievements** - Unlock unique perks that drastically change your playstyle.
- 💀 **Classic Fallout Vibe** - Encounter Raiders, Ghouls, Deathclaws, and navigate radiation zones.

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 18.0.0
- **pnpm** >= 8.0.0 (Recommended) or **npm** >= 9.0.0

### Installation

#### 1️⃣ Clone the Repository

```bash
git clone https://github.com/keithhegit/fallout_roguelite.git
cd fallout_roguelite
```

#### 2️⃣ Install Dependencies

Using **pnpm** (recommended):

```bash
pnpm install
```

#### 3️⃣ Setup Environment Variables

**⚠️ IMPORTANT**: This project requires an AI API Key to generate dynamic events.

Create a `.env.local` file in the root directory:

```bash
# .env.local
# Main configuration for AI Provider (Default: GLM/ZhipuAI)
VITE_AI_KEY=your-api-key-here

# Optional: Switch providers (supported: glm, siliconflow, openai)
# VITE_AI_PROVIDER=glm
```

#### 4️⃣ Start Development Server

```bash
pnpm dev
```

#### 5️⃣ Enter the Wasteland

Open your browser and visit: `http://localhost:5173`

---

## 🎮 Gameplay Guide

### S.P.E.C.I.A.L. Stats

Your survival depends on these core attributes:

- **HP (Health)** - Your lifeline. Reaching 0 means death.
- **EXP (Experience)** - Gained from combat and exploration.
- **Attack** - Raw damage output.
- **Defense** - Damage mitigation.
- **Perception** - Affects ability to find loot and detect traps.
- **Endurance** - Resistance to radiation and physical trauma.
- **Agility** - Combat speed and evasion.
- **Luck** - Influences critical hits and random event outcomes.
- **Caps** - The currency of the wasteland.

### 🗺️ Activities

#### 1. Exploration
Click **"Explore"** to venture into the unknown. You might find:
- ✅ **Resources**: Caps, scrap metal, food, and water.
- ⚠️ **Encounters**: Raiders, Super Mutants, or Feral Ghouls.
- ☢️ **Hazards**: Radiation storms, minefields, and toxic sludge.
- 🏛️ **Locations**: Abandoned Vaults, Red Rocket Stations, and Ruined Cities.

#### 2. Breakthroughs
When your EXP gains fill your bar, you must **Break Through** to the next stage of evolution (e.g., from Scavenger to Wastelander). Failure results in a "Qi Deviation" (Radiation Sickness) which harms your stats.

#### 3. Equipment
- **Weapons**: Pipe Pistols, Laser Rifles, Chainsaws, etc.
- **Armor**: Leather Armor, Combat Armor, Power Armor pieces.
- **Implants**: Cybernetic enhancements (replace the classic "Soul Bound" artifacts).

#### 4. Factions
Join a faction to gain access to exclusive shops and missions:
- **Minutemen**: Focus on settlements and defense.
- **Brotherhood of Steel**: Tech-hoarders with heavy firepower.
- **The Institute**: Advanced science and synth creation.
- **The Enclave**: Seeking to purge the wasteland.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript 5.8
- **Build Tool**: Vite 6.2
- **Styling**: Tailwind CSS 4 (Custom Pip-Boy Theme)
- **Icons**: Lucide React
- **AI Integration**: Google GenAI / ZhipuAI / OpenAI
- **State**: React Hooks & Local Storage
- **Deployment**: Cloudflare Pages / Vercel

---

## ☁️ Deployment

### Cloudflare Pages (Recommended)

1.  Push your code to a GitHub repository.
2.  Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/).
3.  Go to **Workers & Pages** > **Create Application** > **Pages** > **Connect to Git**.
4.  Select your repository.
5.  **Build Settings**:
    - Framework: **Vite**
    - Build Command: `pnpm build`
    - Output Directory: `dist`
6.  **Environment Variables**:
    - Add `VITE_AI_KEY` and `VITE_AI_PROVIDER`.

---

## 🤝 Contributing

We welcome fellow wastelanders to contribute!

1.  Fork the project
2.  Create your feature branch (`git checkout -b feature/NewPerk`)
3.  Commit your changes (`git commit -m 'Add Mysterious Stranger perk'`)
4.  Push to the branch (`git push origin feature/NewPerk`)
5.  Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">

**🌟 Ad Victoriam, Survivor! 🌟**

</div>
