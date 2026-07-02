<div align="center">

# 🥗 Aahar AI
### AI-Powered Indian Clinical Wellness & Nutrition Assistant

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Firebase](https://img.shields.io/badge/Firebase-12-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com)
[![Gemini AI](https://img.shields.io/badge/Gemini-AI-4285F4?logo=google&logoColor=white)](https://ai.google.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)

**Aahar AI** is a personalized Indian nutrition and wellness web app powered by Google Gemini AI. It generates custom diet plans based on your regional food preferences, medical conditions, and health goals — and helps you track meals, water intake, and progress every day.

</div>

---

## ✨ Features

- 🧬 **Personalized Onboarding** — Collects age, weight, diet type (veg/non-veg/vegan/eggetarian), regional preference (North Indian, South Indian, Bengali, etc.), medical conditions, and health goals
- 🍽️ **AI-Generated Diet Plans** — Gemini AI creates a custom 7-day Indian meal plan with calorie & macro targets
- 📊 **Daily Dashboard** — Track today's meals, water intake, and calorie progress with rich visual charts
- 🔍 **Food Scanner (AI Lens)** — Identify any food item via camera/image and get instant nutritional breakdown
- 💬 **AI Nutrition Coach** — Chat with Gemini AI for personalized Indian diet advice, recipe swaps, and health guidance
- 📅 **Meal Plan View** — Browse and manage your full weekly meal schedule
- 📈 **Analytics** — Visual trends of your calorie, protein, carb, and fat intake over time
- 🌙 **Dark / Light Theme** — Premium glassmorphism dark mode + light green mode
- 🔐 **Firebase Auth** — Secure Google / email sign-in with Firestore cloud sync

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS v4 + custom glassmorphism design |
| Animations | Motion (Framer Motion) |
| Charts | Recharts + D3.js |
| AI | Google Gemini AI (`@google/genai`) |
| Backend | Node.js + Express (API proxy server) |
| Database | Firebase Firestore |
| Auth | Firebase Authentication |
| Icons | Lucide React |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- A [Google Gemini API Key](https://aistudio.google.com/app/apikey)
- A [Firebase Project](https://console.firebase.google.com/) (with Firestore + Auth enabled)

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/aahar-ai.git
cd aahar-ai
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Then edit `.env.local` and set your Gemini API key:

```env
GEMINI_API_KEY="your_actual_gemini_api_key_here"
```

### 4. Configure Firebase

```bash
cp firebase-applet-config.example.json firebase-applet-config.json
```

Then edit `firebase-applet-config.json` with your Firebase project credentials (found in your Firebase Console → Project Settings → Your apps).

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔒 Security Notes

> [!IMPORTANT]
> - **Never commit** your `.env.local` or `firebase-applet-config.json` files — they are already in `.gitignore`
> - Use `firebase-applet-config.example.json` as the template (safe to commit)
> - Your Gemini API key should only ever be stored in `.env.local` locally, or in a secrets manager in production

---

## 📁 Project Structure

```
aahar-ai/
├── src/
│   ├── components/          # UI components (Auth, Dashboard, Scanner, Chat, etc.)
│   ├── lib/                 # Firebase & workspace utilities
│   ├── App.tsx              # Root app shell + navigation
│   ├── types.ts             # TypeScript interfaces
│   ├── data.ts              # Static/seed data
│   └── index.css            # Global styles + design tokens
├── server.ts                # Express API server (Gemini AI proxy)
├── firebase-applet-config.example.json  # Firebase config template
├── firestore.rules          # Firestore security rules
├── .env.example             # Environment variable template
└── vite.config.ts           # Vite build configuration
```

---

## 🤝 Contributing

Contributions are welcome! Please open an issue first to discuss what you'd like to change.

1. Fork the repo
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the [MIT License](./LICENSE).
