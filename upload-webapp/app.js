const express = require("express")
const multer = require('multer')
const mariadb = require('mariadb');
const cookieParser = require("cookie-parser");
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

app.use(cookieParser());

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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Login request from the form on the authentication service
// app.post("/api/login", async (req, res) => {
//   const { username, password } = req.body;
  
//   try {
//     const response = await fetch("http://localhost:8000/api/login", {
//       method: "POST",
//       headers: { "Content-Type": "application/x-www-form-urlencoded" },
//       body: `username=${username}&password=${password}`
//     });

//     if (response.ok) {
//       loggedIn = true;
//       return res.redirect("/");
//     } else {
//       return res.send("Invalid credentials. Please try again.");
//     }
//   } catch (error) {
//     console.error(error);
//     return res.status(500).send("Error communicating with auth service");
//   }
// });

app.get('/', (req, res) => {
    const authToken = req.cookies.auth_token;
    if (!authToken) {
      var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
      return res.redirect(`http://localhost:8000/login?redirect=${fullUrl}`);
    }
    res.sendFile('/usr/src/app/upload.html')
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

      res.sendFile('/usr/src/app/upload-success.html')



    } catch(err) {
        res.sendStatus(400);
    }
});

app.post('/logout', (req, res) => {
  loggedIn = false;
  res.redirect('/login');
});

app.listen(3000, () => console.log('server ready'))
