const express = require("express");
const multer = require("multer");
const path = require("path");
const router = express.Router();
const userSchema = require("../validation/userValidation");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Make sure this directory exists
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage: storage });

/**
 * @desc Display all the users
 */
router.get("/list-users", (req, res, next) => {
  // Route Description:
  // Purpose: Retrieve and display a list of all users in the database.
  // Inputs: None.
  // Outputs: A JSON response containing the list of users.

  // SQL query to select all users
  const query = "SELECT * FROM users";

  // Execute the query
  global.db.all(query, (err, rows) => {
    if (err) {
      // If an error occurs, forward it to the error handling middleware
      return next(err);
    }

    // Send the retrieved user data as a JSON response
    res.json(rows);
  });
});

/**
 * @desc Displays a page with a form for creating a user record
 */
// Route to display the form for adding a new user
// GET /add-user
// Inputs: None
// Outputs: Renders the 'add-user.ejs' template
router.get("/add-user", (req, res) => {
  // Render the template for adding a new user
  res.render("add-user.ejs");
});

// Route to display the home page
// GET /home
// Inputs: None
// Outputs: Renders the 'home.ejs' template
router.get("/home", (req, res) => {
  // Render the home page template
  res.render("home.ejs");
});

/**
 * @desc Add a new user to the database based on data from the submitted form
 */
// Route to add a new user to the database
// POST /add-user
// Inputs: user_name (from request body)
// Outputs: Confirmation message with the ID of the newly inserted user
router.post("/add-user", (req, res, next) => {
  // SQL query to insert a new user
  const query = "INSERT INTO users (user_name) VALUES( ? );";
  const queryParameters = [req.body.user_name];

  // Execute the query
  global.db.run(query, queryParameters, function (err) {
    if (err) {
      // If an error occurs, forward it to the error handling middleware
      return next(err);
    }

    // Send a confirmation message with the ID of the newly inserted user
    res.send(`New user inserted with ID: ${this.lastID}`);
  });
});

// Route to display all published articles
// GET /published-articles
// Inputs: None
// Outputs: Renders the 'published-articles' template populated with article data
router.get("/published-articles", (req, res) => {
  // SQL query to select all published articles
  const query = "SELECT * FROM publishedarticles";

  // Execute the query and handle results
  global.db.all(query, (err, articles) => {
    if (err) {
      // Log the error and send a 500 Internal Server Error response
      console.error("Error fetching published articles:", err);
      return res.status(500).send("Internal Server Error");
    }

    // Render the 'published-articles' template with the articles data
    res.render("published-articles", { articles: articles });
  });
});
// Route to delete a published article and its associated comments
// GET /delete-published-article/:articleId
// Inputs: articleId (from URL parameter)
// Outputs: Redirects to the author page after deletion or sends an error message
router.get("/delete-published-article/:articleId", (req, res) => {
  const articleId = req.params.articleId;

  // Query to delete comments associated with the article
  const deleteCommentsQuery = "DELETE FROM comments WHERE article_id = ?";
  global.db.run(deleteCommentsQuery, articleId, (err) => {
    if (err) {
      console.error("Error deleting comments for article:", err);
      return res.status(500).send("Failed to delete comments for article");
    }

    console.log(`Comments for article with ID ${articleId} deleted.`);

    // Query to delete the article
    const deleteArticleQuery =
      "DELETE FROM publishedarticles WHERE article_id = ?";
    global.db.run(deleteArticleQuery, articleId, (err) => {
      if (err) {
        console.error("Error deleting article:", err);
        return res.status(500).send("Failed to delete article");
      }

      console.log(`Article with ID ${articleId} deleted.`);
      res.redirect("/author"); // Redirect to the author page
    });
  });
});

// Route to delete a draft
// GET /delete-draft/:draftId
// Inputs: draftId (from URL parameter)
// Outputs: Redirects to the author page after deletion or sends an error message
router.get("/delete-draft/:draftId", (req, res) => {
  const draftId = req.params.draftId;

  // Query to delete the draft
  const deleteQuery = "DELETE FROM drafts WHERE draft_id = ?";
  global.db.run(deleteQuery, draftId, (err) => {
    if (err) {
      console.error("Error deleting draft:", err);
      return res.status(500).send("Failed to delete draft");
    }

    console.log(`Draft with ID ${draftId} deleted.`);
    res.redirect("/author"); // Redirect to the drafts listing page
  });
});

