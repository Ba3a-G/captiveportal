const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const md5 = require('md5');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const env = require('dotenv').config();

const PORT = process.argv[2] | 3000
const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

var db;

app.get('/', express.static('static'));

app.post('/login', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const hashedpass = md5(password);

    db.get(`SELECT * FROM users WHERE username = "${username}" AND password = "${hashedpass}"`, (err, row) => {
        if (row) {
            const token = jwt.sign({ username: username }, process.env.jwtsecret, { expiresIn: '5m' });
            // set cookie
            res.cookie('rcscptoken', token, { maxAge: 300000, httpOnly: true });
            res.send('Login successful!');
        } else {
            console.log(err);
            res.send('Login failed!');
        } 
    })
})

function startServer() {
    try {
        // connect to db
        db = new sqlite3.Database('./db/users.sqlite3', (error) => {
            if (error) {
                console.error(error.message);
                throw new Error(error.message);
            }
            console.log('Connected to the database.');
            db.serialize(() => {
                db.run('CREATE TABLE IF NOT EXISTS users (username TEXT PRIMARY KEY, password TEXT)');
                db.run(`INSERT INTO users (username, password) VALUES ('aryan', '${md5('pass')}')`);
            });
            // start server
            app.listen(PORT, () => {
                console.log(`Server is running on port ${PORT}.`);
            });
        });
    } catch (error) {
        console.error(error.message);
    }
}

startServer();