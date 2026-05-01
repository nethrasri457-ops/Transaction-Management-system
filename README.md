# NexPay — Financial Transaction Management System

A full-stack web application for managing financial transactions, built with **Node.js + Express + MySQL**.

---

## 🗂 Project Structure

```
transaction-app/
├── schema.sql                  ← MySQL database schema + seed data
├── backend/
│   ├── server.js               ← Express API server
│   ├── db.js                   ← MySQL connection pool
│   ├── .env                    ← Environment variables
│   └── package.json
└── frontend/
    └── public/
        └── index.html          ← Single-page frontend
```

---

## 🚀 Setup Instructions

### 1. MySQL Database

```bash
# Log into MySQL
mysql -u root -p

# Run the schema (creates DB, tables, and seed data)
source /path/to/transaction-app/schema.sql
```

---

### 2. Backend Setup

```bash
cd transaction-app/backend

# Install dependencies
npm install

# Configure environment
# Edit .env and update DB credentials:
#   DB_HOST=localhost
#   DB_USER=root
#   DB_PASSWORD=your_password
#   DB_NAME=transaction_db
#   PORT=3000

# Start the server
npm start

# OR for development with auto-reload:
npm run dev
```

✅ Server will start at: `http://localhost:3000`

---

### 3. Frontend

The frontend is served **statically by Express** from `frontend/public/`.

Simply open your browser at:
```
http://localhost:3000
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/:userId` | Dashboard stats, charts, recent transactions |
| GET | `/api/transactions` | List transactions (with filters + pagination) |
| GET | `/api/transactions/:id` | Get single transaction |
| POST | `/api/transactions` | Create new transaction |
| PATCH | `/api/transactions/:id/status` | Update transaction status |
| DELETE | `/api/transactions/:id` | Delete transaction |
| GET | `/api/categories` | Get all categories |
| GET | `/api/users` | Get all users |

### Query Params for GET /api/transactions
| Param | Type | Description |
|-------|------|-------------|
| `userId` | number | Filter by user (default: 1) |
| `type` | string | `credit`, `debit`, `transfer` |
| `status` | string | `completed`, `pending`, `failed`, `reversed` |
| `category` | number | Category ID |
| `startDate` | date | `YYYY-MM-DD` |
| `endDate` | date | `YYYY-MM-DD` |
| `search` | string | Search description or reference number |
| `page` | number | Page number (default: 1) |
| `limit` | number | Results per page (default: 10) |

### POST /api/transactions Body
```json
{
  "user_id": 1,
  "type": "credit",
  "amount": 5000.00,
  "description": "Freelance payment",
  "category_id": 3,
  "status": "completed",
  "recipient_account": null,
  "transaction_date": "2024-03-15T10:00"
}
```

---

## ✨ Features

- **Dashboard** — Live balance, income/expense totals, transaction count, pending alerts
- **Line Chart** — Monthly income vs expenses (last 6 months) via Chart.js
- **Doughnut Chart** — Expense breakdown by category
- **Transaction History** — Filterable, searchable, paginated table
- **Add Transactions** — Modal form with category, type, status, date
- **Delete Transactions** — With confirmation
- **Multi-user** — Switch between accounts from the dashboard
- **MySQL Transactions** — Balance updates use atomic DB transactions

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5 / CSS3 / Vanilla JS |
| Charts | Chart.js 4 |
| Backend | Node.js + Express 4 |
| Database | MySQL 8 (mysql2 driver) |
| Fonts | Syne + DM Mono (Google Fonts) |