// Route to add a new draft to the database
// POST /add-draft
// Inputs: draftTitle, draftContent from the request body, and draftImage as a file
// Outputs: JSON response with a message indicating success or failure
router.post("/add-draft", upload.single("draftImage"), (req, res) => {
  // SQL query to insert a new draft
  const query =
    "INSERT INTO drafts (draft_title, draft_content, draft_image_path) VALUES(?, ?, ?);";
  const draftImagePath = req.file ? req.file.path : null;
  const queryParams = [
    req.body.draftTitle,
    req.body.draftContent,
    draftImagePath,
  ];

  // Execute the insert query
  global.db.run(query, queryParams, function (err) {
    if (err) {
      // Respond with JSON indicating the error
      res
        .status(500)
        .json({ message: "Error occurred while saving the draft." });
    } else {
      const insertedId = this.lastID;
      // Check if the draft was inserted correctly
      global.db.get(
        "SELECT * FROM drafts WHERE draft_id = ?",
        [insertedId],
        (err, row) => {
          if (row) {
            res.json({ message: `Draft saved with ID ${insertedId}!` });
          } else {
            res.json({ message: "Draft was not saved successfully." });
          }
        }
      );
    }
  });
});

// Route to display all drafts for the author
// GET /author
// Inputs: None
// Outputs: Renders the 'author' template populated with drafts
router.get("/author", (req, res) => {
  // SQL query to select all drafts
  const query = "SELECT * FROM drafts";

  // Execute the query and handle results
  global.db.all(query, (err, drafts) => {
    if (err) {
      // Log the error and send a 500 Internal Server Error response
      console.error("Error in /author route:", err);
      return res.status(500).send("Internal Server Error");
    }

    // Render the 'author' template with the drafts data
    res.render("author", { drafts: drafts });
  });
});

// Route to publish an article from a draft
// GET /publish-article/:draftId
// Inputs: draftId (from URL parameter)
// Outputs: Redirects to the author page after publishing the article or sends an error message
router.get("/publish-article/:draftId", (req, res) => {
  const draftId = req.params.draftId;
  const selectQuery = "SELECT * FROM drafts WHERE draft_id = ?";

  // Retrieve the draft to be published
  global.db.get(selectQuery, [draftId], (err, draft) => {
    if (err) {
      console.error("Error fetching draft:", err);
      return res.status(500).send("Error fetching draft");
    }

    if (draft) {
      const now = new Date();
      // Prepare and execute the query to insert the article into published articles
      const insertQuery =
        "INSERT INTO publishedarticles (article_title, article_content, article_image_path, created_at, last_modified_date) VALUES(?, ?, ?, ?, ?);";
      global.db.run(
        insertQuery,
        [
          draft.draft_title,
          draft.draft_content,
          draft.draft_image_path,
          draft.created_at,
          now.toISOString(),
        ],
        (err) => {
          if (err) {
            console.error("Error publishing article:", err);
            return res.status(500).send("Error publishing article");
          }

          // Delete the draft after successful publishing
          const deleteQuery = "DELETE FROM drafts WHERE draft_id = ?";
          global.db.run(deleteQuery, [draftId], (err) => {
            if (err) {
              console.error("Error deleting draft:", err);
              return res.status(500).send("Error deleting draft");
            }

            res.redirect("/author");
          });
        }
      );
    } else {
      res.status(404).send("Draft not found");
    }
  });
});

