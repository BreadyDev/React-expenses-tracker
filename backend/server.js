const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: '',
  database: 'expense_tracker'
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to database: ' + err.stack);
    return;
  }
  console.log('Connected to database as ID ' + db.threadId);
});

const secretKey = "your_secret_key";

// Login endpoint
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const sql = "SELECT * FROM users WHERE username = ? AND password = ?";
  db.query(sql, [username, password], (err, results) => {
    if (err) return res.json(err);
    if (results.length > 0) {
      const token = jwt.sign({ id: results[0].id }, secretKey, { expiresIn: '1h' });
      return res.json({ token });
    } else {
      return res.status(401).json({ message: "Credenciales incorrectas" });
    }
  });
});

// Register endpoint
app.post('/register', (req, res) => {
  const { username, password } = req.body;
  const sql = "INSERT INTO users (username, password) VALUES (?, ?)";
  db.query(sql, [username, password], (err, result) => {
    if (err) return res.json(err);
    return res.json({ message: 'Usuario registrado exitosamente' });
  });
});

// Middleware for token verification
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(403).json({ message: "Token no proporcionado" });

  jwt.verify(token.split(' ')[1], secretKey, (err, decoded) => {
    if (err) return res.status(500).json({ message: "Falló la autenticación del token" });
    req.userId = decoded.id;
    next();
  });
};

// Get all expenses
app.get('/expenses', verifyToken, (req, res) => {
  const sql = "SELECT * FROM expenses WHERE user_id = ?";
  db.query(sql, [req.userId], (err, data) => {
    if (err) return res.json(err);
    return res.json(data);
  });
});

// Add a new expense
app.post("/expenses", verifyToken, (req, res) => {
  const { description, amount, category } = req.body;
  const sql = "INSERT INTO expenses (description, amount, category, user_id) VALUES (?, ?, ?, ?)";
  db.query(sql, [description, amount, category, req.userId], (err, result) => {
    if (err) return res.json(err);
    return res.json(result);
  });
});

// Delete an expense
app.delete("/expenses/:id", verifyToken, (req, res) => {
  const id = req.params.id;
  const sql = "DELETE FROM expenses WHERE id=? AND user_id=?";
  db.query(sql, [id, req.userId], (err, result) => {
    if (err) return res.json(err);
    return res.json(result);
  });
});

const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});