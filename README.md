# 💬 Fieldchat Client

A sleek, responsive, real-time web application built with **React 19**, **Vite**, and **Tailwind CSS**. Features custom **SharedWorker WebSocket Multiplexing**, event-driven state caching with **TanStack React Query v5**, and native PWA background recovery.

---

## ✨ Features

- **⚡ SharedWorker WebSocket Multiplexing**: Shares a single persistent WebSocket connection across all open browser tabs, reducing backend connection overhead by up to 90%.
- **📱 PWA & Mobile UX First**: Zen single-page viewport handling, virtual keyboard shift prevention, and seamless installation as a mobile app.
- **🔄 Resilient Offline & Idle Recovery**: Automatic background dataset resynchronization (`visibilitychange` & window focus listeners) when resuming from mobile sleep or background state.
- **💬 Real-Time Direct & Group Messaging**: Message creation, editing, deletion for everyone/me, and optimistic UI reactions (`👍`, `❤️`, `🔥`, etc.).
- **✓✓ Live Delivery & Read Receipts**: Instant delivery propagation and read receipt tracking across direct messages and groups.
- **🟢 Targeted Presence & Typing Indicators**: Real-time online/offline status with `last_seen` timestamps and debounced typing indicators.
- **🔔 VAPID WebPush & In-App Toasts**: System tray notifications with grouped toast debouncing via ServiceWorker.

---

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Data Fetching & Cache**: [TanStack React Query v5](https://tanstack.com/query/v5)
- **Global State**: [Zustand](https://github.com/pmndrs/zustand)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [Radix UI](https://www.radix-ui.com/)
- **Icons & Toasts**: [Lucide React](https://lucide.dev/) + [Sonner](https://sonner.emilkowal.ski/)
- **Forms & Validation**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)

---

## 🚀 Quick Start

### 1. Prerequisites
Ensure you have **Node.js (v18+)** and **npm** installed.

### 2. Installation
```bash
# Navigate to client directory
cd fieldchat-client

# Install dependencies
npm install
```

### 3. Environment Setup
Create a `.env` file in the `fieldchat-client` directory:
```env
VITE_API_URL=http://localhost:8000
VITE_VAPID_PUBLIC_KEY=your_vapid_public_key_here
```

### 4. Development Server
```bash
# Run local dev server with HMR
npm run dev
```

### 5. Production Build
```bash
# Build optimized production bundle
npm run build

# Preview production build locally
npm run preview
```

---

## 📁 Project Structure

```text
fieldchat-client/
├── src/
│   ├── components/      # Reusable UI components (Avatar, Dialogs, Toasts)
│   ├── features/        # Feature modules
│   │   ├── auth/        # Authentication screen & login flows
│   │   ├── chat/        # Sidebar, ChatPane, Composer & MessageList
│   │   ├── groups/      # Group management & member modals
│   │   └── landing/     # Zen landing page
│   ├── hooks/           # Custom hooks (useRealtimeSync, useAnimatePresence)
│   ├── services/
│   │   ├── api/         # Axios/Fetch API client modules
│   │   └── ws/          # SharedWorker Client (client.js & wsWorker.js)
│   ├── store/           # Zustand global state (useAppStore)
│   ├── App.jsx          # Application root & query client configuration
│   └── main.jsx         # DOM entry point
├── public/              # Static assets & ServiceWorker scripts
├── vite.config.js       # Vite configuration
└── package.json
```
