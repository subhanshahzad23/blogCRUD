/**
 * index.js
 * This is your main app entry point
 */

// Set up express, bodyparser and EJS
const express = require("express");
const app = express();
const port = 3000;
var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs"); // set the app to use ejs for rendering
app.use(express.static(__dirname + "/public")); // set location of static files

// Set up SQLite
// Items in the global namespace are accessible throught out the node application
const sqlite3 = require("sqlite3").verbose();
global.db = new sqlite3.Database("./database.db", function (err) {
  if (err) {
    console.error(err);
    process.exit(1); // bail out we can't connect to the DB
  } else {
    console.log("Database connected");
    global.db.run("PRAGMA foreign_keys=ON"); // tell SQLite to pay attention to foreign key constraints
  }
});

// Handle requests to the home page
app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/home", (req, res) => {
  // Render the home.ejs template
  res.render("home"); // Assuming "home.ejs" is the name of your template file
});

app.get("/author", (req, res) => {
  // Render the home.ejs template
  res.render("author"); // Assuming "home.ejs" is the name of your template file
});
app.get("/author-settings", (req, res) => {
  // Render the home.ejs template
  res.render("author-setting"); // Assuming "home.ejs" is the name of your template file
});

app.get("/create-draft", (req, res) => {
  // Render the home.ejs template
  res.render("create-draft"); // Assuming "home.ejs" is the name of your template file
});
app.get("/login", (req, res) => {
  // Render the home.ejs template
  res.render("login"); // Assuming "home.ejs" is the name of your template file
});
// Add all the route handlers in usersRoutes to the app under the path /users
const usersRoutes = require("./routes/users");
app.use("/users", usersRoutes);

// Make the web application listen for HTTP requests
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
