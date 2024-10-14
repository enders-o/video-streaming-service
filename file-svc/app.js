const fs = require('fs')
const express = require("express")
const app = express()
app.use(express.json());

const AWS = require("aws-sdk")
require('dotenv').config();
AWS.config.update({ region: process.env.S3_REGION })
const s3 = new AWS.S3({ apiVersion: '2006-03-01' })

var uploadParams = { Bucket: process.env.S3_BUCKET, Key: "", Body: "" };

app.post('/api/upload', (req, res) => {
    console.log(req.body.filePath)
    fs.readFile(req.body.filePath, (err, data) => {
        // Display the file content
        if (err) {
            console.error('Error reading file:', err);
            return res.status(500).send('Error reading file');
        }
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
    res.status(200).send('File uploaded and deleted successfully');
});

app.listen(4000, () => console.log('server ready'))
