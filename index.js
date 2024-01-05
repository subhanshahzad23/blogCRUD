/**
 * index.js
 * This is your main app entry point
 */

// Set up express, bodyparser and EJS
const express = require("express");
const app = express();
const port = 3000;
const { isAuthenticated } = require("./middlewares/auth");

const session = require("express-session");

app.use(
  session({
    secret: "your secret key", // Replace with your secret key
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 40 * 1000, // This sets the session duration to 30 minutes
    },
  })
);

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
  // Render the home.ejs template
  res.render("home"); // Assuming "home.ejs" is the name of your template file
});

app.get("/author", isAuthenticated, (req, res) => {
  const draftsQuery = "SELECT * FROM drafts";
  const publishedQuery = "SELECT * FROM publishedarticles";

  global.db.all(draftsQuery, (err, drafts) => {
    if (err) {
      console.error("Error in /author route - drafts:", err);
      return res.status(500).send("Internal Server Error");
    }

    global.db.all(publishedQuery, (err, publishedArticles) => {
      if (err) {
        console.error("Error in /author route - publishedArticles:", err);
        return res.status(500).send("Internal Server Error");
      }

      const userId = 1; // Example user ID
      const query = "SELECT * FROM users WHERE user_id = ?";
      global.db.get(query, [userId], (err, userData) => {
        if (err) {
          console.error("Error fetching user data:", err);
          res.status(500).send("Internal Server Error");
        }

        // Check if there's a message in the session
        let message = req.session.message;
        delete req.session.message; // Remove the message after displaying it

        res.render("author", {
          drafts: drafts,
          publishedArticles: publishedArticles,
          userData: userData,
          message: message, // Pass the message to the template
        });
      });
    });
  });
});

app.get("/edit-publish-article/:articleId", isAuthenticated, (req, res) => {
  const articleId = req.params.articleId;

  const query = "SELECT * FROM publishedarticles WHERE article_id = ?";
  global.db.get(query, [articleId], (err, article) => {
    if (err) {
      console.error("Error fetching article:", err);
      res.status(500).send("Internal Server Error");
    } else {
      // Make sure you pass the article data as 'articleData'
      res.render("edit-publish-article", { articleData: article });
    }
  });
});
app.get("/edit-draft-article/:draftId", isAuthenticated, (req, res) => {
  const draftId = req.params.draftId;

  const query = "SELECT * FROM drafts WHERE draft_id = ?";
  global.db.get(query, [draftId], (err, draft) => {
    if (err) {
      console.error("Error fetching draft:", err);
      res.status(500).send("Internal Server Error");
    } else {
      res.render("edit-draft-article", { draftData: draft });
    }
  });
});
app.get("/reader-home", (req, res) => {
  const query = "SELECT * FROM publishedarticles"; // Query to fetch published articles

  global.db.all(query, (err, articles) => {
    if (err) {
      console.error("Error fetching published articles:", err);
      return res.status(500).send("Internal Server Error");
    }
    // Render the reader.ejs template with the articles data
    res.render("reader", { articles: articles });
  });
});
app.get("/view-article/:articleId", (req, res) => {
  const articleId = req.params.articleId;

  // Fetch the article data
  const articleQuery = "SELECT * FROM publishedarticles WHERE article_id = ?";
  global.db.get(articleQuery, [articleId], (err, article) => {
    if (err) {
      console.error("Error fetching article:", err);
      res.status(500).send("Internal Server Error");
      return;
    }

    if (!article) {
      res.status(404).send("Article not found");
      return;
    }

    // Fetch comments for the article
    const commentsQuery = "SELECT * FROM comments WHERE article_id = ?";
    global.db.all(commentsQuery, [articleId], (err, comments) => {
      if (err) {
        console.error("Error fetching comments:", err);
        res.status(500).send("Internal Server Error");
      } else {
        // Render the view-article template with both article and comments
        res.render("view-article", { article: article, comments: comments });
      }
    });
  });
});

app.get("/author-setting", isAuthenticated, (req, res) => {
  // Assuming you want to fetch user data here
  const userId = 1; // Example user ID

  const query = "SELECT * FROM users WHERE user_id = ?";
  global.db.get(query, [userId], (err, userData) => {
    if (err) {
      console.error("Error fetching user data:", err);
      res.status(500).send("Internal Server Error");
    } else {
      res.render("author-setting", { userData: userData });
    }
  });
});

app.get("/create-draft", (req, res) => {
  // Render the home.ejs template
  res.render("create-draft"); // Assuming "home.ejs" is the name of your template file
});

app.get("/reader-home", (req, res) => {
  // Render the home.ejs template
  res.render("reader"); // Assuming "home.ejs" is the name of your template file
});
app.get("/login", (req, res) => {
  // Render the home.ejs template
  res.render("login"); // Assuming "home.ejs" is the name of your template file
});

app.get("/view-article", (req, res) => {
  // Render the home.ejs template
  res.render("view-article"); // Assuming "home.ejs" is the name of your template file
});

// Add all the route handlers in usersRoutes to the app under the path /users
const usersRoutes = require("./routes/users");
app.use("/users", usersRoutes);
const articleRoutes = require("./routes/users"); // Adjust the path to your router file

app.use(articleRoutes); // Use the article router

app.use("/uploads", express.static("uploads"));

// Make the web application listen for HTTP requests
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
