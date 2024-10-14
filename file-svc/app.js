const fs = require('fs')
const express = require("express")
const app = express()
app.use(express.json());

const AWS = require("aws-sdk")
require('dotenv').config();
console.log(process.env.S3_BUCKET)
AWS.config.update({ region: process.env.S3_REGION })
const s3 = new AWS.S3({ apiVersion: '2006-03-01' })

var uploadParams = { Bucket: process.env.S3_BUCKET, Key: "", Body: "" };

app.post('/api/upload', (req, res) => {
    console.log(req.body.filePath)
    fs.readFile(req.body.filePath, (err, data) => {
        // Display the file content
        console.log(data);
        console.log(uploadParams);
        uploadParams.Key = req.body.fileName;
        uploadParams.Body = data;
        s3.upload(uploadParams, (err,data) => {
            if(err) {
                console.log(err);
                return res.status(500).send('Error uploading file');
            }
            console.log('success')
            fs.unlink(req.body.filePath, (err) => {
                if (err) throw err;
                console.log(req.body.filePath + ' was deleted');
            });
        });
    });
});

app.listen(4000, () => console.log('server ready'))
