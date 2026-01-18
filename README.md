# SalesLive 🛒

SalesLive is an offline-first, AI-powered retail management solution built to ensure small businesses never stop running, even when the internet does. By combining a robust local database with cloud synchronization and advanced AI insights, SalesLive transforms a simple billing tool into a strategic business partner.

## 🔗 Project Links

- **Live Deployment:** [over-clocked-sales-live.vercel.app](https://over-clocked-sales-live.vercel.app)
- **GitHub Repository:** [https://github.com/Shadow3456rh/OverClocked-SalesLive.git](https://github.com/Shadow3456rh/OverClocked-SalesLive.git)
- **Project Video Demo:** [Watch on Google Drive](https://drive.google.com)

---

## ⚙️ Setup & Installation

Follow these steps to set up the project locally on your system.

### 1. Prerequisites

Ensure you have the following installed on your system:
- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)

To verify installation, run:
```bash
node --version
npm --version
```

### 2. Clone the Repository

Open your terminal and run:
```bash
git clone https://github.com/Shadow3456rh/OverClocked-SalesLive.git
cd OverClocked-SalesLive
```

### 3. Install Dependencies

Install all required packages:
```bash
npm install
```

This will install all dependencies listed in `package.json`.

### 4. Environment Configuration

Create a `.env` file in the root directory of the project:
```bash
touch .env
```

Add your Firebase and Gemini API credentials to the `.env` file:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_GEMINI_API_KEY=your_gemini_key
```

**Note:** Replace the placeholder values with your actual credentials from Firebase Console and Google AI Studio.

### 5. Run the Development Server

Start the local development server:
```bash
npm run dev
```

The application will be available at **http://localhost:5173**

---

## ✨ Key Features (MVP)

- **Offline-First Billing:** Process sales without an active internet connection using Dexie.js (IndexedDB).
- **Auto-Sync Engine:** Automatically pushes locally saved bills to Firebase Firestore as soon as the network is restored.
- **Gemini AI Insights:** Utilizes the Gemini 2.0 Flash model to provide revenue summaries and restocking recommendations.
- **Secure Multi-Role Access:** Dedicated dashboards for Owners and Staff managed via Google Authentication.
- **UPI QR Integration:** Generates dynamic QR codes for contact-less digital payments.
- **Inventory Tracking:** Real-time stock deduction with visual low-stock alerts.

---

## 🛠️ Tech Stack

- **Frontend:** React, TypeScript, Tailwind CSS, Shadcn UI
- **Storage:** Dexie.js (Local) & Firebase Firestore (Cloud)
- **Intelligence:** Google Gemini 2.0 API (Gemini-2.0-Flash)
- **Platform:** PWA (Vercel) & Native Desktop (.exe) via Nativefier

---

## 🔮 Future Roadmap

- **AI Forecasting:** Predicting seasonal demand and automated inventory ordering.
- **Mobile App:** Dedicated Android/iOS versions via Expo/React Native.
- **Multi-Store Sync:** Centralized management for owners with multiple shop locations.
- **Hardware Support:** Native integration for thermal receipt printers and barcode scanners.

---

## 👥 The Team

- **Abhinay Nachankar** (Team Leader)  
  📞 9356987758 | ✉️ abhinaycoding@gmail.com

- **Abhishek Angadi**  
  📞 9284601345 | ✉️ abhisheksangadismailbox@gmail.com

- **Prakash Gond**  
  📞 9022514183 | ✉️ unknownmember4u@gmail.com

- **Rishika Pandharpurkar**  
  📞 8104287337 | ✉️ rishikapandharpurkar01@gmail.com

---

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/Shadow3456rh/OverClocked-SalesLive/issues).

---

**Made with ❤️ by Team SalesLive**
