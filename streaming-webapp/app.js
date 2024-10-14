const express = require("express")
const fs = require('fs')
const app = express()
require('dotenv').config();

const AWS = require("aws-sdk")
require('dotenv').config();
AWS.config.update({ region: process.env.S3_REGION })
const s3 = new AWS.S3({ apiVersion: '2006-03-01' })


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
    try {
        const query = await connectToDB();
        let htmlContent = '<h1>Select a video to watch</h1><ul>';
        query.forEach(video => {
            htmlContent += `<li><a href="/video?name=${encodeURIComponent(video.video_name)}">${video.video_name}</a></li>`;
        });
        htmlContent += '</ul>';

        // Send the generated HTML as the response
        res.send(htmlContent);
    } catch (err) {
        console.error('Error fetching videos:', err);
        res.status(500).send('Internal Server Error'); // Send an error response
    }
})
//https://medium.com/@developerom/playing-video-from-server-using-node-js-d52e1687e378
app.get('/video', async (req, res) => {
    const videoName = req.query.name ;
    try {
        // retrieve video from s3 and download it to temp videos folder
        //res.status(200).send('get video');
        //const stat = fs.statSync(videoPath);
        // get file size from s3
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
            //file.pipe(res);
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
            //fs.createReadStream(videoPath).pipe(res);
            //var file = require('fs').createWriteStream('/path/to/file.jpg');
            //s3.getObject(params).createReadStream().pipe(file);
        }
    } catch (err) {
        console.error('Error fetching videos:', err);
        res.status(500).send('Internal Server Error'); // Send an error response
    }
});

app.listen(3100, () => console.log('server ready'))
