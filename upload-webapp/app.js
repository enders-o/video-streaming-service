const express = require("express")
const multer = require('multer')
const mariadb = require('mariadb');
require('dotenv').config({});
const app = express()
console.log(process.env);

const storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, 'temp/');
  },
  filename: function (req, file, callback) {
    callback(null, file.originalname); 
  }
})


const pool = mariadb.createPool({
    host: 'database', 
    user: 'root', 
    password: 'password',
    database: 'video_db',
    connectionLimit: 5
});

async function saveVideoDetails(videoName, filePath) {
    const query = 'INSERT INTO videos (video_name, video_path) VALUES (?, ?)';

    console.log(videoName)
    console.log(filePath)

    let conn;
    try {
        conn = await pool.getConnection(); 
        const results = await conn.query(query, [videoName, filePath]);
        console.log('Video details saved successfully:', results);
        return results;
    } catch (err) {
        console.error('Error saving video details:', err);
        throw err;
    } finally {
        if (conn) conn.release();
    }
}



const upload = multer({ storage: storage });
var loggedIn = false;

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
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const response = await fetch("http://auth-svc:8000/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (response.ok) {
      loggedIn = true;
      return res.redirect("/");
    } else {
      return res.send("Invalid credentials. Please try again.");
    }
  } catch (error) {
    console.error(error);
    return res.status(500).send("Error communicating with auth service");
  }
});

app.get('/', (req, res) => {
  if (loggedIn == false) {
    return res.redirect("/login");
  } else {
    res.send(`
      <h2>File Upload With <code>"Node.js"</code></h2>
      <form action="/api/upload" enctype="multipart/form-data" method="post">
        <div>Select a file: 
          <input name="file" type="file" />
        </div>
        <input type="submit" value="Upload" />
      </form>
      <br>
      <form action="/logout" method="post">
        <input type="submit" value="Logout" />
      </form>
    `);
  }
});

app.post('/api/upload', upload.single('file'), async (req, res) => {  
  try {
      const videoName = req.file.originalname

      console.log(req.file.originalname);
      await fetch("http://file-svc:4000/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileName: req.file.originalname, filePath: 'temp/'+req.file.originalname }),
      });
      const videoPath = `s3://${process.env.S3_BUCKET}/${videoName}`;
      await saveVideoDetails(videoName, videoPath);

      res.send('Successfully uploaded');



    } catch(err) {
        res.sendStatus(400);
    }
});

app.post('/logout', (req, res) => {
  loggedIn = false;
  res.redirect('/login');
});

app.listen(3000, () => console.log('server ready'))
