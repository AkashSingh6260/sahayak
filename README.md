# 🛠️ Sahayak — On-Demand Home Services

> **Sahayak** (Hindi: सहायक — "Helper") is a home services marketplace I built to connect customers with local tradesmen — electricians, plumbers, carpenters, painters, AC technicians. It's got real-time WebSocket notifications, an AI chatbot powered by RAG, Razorpay for payments, a one-tap SOS system, and a multi-role admin panel.

This was a college project that kind of got out of hand. Fair warning — the chatbot takes like 30 seconds to boot up on first run because it's ingesting the PDF and building the FAISS index. Don't panic.

---

## 📑 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Installation & Setup](#-installation--setup)
- [Environment Variables](#-environment-variables)
- [Running the Project](#-running-the-project)
- [API Endpoints](#-api-endpoints)
- [WebSocket Events](#-websocket-events)
- [Chatbot Architecture](#-chatbot-architecture)
- [SOS Emergency System](#-sos-emergency-system)
- [Pricing Model](#-pricing-model)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### 👤 Customer Side
- JWT-based auth (register + login)
- Browse nearby service providers by trade
- Create service requests with description, photos, and location
- Real-time WebSocket push notifications for every status change
- Track requests from Pending → Accepted → In-Progress → Completed
- Pay through Razorpay — billing auto-calculated from hours worked + travel distance
- AI chatbot (Sahayak Assistant) — ask it anything about the platform, policies, etc.
- SOS emergency button — one tap, sends alert to nearest providers
- i18n support — works in multiple languages (English + a few Indian languages, more can be added)

### 🔧 Provider Side
- Apply to join as a verified partner (upload documents, background check flow)
- Dashboard showing incoming jobs, earnings, completed requests
- Accept or reject requests in real-time
- OTP to confirm job start and completion (prevents disputes)
- Wallet with transaction history
- Can flag fake SOS reports (comes up more than you'd think)

### 🛡️ Admin Side
- Dashboard analytics
- Approve/reject partner applications
- Manage users and providers
- Configure service categories and pricing (though you'll need to redeploy for price changes right now, no live edit — will fix this eventually)
- Notification controls

---

## 🧰 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite 6, TailwindCSS 4, Redux Toolkit, React Router 7 |
| **UI/UX** | Framer Motion, Lucide React, Recharts |
| **Backend** | Node.js, Express 5, Mongoose 8 |
| **Database** | MongoDB Atlas |
| **Real-Time** | Native WebSocket (`ws` library), JWT-authenticated |
| **Auth** | JWT + bcrypt |
| **Payments** | Razorpay |
| **File Uploads** | Multer |
| **Email** | Nodemailer (Gmail SMTP) |
| **AI Chatbot** | Python, FastAPI, LangChain, Groq (LLaMA 3.1), HuggingFace Embeddings |
| **RAG** | FAISS, PyPDF, Recursive text splitter |
| **Security** | Helmet, express-rate-limit, express-mongo-sanitize, CORS |

> ⚠️ Note: I originally planned to use Socket.IO but switched to raw `ws` mid-project to avoid the overhead. The reconnect logic on the client is custom and a bit rough around the edges — PRs welcome.

---

## 🏗️ Architecture

```mermaid
graph TB
    subgraph Client["🖥️ Client (React + Vite)"]
        UI[React UI]
        Redux[Redux Store]
        WS_Client[WebSocket Client]
        ChatUI[Chat Widget]
    end

    subgraph Server["⚙️ Server (Node.js + Express)"]
        API[REST API]
        WSS[WebSocket Server]
        Auth[JWT Auth Middleware]
        Controllers[Controllers]
        Models[Mongoose Models]
    end

    subgraph Chatbot["🤖 Chatbot (Python + FastAPI)"]
        FastAPI_App[FastAPI Server]
        RAG[RAG Pipeline]
        FAISS_DB[FAISS Vector Store]
        LLM[Groq LLaMA 3.1]
    end

    subgraph External["☁️ External Services"]
        MongoDB[(MongoDB Atlas)]
        Razorpay[Razorpay Gateway]
        HF[HuggingFace API]
        Groq_API[Groq API]
        Gmail[Gmail SMTP]
    end

    UI --> API
    UI --> ChatUI
    ChatUI --> FastAPI_App
    WS_Client <--> WSS
    API --> Auth --> Controllers --> Models --> MongoDB
    Controllers --> WSS
    Controllers --> Razorpay
    Controllers --> Gmail
    FastAPI_App --> RAG --> FAISS_DB
    RAG --> LLM --> Groq_API
    RAG --> HF
```

The chatbot runs as a completely separate Python microservice. The React app calls it directly on port 8000. I know, I know — ideally you'd route it through the main backend, but this was faster to ship and honestly works fine for now.

---

## 📁 Project Structure

```
sahayak/
├── client/                          # React Frontend
│   ├── public/
│   ├── routes/
│   │   └── ServiceProviderRoute.jsx
│   ├── src/
│   │   ├── app/
│   │   │   ├── store.js
│   │   │   └── features/
│   │   │       ├── authSlice.js
│   │   │       └── notificationSlice.js
│   │   ├── components/
│   │   │   ├── ChatWidget.jsx       # floating chatbot button
│   │   │   ├── SOSButton.jsx        # the pulsing red button, can't miss it
│   │   │   ├── Navbar.jsx
│   │   │   ├── Hero.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── HowItWorks.jsx
│   │   │   ├── Testimonials.jsx
│   │   │   ├── WhyChooseUs.jsx
│   │   │   ├── LanguageCarousel.jsx
│   │   │   ├── Cta.jsx
│   │   │   ├── Professions.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── SuccessModal.jsx
│   │   │   └── provider/
│   │   │       ├── ProviderNavbar.jsx
│   │   │       └── ProviderSidebar.jsx
│   │   ├── config/
│   │   │   ├── api.js               # Axios instance with interceptors
│   │   │   └── pricing.js
│   │   ├── context/
│   │   │   ├── LanguageContext.jsx
│   │   │   └── translations.js
│   │   ├── hooks/
│   │   │   └── useWebSocket.js
│   │   ├── layouts/
│   │   │   ├── ProviderLayout.jsx
│   │   │   └── UserLayout.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── MainLayout.jsx
│   │   │   ├── Partner.jsx
│   │   │   ├── PartnerApplication.jsx
│   │   │   ├── SearchProvider.jsx
│   │   │   ├── BroadcastRequest.jsx
│   │   │   ├── MyRequests.jsx
│   │   │   ├── BillingModal.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── ProviderDasboard.jsx  # typo in filename, don't rename it — imports will break
│   │   │   └── provider/
│   │   │       └── ProviderRequest.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   ├── eslint.config.js
│   └── package.json
│
├── server/                          # Node.js Backend
│   ├── configs/
│   │   ├── db.js
│   │   ├── admin.js                 # seeds the first admin on startup
│   │   ├── multer.js
│   │   └── razorpay.js
│   ├── controllers/
│   │   ├── userController.js
│   │   ├── serviceController.js
│   │   ├── PartnerController.js
│   │   ├── adminController.js
│   │   ├── orderController.js
│   │   ├── paymentController.js
│   │   ├── requestController.js
│   │   └── notificationController.js
│   ├── middlewares/
│   │   ├── protect.js
│   │   ├── isAdmin.js
│   │   └── upload.js
│   ├── modal/                       # yes it's "modal" not "model", I noticed too late
│   │   ├── User.js
│   │   ├── Partner.js
│   │   ├── PartnerApplication.js
│   │   ├── Service.js
│   │   ├── Requests.js
│   │   ├── Notification.js
│   │   └── Wallet.js
│   ├── routes/
│   │   ├── UserRoutes.js
│   │   ├── ServiceRoutes.js
│   │   ├── PartnerRoutes.js
│   │   ├── AdminRoutes.js
│   │   ├── OrderRoutes.js
│   │   ├── PaymentRoutes.js
│   │   ├── RequestRoutes.js
│   │   ├── WalletRoutes.js
│   │   └── NotificationRoutes.js
│   ├── utils/
│   │   ├── email.js
│   │   └── pricingConfig.js
│   ├── server.js
│   ├── socket.js
│   ├── test_db.js
│   ├── .env.example
│   └── package.json
│
├── chatbot/                         # Python AI Microservice
│   ├── app.py
│   ├── chat.py                      # RAG pipeline lives here
│   ├── test_chat.py
│   ├── requirements.txt
│   └── Sahayak_RAG_Policy_Guidelines.pdf
│
└── .gitignore
```

---

## ✅ Prerequisites

Make sure you have all of these before starting. I've wasted hours debugging issues that were just missing Node or an old Python version.

| Tool | Version | Link |
|------|---------|------|
| **Node.js** | v18+ | https://nodejs.org |
| **npm** | v9+ | comes with Node |
| **Python** | 3.10+ | https://python.org |
| **pip** | latest | comes with Python |
| **Git** | any recent | https://git-scm.com |
| **MongoDB** | Atlas (cloud) | https://cloud.mongodb.com |

You also need API keys for:
- **Groq** — https://console.groq.com (free tier is plenty for development)
- **HuggingFace** — https://huggingface.co/settings/tokens (free read token works)
- **Razorpay** — https://dashboard.razorpay.com (use test mode, don't accidentally use live keys)

---

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/sahayak.git
cd sahayak
```

---

### 2. Server Setup

```bash
cd server
npm install

# Copy the example env file
cp .env.example .env

# Windows CMD:
copy .env.example .env

# Windows PowerShell:
Copy-Item .env.example .env
```

Then open `server/.env` and fill in your values. See the [Environment Variables](#-environment-variables) section. This step is important — the server will start but immediately crash if `MONGODB_URI` or `JWT_SECRET` are missing.

---

### 3. Client Setup

```bash
cd client
npm install
```

The Vite config is already set up to proxy `/api` requests to `http://localhost:3000`, so you don't need to touch anything. Just make sure the server is actually running on 3000 or the proxy will silently fail.

---

### 4. Chatbot Setup (Python)

This is the part most people mess up. Take it slow.

#### Create a virtual environment

**macOS / Linux:**
```bash
cd chatbot
python3 -m venv venv
source venv/bin/activate
```

**Windows CMD:**
```cmd
cd chatbot
python -m venv venv
venv\Scripts\activate.bat
```

**Windows PowerShell:**
```powershell
cd chatbot
python -m venv venv
.\venv\Scripts\Activate.ps1
```

> If PowerShell gives you an error about execution policy, run this first:
> ```powershell
> Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
> ```
> You only need to do this once per machine.

#### Install dependencies

With the virtual environment **active** (you'll see `(venv)` in your terminal):

```bash
pip install -r requirements.txt
```

This will take a few minutes first time. It pulls in LangChain, FAISS, the HuggingFace client, FastAPI, uvicorn, and a bunch of other stuff.

> **Heads up:** If you're on Python 3.12+, some of the LangChain packages might throw deprecation warnings on startup. You can ignore them — everything still works. I haven't pinned exact versions in requirements.txt because it was causing issues on different machines, so just use whatever the latest compatible versions resolve to.

#### Create the chatbot `.env`

Create a file called `.env` inside the `chatbot/` folder:

```env
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.1-8b-instant

HF_API_KEY=your_huggingface_token_here

# Leave this as-is unless you moved the PDF somewhere else
PDF_PATH=./Sahayak_RAG_Policy_Guidelines.pdf
```

---

## 🔐 Environment Variables

### Server (`server/.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/sahayak` |
| `JWT_SECRET` | Random string for signing tokens — make it long | `some_very_long_random_string_here` |
| `RAZORPAY_KEY_ID` | Razorpay Key ID | `rzp_test_xxxxxxxxxxxx` |
| `RAZORPAY_KEY_SECRET` | Razorpay Key Secret | `your_secret_here` |
| `USER_EMAIL` | Gmail address for sending emails | `yourapp@gmail.com` |
| `USER_PASSWORD` | Gmail **App Password** — NOT your actual password | `xxxx xxxx xxxx xxxx` |
| `ADMIN_EMAIL` | Email for the seeded admin account | `admin@sahayak.com` |
| `CLIENT_URL` | Frontend URL (for CORS) | `http://localhost:5173` |
| `PORT` | Server port | `3000` |

> **Gmail App Password:** Go to your Google account → Security → 2-Step Verification → App Passwords. Generate one specifically for this app. If you use your real Gmail password here it will not work — Google blocks it.

### Chatbot (`chatbot/.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `GROQ_API_KEY` | From https://console.groq.com | `gsk_xxxxxxxxxxxx` |
| `GROQ_MODEL` | Which model to use | `llama-3.1-8b-instant` |
| `HF_API_KEY` | HuggingFace token (read access is enough) | `hf_xxxxxxxxxxxx` |
| `PDF_PATH` | Path to the knowledge base PDF | `./Sahayak_RAG_Policy_Guidelines.pdf` |

---

## ▶️ Running the Project

You'll need 3 separate terminal windows. Yes, 3. It's a microservices architecture, this is just how it is.

### Terminal 1 — Backend

```bash
cd server
npm run server
```

Should print something like:
```
Server running on port 3000
MongoDB connected
Admin account ready
```

> **`npm start` vs `npm run server`** — `npm run server` uses nodemon so it restarts on file changes. Use `npm start` in production.

### Terminal 2 — Frontend

```bash
cd client
npm run dev
```

App will be at **http://localhost:5173**

### Terminal 3 — Chatbot

```bash
cd chatbot

# Activate the venv (every time you open a new terminal)
source venv/bin/activate        # mac/linux
# OR
.\venv\Scripts\Activate.ps1     # windows powershell

python app.py
```

First boot will be slow (~20-30s) while it reads the PDF and builds the vector index. Subsequent restarts are faster. Chatbot API will be at **http://localhost:8000**.

---

## 📡 API Endpoints

### Auth (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register` | Create new user account | ❌ |
| POST | `/login` | Login, returns JWT | ❌ |

### Services (`/api/services`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | List service categories | ✅ |
| POST | `/create-request` | Create a new service request | ✅ |
| PATCH | `/accept/:id` | Provider accepts a request | ✅ |
| PATCH | `/complete/:id` | Mark service complete | ✅ |
| POST | `/sos-emergency` | Emergency request (high priority) | ✅ |

### Partners (`/api/partners`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/apply` | Submit partner application | ✅ |
| GET | `/status` | Check application status | ✅ |

### Admin (`/api/admin`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/dashboard` | Platform analytics | 🛡️ Admin only |
| GET | `/applications` | All pending applications | 🛡️ Admin only |
| PATCH | `/approve/:id` | Approve a partner | 🛡️ Admin only |
| PATCH | `/reject/:id` | Reject a partner | 🛡️ Admin only |

### Payments (`/api/payments`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/create-order` | Initialize Razorpay order | ✅ |
| POST | `/verify` | Verify payment signature | ✅ |

### Wallet (`/api/wallet`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/balance` | Current wallet balance | ✅ |
| GET | `/transactions` | Transaction history | ✅ |

### Chatbot (`localhost:8000`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Health check | ❌ |
| POST | `/chat` | Send a message | ❌ |

**Example chatbot request:**
```json
{
  "user_message": "What services does Sahayak offer?",
  "session_id": "user_abc123"
}
```

**Response:**
```json
{
  "bot_response": "Sahayak offers electricians, plumbers, carpenters, painters, and AC technicians..."
}
```

The `session_id` is how the chatbot maintains conversation history per user. If you don't send one, each message will be treated as a fresh conversation.

---

## 🔌 WebSocket Events

The WebSocket server runs alongside Express on the same port. Authentication happens via the `Sec-WebSocket-Protocol` header which carries the JWT — this is a bit of a hack but it works since most WebSocket clients don't let you set custom headers.

| Event | Direction | What It Means |
|-------|-----------|---------------|
| `new_request` | Server → Provider | A customer created a nearby request |
| `request_accepted` | Server → Customer | A provider accepted your request |
| `request_completed` | Server → Customer | Job is done |
| `sos_request_alert` | Server → Provider | 🚨 Emergency nearby — plays an audio alarm |
| `fake_sos_alert` | Server → Admin | A provider flagged a suspicious SOS |
| `fake_sos_warning` | Server → Customer | Your SOS was flagged (warning issued) |
| `payment_received` | Server → Provider | Payment confirmed, amount added to wallet |

---

## 🤖 Chatbot Architecture

RAG (Retrieval-Augmented Generation) pipeline — basically the chatbot looks up relevant info from our policy PDF before answering, so it doesn't make things up.

```mermaid
graph LR
    A[User Question] --> B[History-Aware Retriever]
    B --> C[Reformulate with Chat History]
    C --> D[FAISS Vector Search]
    D --> E[Top-K Relevant Chunks]
    E --> F[Stuff Documents Chain]
    F --> G[Groq LLaMA 3.1 LLM]
    G --> H[Answer]

    subgraph Ingestion["📄 On Startup"]
        I[PDF] --> J[PyPDF Loader]
        J --> K[Recursive Text Splitter]
        K --> L[HuggingFace Embeddings]
        L --> M[FAISS Vector Store]
    end

    D -.-> M
```

- **LLM:** Groq LLaMA 3.1 8B Instant — fast and free on the basic tier
- **Embeddings:** `sentence-transformers/all-MiniLM-L6-v2` via HuggingFace Inference API
- **Vector Store:** FAISS, runs fully in-memory (no separate database needed)
- **Memory:** Per-session `ChatMessageHistory` so it remembers the conversation

One limitation: the FAISS index is rebuilt every time the app restarts. For a small PDF this is fine (takes a few seconds), but if you ever expand the knowledge base significantly you'd want to persist the index to disk.

---

## 🚨 SOS Emergency System

One-tap emergency for when things go wrong fast.

| Emergency Type | Dispatches |
|----------------|-----------|
| Electrical short circuit / sparking | Electrician |
| Severe water leakage / flooding | Plumber |
| Door jammed — safety risk | Carpenter |
| AC making smoke or burning smell | AC Technician |

**How it works:**
1. Customer taps the SOS button (fixed position, top-left, pulsing red — hard to miss)
2. Picks the emergency type
3. Location grabbed via `navigator.geolocation` — user must grant permission
4. POST to `/api/services/sos-emergency` with `isEmergency: true`
5. All providers within 25km matching the required profession get a WebSocket alert + an audio alarm plays on their device
6. First provider to accept gets the job
7. Providers can report it as fake if something seems off — multiple fake reports escalate to admin

> Note: the 25km radius is hardcoded in `serviceController.js`. If you're testing locally without real coordinates, mock them or the alert won't reach anyone.

---

## 💰 Pricing Model

| Service | Billing Type | Rate |
|---------|-------------|------|
| Electrician | Hourly | ₹300/hr |
| Plumber | Hourly | ₹250/hr |
| Carpenter | Hourly | ₹350/hr |
| AC Technician | Fixed | ₹500 flat |
| Painter | Hourly | ₹300/hr |

**Distance surcharge:**

| Distance | Extra Charge |
|----------|-------------|
| 0 – 2 km | ₹50 |
| 2 – 5 km | ₹100 |
| 5 – 10 km | ₹150 |
| 10+ km | ₹200 |

**Final bill = Service charge + Distance charge**

The billing calculation is in `server/utils/pricingConfig.js` and also mirrored in `client/src/config/pricing.js`. If you change prices, update both files — they're not synced automatically. (TODO: move this to a DB config)

---

## 🔧 Troubleshooting

These are real issues I've run into during development and testing:

| Problem | What to do |
|---------|-----------|
| `MODULE_NOT_FOUND` on server start | You forgot to run `npm install` in the `server/` folder |
| MongoDB "connection refused" or timeout | Check your `MONGODB_URI`. Also go to Atlas → Network Access and whitelist `0.0.0.0/0` for local dev |
| CORS errors in browser | Make sure `CLIENT_URL` in `server/.env` is exactly `http://localhost:5173` — no trailing slash |
| Chatbot returns 503 on first message | It's still loading the PDF index. Wait ~30s and retry |
| `langchain_community` import error | Run `pip install langchain-community` separately — it's not always pulled in correctly |
| PowerShell can't activate venv | Run `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser` |
| WebSocket connects but gets no events | JWT might be expired. Log out and back in to get a fresh token |
| Razorpay "invalid key" error | Double-check you're using test keys (starts with `rzp_test_`), not live keys |
| Chatbot says "PDF not found" | Use an absolute path for `PDF_PATH` in your `chatbot/.env` |
| `pip install` fails with dependency conflicts | Try `pip install -r requirements.txt --no-deps` and install problematic packages manually |
| SOS alert not reaching providers | Check that test providers have coordinates set — the 25km filter will exclude anyone without location data |
| Emails not sending | Gmail App Passwords stop working if 2FA is disabled. Keep 2FA on |

---

## 🤝 Contributing

1. Fork it
2. Create your branch: `git checkout -b feature/something-cool`
3. Commit: `git commit -m "add something cool"`
4. Push: `git push origin feature/something-cool`
5. Open a PR

If you're fixing a bug, please describe what was breaking and how you fixed it — vague PRs are hard to review.

Known things that need work if you're looking for something to pick up:
- The WebSocket reconnect logic on the client is basic (no exponential backoff)
- Prices aren't editable from the admin panel yet
- The chatbot session memory is in-process (resets on server restart)
- No test coverage at all (I know, I know)

---

## 📄 License

ISC License. Do what you want, just don't hold me responsible if something breaks in production.

---

<p align="center">Built with too much coffee ☕ and occasional panic by the Sahayak Team</p>
