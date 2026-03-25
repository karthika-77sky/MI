import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import db from './database.js';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;

// Auth routes
app.post('/api/auth/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Missing fields' });

    const hash = await bcrypt.hash(password, 10);
    db.run(`INSERT INTO users (username, password_hash) VALUES (?, ?)`, [username, hash], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE')) return res.status(400).json({ error: 'Username taken' });
            return res.status(500).json({ error: err.message });
        }
        res.json({ id: this.lastID, username });
    });
});

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(400).json({ error: 'Invalid credentials' });

        const match = await bcrypt.compare(password, row.password_hash);
        if (!match) return res.status(400).json({ error: 'Invalid credentials' });

        res.json({ id: row.id, username: row.username });
    });
});

// Assessment Routes
app.get('/api/assessments/:userId', (req, res) => {
    db.all(`SELECT * FROM assessments WHERE user_id = ?`, [req.params.userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/assessments', (req, res) => {
    const { userId, type, score } = req.body;
    
    // Upsert equivalent layout (Delete then insert for simplicity to prevent dups per user/type)
    db.run(`DELETE FROM assessments WHERE user_id = ? AND type = ?`, [userId, type], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        
        db.run(`INSERT INTO assessments (user_id, type, score, is_completed) VALUES (?, ?, ?, 1)`,
            [userId, type, score], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, success: true });
        });
    });
});

app.post('/api/answers', (req, res) => {
    const { assessmentId, questionId, selectedOption, isCorrect } = req.body;
    db.run(`INSERT INTO answers (assessment_id, question_id, selected_option, is_correct) VALUES (?, ?, ?, ?)`,
        [assessmentId, questionId, selectedOption, isCorrect ? 1 : 0], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, success: true });
    });
});

app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
});
