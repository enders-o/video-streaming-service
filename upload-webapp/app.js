const express = require("express")
const multer = require('multer')
const app = express()

const storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, 'temp/');
  },
  filename: function (req, file, callback) {
    callback(null, file.originalname); 
  }
})

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

app.post('/api/upload', upload.single('file'), (req, res) => {
    try {
        res.send('Successfully uploaded');
        console.log(req.file.originalname);
        fetch("http://file-svc:4000/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ filePath: 'temp/'+req.file.originalname }),
        });
    } catch(err) {
        res.send(400);
    }
});

app.post('/logout', (req, res) => {
  loggedIn = false;
  res.redirect('/login');
});

app.listen(3000, () => console.log('server ready'))
