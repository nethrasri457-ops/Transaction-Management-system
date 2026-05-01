const express = require("express");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const db = require("./db");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static("../frontend/public"));

// ─── Helper ───────────────────────────────────────────────────────────────────
const genRef = () => "TXN-" + Date.now() + "-" + uuidv4().slice(0, 6).toUpperCase();

// ─── DASHBOARD ────────────────────────────────────────────────────────────────

// GET /api/dashboard/:userId  — summary stats + monthly chart data
app.get("/api/dashboard/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    // Summary totals
    const [summary] = await db.query(
      `SELECT
        SUM(CASE WHEN type='credit' AND status='completed' THEN amount ELSE 0 END) AS total_income,
        SUM(CASE WHEN type='debit'  AND status='completed' THEN amount ELSE 0 END) AS total_expenses,
        COUNT(*) AS total_transactions,
        SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) AS pending_count
       FROM transactions WHERE user_id = ?`,
      [userId]
    );

    // User balance
    const [user] = await db.query(
      `SELECT name, account_number, balance FROM users WHERE id = ?`,
      [userId]
    );

    // Monthly income vs expenses (last 6 months)
    const [monthly] = await db.query(
      `SELECT
        DATE_FORMAT(transaction_date, '%b %Y') AS month,
        MONTH(transaction_date) AS month_num,
        YEAR(transaction_date)  AS year,
        SUM(CASE WHEN type='credit' AND status='completed' THEN amount ELSE 0 END) AS income,
        SUM(CASE WHEN type='debit'  AND status='completed' THEN amount ELSE 0 END) AS expenses
       FROM transactions
       WHERE user_id = ?
         AND transaction_date >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
       GROUP BY year, month_num, month
       ORDER BY year, month_num`,
      [userId]
    );

    // Category breakdown (expenses only)
    const [categories] = await db.query(
      `SELECT c.name, c.icon, SUM(t.amount) AS total
       FROM transactions t
       JOIN categories c ON t.category_id = c.id
       WHERE t.user_id = ? AND t.type = 'debit' AND t.status = 'completed'
       GROUP BY c.id
       ORDER BY total DESC
       LIMIT 6`,
      [userId]
    );

    // Recent 5 transactions
    const [recent] = await db.query(
      `SELECT t.*, c.name AS category_name, c.icon
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.user_id = ?
       ORDER BY t.transaction_date DESC
       LIMIT 5`,
      [userId]
    );

    res.json({
      user: user[0],
      summary: summary[0],
      monthly,
      categories,
      recent,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ─── TRANSACTIONS ─────────────────────────────────────────────────────────────

// GET /api/transactions  — list with filters & pagination
app.get("/api/transactions", async (req, res) => {
  const {
    userId = 1,
    type,
    status,
    category,
    startDate,
    endDate,
    search,
    page = 1,
    limit = 10,
  } = req.query;

  let where = "t.user_id = ?";
  const params = [userId];

  if (type)      { where += " AND t.type = ?";                    params.push(type); }
  if (status)    { where += " AND t.status = ?";                  params.push(status); }
  if (category)  { where += " AND t.category_id = ?";             params.push(category); }
  if (startDate) { where += " AND DATE(t.transaction_date) >= ?"; params.push(startDate); }
  if (endDate)   { where += " AND DATE(t.transaction_date) <= ?"; params.push(endDate); }
  if (search)    { where += " AND (t.description LIKE ? OR t.reference_number LIKE ?)";
                   params.push(`%${search}%`, `%${search}%`); }

  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM transactions t WHERE ${where}`,
      params
    );

    const [rows] = await db.query(
      `SELECT t.*, c.name AS category_name, c.icon
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE ${where}
       ORDER BY t.transaction_date DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      transactions: rows,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/transactions/:id
app.get("/api/transactions/:id", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT t.*, c.name AS category_name, c.icon
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Transaction not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/transactions  — create new transaction
app.post("/api/transactions", async (req, res) => {
  const {
    user_id = 1,
    category_id,
    type,
    amount,
    description,
    recipient_account,
    status = "completed",
    transaction_date,
  } = req.body;

  if (!type || !amount) {
    return res.status(400).json({ error: "type and amount are required" });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Insert transaction
    const reference_number = genRef();
    const [result] = await conn.query(
      `INSERT INTO transactions
         (user_id, category_id, type, amount, description, reference_number, recipient_account, status, transaction_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id,
        category_id || null,
        type,
        amount,
        description || null,
        reference_number,
        recipient_account || null,
        status,
        transaction_date || new Date(),
      ]
    );

    // Update user balance if completed
    if (status === "completed") {
      const balanceDelta = type === "credit" ? amount : -amount;
      await conn.query("UPDATE users SET balance = balance + ? WHERE id = ?", [
        balanceDelta,
        user_id,
      ]);
    }

    await conn.commit();

    const [newTxn] = await db.query(
      `SELECT t.*, c.name AS category_name, c.icon
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.id = ?`,
      [result.insertId]
    );

    res.status(201).json(newTxn[0]);
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

// PATCH /api/transactions/:id/status  — update status
app.patch("/api/transactions/:id/status", async (req, res) => {
  const { status } = req.body;
  const validStatuses = ["pending", "completed", "failed", "reversed"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }
  try {
    await db.query("UPDATE transactions SET status = ? WHERE id = ?", [
      status,
      req.params.id,
    ]);
    res.json({ message: "Status updated", status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/transactions/:id
app.delete("/api/transactions/:id", async (req, res) => {
  try {
    const [result] = await db.query("DELETE FROM transactions WHERE id = ?", [
      req.params.id,
    ]);
    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Transaction not found" });
    res.json({ message: "Transaction deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── CATEGORIES ───────────────────────────────────────────────────────────────

app.get("/api/categories", async (_req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM categories ORDER BY type, name");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── USERS ────────────────────────────────────────────────────────────────────

app.get("/api/users", async (_req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, name, email, account_number, balance, created_at FROM users"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
