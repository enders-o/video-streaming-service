const express = require("express")
const app = express()
app.use(express.json());

app.post('/api/upload', (req, res) => {
    console.log(req.body.filePath)
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

app.listen(4000, () => console.log('server ready'))
