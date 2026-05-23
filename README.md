# Tours and Tour 🌍✈️

A professional, modern, and fully responsive tourism website built with **Node.js, Express, EJS, CSS, and Vanilla JavaScript**. It uses **Excel sheets (.xlsx)** as a lightweight database, meaning no MongoDB or SQL installation is required!

---

## 🌟 Key Features

1. **User Authentication & Dashboard**:
   - Register, login, and logout.
   - Profile management and history of bookings and reviews.
   - Secure password hashing with `bcryptjs`.
2. **Interactive UI/UX**:
   - Custom-built interactive hero slider, smooth animations, and scroll reveal.
   - Dedicated destinations & packages pages with search, filtering, and wishlist features (persisted in LocalStorage).
   - Star-rating review system, dynamic contact page with Google Maps embed, and FAQ accordion.
   - Integrated **Travel Bot (Chatbot)** with a comprehensive local knowledge base and quick-reply buttons.
   - **Light & Dark mode** toggle with automatic preference preservation.
3. **Excel-based Database Engine**:
   - Instead of SQL/MongoDB, all user registrations, packages booking, reviews, contact inquiries, and newsletter signups are written dynamically in Excel files.
   - Stored structured tables inside `excel-data/` folder.
4. **Interactive Admin Panel**:
   - Dedicated dashboard at `/admin/login`.
   - Admin stats cards showing total users, bookings, revenue, and reviews.
   - View, search, and delete records (Users, Bookings, Reviews, Contacts, Newsletters).
   - **One-click direct Excel download** for all 5 databases directly from the dashboard!

---

## 📂 Project Structure

```text
├── excel-data/             # Auto-generated Excel sheets (users, bookings, etc.)
├── middleware/
│   └── auth.js             # Authentication checks (user/admin login validations)
├── public/
│   ├── css/
│   │   └── style.css       # Custom stylesheets (Light/Dark design system)
│   └── js/
│       ├── main.js         # Interactive main script, animations, wishlist
│       └── chat.js         # Chatbot bot widget client logic
├── routes/
│   └── index.js            # Express routes (pages, auth logic, actions, data)
├── utils/
│   └── excelService.js     # Excel database interface wrapper
├── views/
│   ├── partials/
│   │   ├── header.ejs      # Scripts/meta tags (shared headers)
│   │   ├── navbar.ejs      # Dynamic navigation (auth, theme switcher)
│   │   └── footer.ejs      # Custom footer, chatbot, scripts loading
│   ├── 404.ejs             # Not Found Page
│   ├── about.ejs           # Company story, team, FAQs
│   ├── admin-dashboard.ejs # Responsive Admin Panel
│   ├── admin-login.ejs     # Admin login screen
│   ├── booking.ejs         # Multi-step checkout form
│   ├── contact.ejs         # Contact forms & map details
│   ├── dashboard.ejs       # User account details
│   ├── destinations.ejs    # Destination explorer
│   ├── home.ejs            # Main landing page
│   ├── login.ejs           # Sign-in portal
│   ├── packages.ejs        # Available packages catalog
│   ├── register.ejs        # Account registration
│   └── reviews.ejs         # Guest feedback board
├── .env                    # Secrets and environment configs
├── server.js               # Application bootstrap file
└── package.json            # Node dependency configuration
```

---

## 🛠️ Installation & Setup

Follow these steps to run the application on your computer:

### 1. Prerequisite
Ensure you have [Node.js](https://nodejs.org/) installed.

### 2. Install Dependencies
Open your terminal in the project directory and run:
```bash
npm install
```

### 3. Start the Server
To run the server in development mode (with auto-reload):
```bash
npm run dev
```
To run in production mode:
```bash
npm start
```

Once started, the system will output:
```text
📦 Excel files verified/created successfully in excel-data/
🚀 Tours and Tour is running at http://localhost:3000
```

---

## 🔐 Credentials

### Admin Login
- **URL**: `http://localhost:3000/admin/login`
- **Email**: `admin@toursandtour.com`
- **Password**: `Admin@123`

---

## 📋 Technology Stack
- **Backend**: Node.js & Express.js
- **Templating**: EJS (Embedded JavaScript)
- **Styling**: Modern Custom CSS (Variables, HSL Palettes, Flexbox/Grid, Keyframe Animations)
- **Data Engine**: `exceljs` library for `.xlsx` read/write operations
- **Security**: `bcryptjs` (password hashing) & `express-session` (sessions)
