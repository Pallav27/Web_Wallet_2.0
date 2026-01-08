# Web Wallet 2.0 💳

A modern, secure, and scalable **web-based digital wallet platform** that enables users to manage balances, perform peer-to-peer transactions, send and receive money requests, and communicate in real time — all through a VPA-based identity system.

Built with a **production-oriented full-stack architecture**, this project emphasizes clean design, extensibility, and real-world system thinking.

---

## 🚀 Key Features

### 🔐 Authentication & User Management
- Secure user authentication using **Clerk**
- VPA (Virtual Payment Address)–based user identity
- Protected routes and session handling

### 💰 Wallet & Transactions
- Wallet balance management (credit & debit)
- Simulated transactions (no real payment gateway)
- Transaction history with timestamps
- Ensure atomic updates to wallet balance

### 🔁 Money Requests
- Send money requests via VPA
- Accept or reject incoming requests
- Real-time request updates using polling
- Status tracking: `pending`, `accepted`, `rejected`

### 🔔 Notifications
- Real-time notifications for money requests
- Polling-based updates for reliability
- Seamless UI refresh without page reloads

### 📊 Dashboard
- Unified wallet dashboard
- View balance, recent transactions, requests, and chats
- Clean and responsive UI

---

## 🛠 Tech Stack

### Frontend
- **Next.js (App Router)**
- **React**
- **Tailwind CSS**
- **JavaScript / TypeScript**

### Backend
- **Next.js API Routes**
- **Node.js**

### Database
- **MongoDB**
- **Mongoose**

### Authentication
- **Clerk**