// Route to update a published article
// POST /update-published-article/:articleId
// Inputs: articleId (from URL parameter), article details and image from the request body
// Outputs: Redirects to the author page after updating the article or sends an error message
router.post(
  "/update-published-article/:articleId",
  upload.single("articleImage"),
  (req, res) => {
    const articleId = req.params.articleId;

    // Prepare the query to update the published article
    const updateQuery =
      "UPDATE publishedarticles SET article_title = ?, article_content = ?, article_image_path = ?, last_modified_date = CURRENT_TIMESTAMP WHERE article_id = ?";
    const articleImagePath = req.file
      ? req.file.path
      : req.body.existingImagePath;

    global.db.run(
      updateQuery,
      [
        req.body.articleTitle,
        req.body.articleContent,
        articleImagePath,
        articleId,
      ],
      (err) => {
        if (err) {
          console.error("Error updating article:", err);
          return res.status(500).send("Failed to update article");
        }

        console.log(`Article with ID ${articleId} updated.`);
        res.redirect("/author");
      }
    );
  }
);

// Route to update an existing draft
// POST /update-draft/:draftId
// Inputs: draftId (from URL parameter), draft details and image from request body
// Outputs: Redirects to the drafts page after updating or sends an error message
router.post(
  "/update-draft/:draftId",
  upload.single("draftImage"),
  (req, res) => {
    const draftId = req.params.draftId;
    const updateQuery =
      "UPDATE drafts SET draft_title = ?, draft_content = ?, draft_image_path = ? WHERE draft_id = ?";

    // Determine the path for the draft image
    const draftImagePath = req.file
      ? req.file.path
      : req.body.existingImagePath;

    // Execute the update query
    global.db.run(
      updateQuery,
      [req.body.draftTitle, req.body.draftContent, draftImagePath, draftId],
      (err) => {
        if (err) {
          console.error("Error updating draft:", err);
          return res.status(500).send("Failed to update draft");
        }

        console.log(`Draft with ID ${draftId} updated.`);
        res.redirect("/author");
      }
    );
  }
);

// Route to render the editing form for a published article
// GET /edit-publish-article/:articleId
// Inputs: articleId (from URL parameter)
// Outputs: Renders the edit form for the article
router.get("/edit-publish-article/:articleId", (req, res) => {
  const articleId = req.params.articleId;

  // TODO: Fetch article data from the database based on articleId
  // const fetchedArticleData = ...

  // Render the edit form with the fetched article data
  res.render("edit-publish-article", { articleData: fetchedArticleData });
});

// Route to view a specific published article
// GET /view-article/:articleId
// Inputs: articleId (from URL parameter)
// Outputs: Renders the article view template or sends an error message
router.get("/view-article/:articleId", (req, res) => {
  const articleId = req.params.articleId;

  // Query to fetch the article details
  const query = "SELECT * FROM publishedarticles WHERE article_id = ?";
  global.db.get(query, [articleId], (err, article) => {
    if (err) {
      console.error("Error fetching article:", err);
      return res.status(500).send("Internal Server Error");
    }

    if (article) {
      res.render("view-article", { article: article });
    } else {
      res.status(404).send("Article not found");
    }
  });
});

// Route to post a comment on an article
// POST /post-comment
// Inputs: articleId, commenterName, comment (from request body)
// Outputs: Redirects back to the article page after posting the comment
router.post("/post-comment", (req, res) => {
  const { articleId, commenterName, comment } = req.body;
  const insertQuery =
    "INSERT INTO comments (article_id, commenter_name, comment) VALUES (?, ?, ?)";

  // Execute the query to insert a new comment
  global.db.run(insertQuery, [articleId, commenterName, comment], (err) => {
    if (err) {
      console.error("Error posting comment:", err);
      return res.status(500).send("Failed to post comment");
    }
    res.redirect(`/view-article/${articleId}`); // Redirect back to the article page
  });
});

