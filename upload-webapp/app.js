const express = require("express")
const AWS = require("aws-sdk")
const multer = require('multer')
const fs = require('fs')
const app = express()
require('dotenv').config();
AWS.config.update({ region: process.env.S3_REGION })
const s3 = new AWS.S3({ apiVersion: '2006-03-01' })
const upload = multer({
  storage: multer.memoryStorage(),
});

var uploadParams = { Bucket: process.env.S3_BUCKET, Key: "", Body: "" };

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
    uploadParams.Key = req.file.originalname;
    uploadParams.Body = req.file.buffer;
    s3.upload(uploadParams, (err,data) => {
        if(err) {
            console.log(err);
            return res.status(500).send('Error uploading file');
        }
        res.send('Succesfully uploaded')
    });
});

app.listen(3000, () => console.log('server ready'))
