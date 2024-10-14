const express = require("express")
const AWS = require("aws-sdk")
const multer = require('multer')
const fs = require('fs')
const app = express()
require('dotenv').config();
AWS.config.update({ region: process.env.S3_REGION })
const s3 = new AWS.S3({ apiVersion: '2006-03-01' })
const storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, 'temp/');
  },
  filename: function (req, file, callback) {
    callback(null, file.originalname); 
  }
})
const upload = multer({ storage: storage });
//const fetch = require("node-fetch"); 

var uploadParams = { Bucket: process.env.S3_BUCKET, Key: "", Body: "" };

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
app.use(express.urlencoded({ extended: true })); // To parse URL-encoded data

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
  res.send(`
    <h2>File Upload With <code>"Node.js"</code></h2>
    <form action="/api/upload" enctype="multipart/form-data" method="post">
      <div>Select a file: 
        <input name="file" type="file" />
      </div>
      <input type="submit" value="Upload" />
    </form>
  `);
});

app.post('/api/upload', upload.single('file'), (req, res) => {
    try {
        res.send('Succesfully uploaded');
        console.log(req.file.originalname);
        //res.send(req.file);
    }catch(err) {
        res.send(400);
    }
    /*
    uploadParams.Key = req.file.originalname;
    uploadParams.Body = req.file.buffer;
    s3.upload(uploadParams, (err,data) => {
        if(err) {
            console.log(err);
            return res.status(500).send('Error uploading file');
        }
        res.send('Succesfully uploaded')
    });
    */
});

app.listen(3000, () => console.log('server ready'))
