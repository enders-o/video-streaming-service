const express = require('express');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
const PORT = 8080;

// Serve the login form
app.get('/login', (req, res) => {
    res.send(`
        <h1>Login</h1>
        <form method="GET" action="/">
            <label for="username">Username:</label>
            <input type="text" id="username" name="user" required>
            <br>
            <label for="password">Password:</label>
            <input type="password" id="password" name="pass" required>
            <br>
            <button type="submit">Login</button>
        </form>
    `);
});

app.listen(PORT, () => {
    console.log(`Auth service running on http://localhost:${PORT}`);
});
