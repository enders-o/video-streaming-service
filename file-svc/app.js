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
        //console.log(data);
        //console.log(uploadParams);
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

// should get the file requested and sent it in the response
app.post('/api/download', async (req, res) => {
    console.log('in /api/download: ' + req.body.name);
    const videoName = req.body.name;
    const headParams = {
        Bucket: process.env.S3_BUCKET,
        Key: videoName
    };

    const headData = await s3.headObject(headParams).promise();
    const fileSize = headData.ContentLength;
    const range = req.headers.range;

    if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunkSize = end - start + 1;
        //const file = fs.createReadStream(videoPath, { start, end });
        const head = {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunkSize,
            'Content-Type': 'video/mp4',
        };
        const streamParams = {
            Bucket: process.env.S3_BUCKET,
            Key: videoName,
            Range: `bytes=${start}-${end}`
        };
        const stream = s3.getObject(streamParams).createReadStream();

        res.writeHead(206, head);

        stream.pipe(res)
    } else {
        const head = {
            'Content-Length': fileSize,
            'Content-Type': 'video/mp4',
        };
        const streamParams = {
            Bucket: process.env.S3_BUCKET,
            Key: videoName,
        };

        res.writeHead(200, head);
        const stream = s3.getObject(streamParams).createReadStream();
        stream.pipe(res)
    }
});

app.listen(4000, () => console.log('server ready'))