// Route to view a specific published article along with its comments
// GET /view-article/:articleId
// Inputs: articleId (from URL parameter)
// Outputs: Renders the article view template with article and comments data
router.get("/view-article/:articleId", (req, res) => {
  const articleId = req.params.articleId;

  // Fetch the article data
  const articleQuery = "SELECT * FROM publishedarticles WHERE article_id = ?";
  global.db.get(articleQuery, [articleId], (err, article) => {
    if (err) {
      console.error("Error fetching article:", err);
      return res.status(500).send("Internal Server Error");
    }

    if (!article) {
      return res.status(404).send("Article not found");
    }

    // Fetch comments for the article
    const commentsQuery = "SELECT * FROM comments WHERE article_id = ?";
    global.db.all(commentsQuery, [articleId], (err, comments) => {
      if (err) {
        console.error("Error fetching comments:", err);
        return res.status(500).send("Internal Server Error");
      }

      // Render the view-article template with the article and its comments
      res.render("view-article", { article: article, comments: comments });
    });
  });
});

// Route to increment the like count of an article
// POST /like-article/:articleId
// Inputs: articleId (from URL parameter)
// Outputs: Redirects back to the article page after updating likes
router.post("/like-article/:articleId", (req, res) => {
  const articleId = req.params.articleId;
  const updateQuery =
    "UPDATE publishedarticles SET likes = likes + 1 WHERE article_id = ?";

  // Execute the query to update the like count
  global.db.run(updateQuery, [articleId], (err) => {
    if (err) {
      console.error("Error updating likes:", err);
      return res.status(500).send("Failed to update likes");
    }

    console.log(`Likes updated for article ID ${articleId}`);
    res.redirect(`/view-article/${articleId}`); // Redirect back to the article page
  });
});

router.post("/read-article/:articleId", (req, res) => {
  const articleId = req.params.articleId;
  const updateQuery =
    "UPDATE publishedarticles SET reads = reads + 1 WHERE article_id = ?";

  // Execute the query to update the like count
  global.db.run(updateQuery, [articleId], (err) => {
    if (err) {
      console.error("Error updating reads:", err);
      return res.status(500).send("Failed to update reads");
    }

    console.log(`reads updated for article ID ${articleId}`);
    res.redirect(`/view-article/${articleId}`); // Redirect back to the article page
  });
});

// Route to update user settings
// POST /update-setting
// Inputs: authorName, authorUsername, authorPassword (from request body)
// Outputs: Redirects to the author-settings page or sends an error response
router.post("/update-setting", (req, res) => {
  const userId = 1; // Assuming the user ID is 1 for demonstration

  // Validate the request data against the schema
  const { error, value } = userSchema.validate(req.body);

  if (error) {
    return res.status(400).send(error.details[0].message); // Send validation error response
  }

  const { authorName, authorUsername, authorPassword } = value;
  const updateQuery =
    "UPDATE users SET user_name = ?, username = ?, password = ? WHERE user_id = ?";
  const queryParameters = [authorName, authorUsername, authorPassword, userId];

  // Execute the query to update the user settings
  global.db.run(updateQuery, queryParameters, (err) => {
    if (err) {
      console.error("Error updating user settings:", err);
      return res.status(500).send("Error updating settings");
    }
    res.redirect("/author");
  });
});

// Route to display the author settings page
// GET /author-setting
// Inputs: None
// Outputs: Renders the author-settings page with user data
router.get("/author-setting", (req, res) => {
  const userId = 1; // Assuming the user ID is 1 for this example

  const query = "SELECT * FROM users WHERE user_id = ?";
  global.db.get(query, [userId], (err, userData) => {
    if (err) {
      console.error("Error fetching user data:", err);
      return res.status(500).send("Error fetching user data");
    }
    res.render("author-setting", { userData: userData });
  });
});

// Route to handle user login
// POST /login
// Inputs: username, password (from request body)
// Outputs: Redirects to /author on success or back to login page on failure
router.post("/login", (req, res) => {
  const { username, password } = req.body;

  const query = "SELECT * FROM users WHERE username = ?";
  global.db.get(query, [username], (err, user) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).send("Internal Server Error");
    }

    if (user && user.password === password) {
      req.session.message = {
        type: "success",
        content: "Successfully signed in",
      };
      req.session.user = user;
      req.session.lastRequestTime = new Date().getTime();
      res.redirect("/author");
    } else {
      req.session.message = {
        type: "error",
        content: "Invalid username or password",
      };
      res.redirect("/login");
    }
  });
});

// Export the router object so index.js can access it
module.exports = router;
