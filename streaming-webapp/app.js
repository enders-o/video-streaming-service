const express = require("express")
const fs = require('fs')
const app = express()
require('dotenv').config();
const cookieParser = require("cookie-parser");

const AWS = require("aws-sdk")
require('dotenv').config();
AWS.config.update({ region: process.env.S3_REGION })
const s3 = new AWS.S3({ apiVersion: '2006-03-01' })

app.use(cookieParser());

const mariadb = require('mariadb');

const pool = mariadb.createPool({
    host: 'database', 
    user: process.env.DB_USER, 
    password: process.env.DB_PASS,
    database: 'video_db',
    connectionLimit: 5
});
async function connectToDB() {
    let conn;
    try {
        conn = await pool.getConnection();
        console.log('Connection to the database was successful!');

        const result = await conn.query('SELECT * FROM videos');
        return result;

    } catch (err) {
        throw err;
    } finally {
        if (conn) conn.end();
    }
}


app.get('/paths', async (req, res) => {
    const authToken = req.cookies.auth_token;
    if (!authToken) {
      var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
      return res.redirect(`http://localhost:8000/login?redirect=${fullUrl}`);
    }

    try {
        const query = await connectToDB();
        fs.readFile('index.html', 'utf-8', (err, data) => {
            if (err) {
                console.error("Error fetching the file:", err);
                return;
            }
            let htmlContent = data;
            // Do something with htmlContent
            const listItems = query.map(video => 
                `<li><a href="/video?name=${encodeURIComponent(video.video_name)}">${video.video_name}</a></li>`
            ).join('');
            htmlContent = htmlContent.replace('<!-- Video list items will be inserted here -->', listItems);

            // Send the generated HTML as the response
            res.send(htmlContent);
        });
    } catch (err) {
        console.error('Error fetching videos:', err);
        res.status(500).send('Internal Server Error'); // Send an error response
    }
})
//https://medium.com/@developerom/playing-video-from-server-using-node-js-d52e1687e378
app.get('/video', async (req, res) => {
    const authToken = req.cookies.auth_token;
    if (!authToken) {
      var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
      return res.redirect(`http://localhost:8000/login?redirect=${fullUrl}`);
    }

    const videoName = req.query.name ;
    try {
        const response = await fetch("http://file-svc:4000/api/download", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Range": req.headers.range || "" },
            body: JSON.stringify({ name: videoName }),
        });
        if (response.ok) {
            // Forward the headers from file-svc to the client
            const headers = {};
            response.headers.forEach((value, key) => {
                headers[key] = value;
            });

            // Write the headers to the response
            res.writeHead(response.status, headers);

            // Pipe the video stream from file-svc to the client
            //response.body.pipe(res);
            for await (const chunk of response.body) {
                    res.write(chunk);
                }
            res.end(); 
        } else {
            res.status(response.status).send('Failed to fetch video from file service');
        }
    } catch (err) {
        console.error('Error fetching videos:', err);
        res.status(500).send('Internal Server Error'); // Send an error response
    }
});

// login page
app.get("/login", (req, res) => {
res.send(`
    <h2>Login Page</h2>
    <form action="/api/login" method="post">
    <div>
        <label for="username">Username:</label>
        <input name="username" type="text" required />
    </div>
    <div>
        <label for="password">Password:</label>
        <input name="password" type="password" required />
    </div>
    <input type="submit" value="Login" />
    </form>
`);
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// login request
// app.post("/api/login", async (req, res) => {
// const { username, password } = req.body;
// try {
//     const response = await fetch("http://auth-svc:8000/login", {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ username, password }),
//     });

//     if (response.ok) {
//     loggedIn = true;
//     return res.redirect("/paths");
//     } else {
//     return res.send("Invalid credentials. Please try again.");
//     }
// } catch (error) {
//     console.error(error);
//     return res.status(500).send("Error communicating with auth service");
// }
// });

app.listen(3100, () => console.log('server ready'))
