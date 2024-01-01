const express = require("express");
const multer = require("multer");
const path = require("path");
const router = express.Router();

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
  // Define the query
  const query = "SELECT * FROM users";

  // Execute the query and render the page with the results
  global.db.all(query, function (err, rows) {
    if (err) {
      next(err); //send the error on to the error handler
    } else {
      res.json(rows); // render page as simple json
    }
  });
});

/**
 * @desc Displays a page with a form for creating a user record
 */
router.get("/add-user", (req, res) => {
  res.render("add-user.ejs");
});

router.get("/home", (req, res) => {
  res.render("home.ejs");
});

/**
 * @desc Add a new user to the database based on data from the submitted form
 */
router.post("/add-user", (req, res, next) => {
  // Define the query
  const query = "INSERT INTO users (user_name) VALUES( ? );";
  const query_parameters = [req.body.user_name];

  // Execute the query and send a confirmation message
  global.db.run(query, query_parameters, function (err) {
    if (err) {
      next(err); //send the error on to the error handler
    } else {
      res.send(`New data inserted @ id ${this.lastID}!`);
      next();
    }
  });
});
router.get("/published-articles", (req, res) => {
  const query = "SELECT * FROM publishedarticles";
  global.db.all(query, (err, articles) => {
    if (err) {
      console.error("Error fetching published articles:", err);
      return res.status(500).send("Internal Server Error");
    }
    res.render("published-articles", { articles: articles }); // Assuming you have a template for published articles
  });
});

router.get("/delete-published-article/:articleId", (req, res) => {
  const articleId = req.params.articleId;

  // First, delete the comments associated with the article
  const deleteCommentsQuery = "DELETE FROM comments WHERE article_id = ?";
  global.db.run(deleteCommentsQuery, articleId, function (err) {
    if (err) {
      console.error("Error deleting comments for article:", err);
      res.status(500).send("Failed to delete comments for article");
      return;
    }

    console.log(`Comments for article with ID ${articleId} deleted.`);

    // Then, delete the article
    const deleteArticleQuery =
      "DELETE FROM publishedarticles WHERE article_id = ?";
    global.db.run(deleteArticleQuery, articleId, function (err) {
      if (err) {
        console.error("Error deleting article:", err);
        res.status(500).send("Failed to delete article");
      } else {
        console.log(`Article with ID ${articleId} deleted.`);
        res.redirect("/author"); // Redirect to the page where articles are listed
      }
    });
  });
});

router.get("/delete-draft/:draftId", (req, res) => {
  const draftId = req.params.draftId;
  const deleteQuery = "DELETE FROM drafts WHERE draft_id = ?";

  global.db.run(deleteQuery, draftId, function (err) {
    if (err) {
      console.error("Error deleting draft:", err);
      res.status(500).send("Failed to delete draft");
    } else {
      console.log(`Draft with ID ${draftId} deleted.`);
      res.redirect("/author"); // Redirect back to the drafts listing page
    }
  });
});

router.post("/add-draft", upload.single("draftImage"), (req, res, next) => {
  const query =
    "INSERT INTO drafts (draft_title, draft_content, draft_image_path) VALUES( ?, ?, ? );";
  const draftImagePath = req.file ? req.file.path : null;
  const query_parameters = [
    req.body.draftTitle,
    req.body.draftContent,
    draftImagePath,
  ];

  global.db.run(query, query_parameters, function (err) {
    if (err) {
      // Respond with JSON in case of error
      res
        .status(500)
        .json({ message: "Error occurred while saving the draft." });
    } else {
      const insertedId = this.lastID;
      // Verify if the row was actually inserted
      global.db.get(
        "SELECT * FROM drafts WHERE draft_id = ?",
        [insertedId],
        function (err, row) {
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

router.get("/author", (req, res) => {
  const query = "SELECT * FROM drafts";
  global.db.all(query, (err, rows) => {
    if (err) {
      console.error("Error in /author route:", err);
      return res.status(500).send("Internal Server Error");
    }
    res.render("author", { drafts: rows });
  });
});

router.get("/publish-article/:draftId", (req, res) => {
  const draftId = req.params.draftId;
  const selectQuery = "SELECT * FROM drafts WHERE draft_id = ?";
  const insertQuery =
    "INSERT INTO publishedarticles (article_title, article_content, article_image_path, created_at, last_modified_date) VALUES(?, ?, ?, ?, ?);";
  const deleteQuery = "DELETE FROM drafts WHERE draft_id = ?";

  global.db.get(selectQuery, [draftId], (err, draft) => {
    if (err) {
      console.error("Error fetching draft:", err);
      return res.status(500).send("Error fetching draft");
    }

    if (draft) {
      const now = new Date();
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

          // After successful insertion, delete the draft
          global.db.run(deleteQuery, [draftId], (err) => {
            if (err) {
              console.error("Error deleting draft:", err);
              return res.status(500).send("Error deleting draft");
            }
            // Redirect or respond after successful deletion
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
router.post(
  "/update-published-article/:articleId",
  upload.single("articleImage"),
  (req, res) => {
    const articleId = req.params.articleId;
    const updateQuery =
      "UPDATE publishedarticles SET article_title = ?, article_content = ?, article_image_path = ? WHERE article_id = ?";

    // Path for the new image, if uploaded
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
      function (err) {
        if (err) {
          console.error("Error updating article:", err);
          res.status(500).send("Failed to update article");
        } else {
          console.log(`Article with ID ${articleId} updated.`);
          res.redirect("/author");
          // Redirect to the page where articles are listed
        }
      }
    );
  }
);
router.post(
  "/update-draft/:draftId",
  upload.single("draftImage"),
  (req, res) => {
    const draftId = req.params.draftId;
    const updateQuery =
      "UPDATE drafts SET draft_title = ?, draft_content = ?, draft_image_path = ? WHERE draft_id = ?";

    // Path for the new image, if uploaded
    const draftImagePath = req.file
      ? req.file.path
      : req.body.existingImagePath;

    global.db.run(
      updateQuery,
      [req.body.draftTitle, req.body.draftContent, draftImagePath, draftId],
      function (err) {
        if (err) {
          console.error("Error updating draft:", err);
          res.status(500).send("Failed to update draft");
        } else {
          console.log(`Draft with ID ${draftId} updated.`);
          res.redirect("/author"); // Redirect to the page where drafts are listed
        }
      }
    );
  }
);

router.get("/edit-publish-article/:articleId", (req, res) => {
  const articleId = req.params.articleId;
  // Fetch article data from the database based on articleId
  // Then render the edit form with this data
  res.render("edit-publish-article", { articleData: fetchedArticleData });
});

router.get("/view-article/:articleId", (req, res) => {
  const articleId = req.params.articleId;

  const query = "SELECT * FROM publishedarticles WHERE article_id = ?";
  global.db.get(query, [articleId], (err, article) => {
    if (err) {
      console.error("Error fetching article:", err);
      res.status(500).send("Internal Server Error");
    } else {
      if (article) {
        res.render("view-article", { article: article });
      } else {
        res.status(404).send("Article not found");
      }
    }
  });
});
router.post("/post-comment", (req, res) => {
  const { articleId, commenterName, comment } = req.body;
  const insertQuery =
    "INSERT INTO comments (article_id, commenter_name, comment) VALUES (?, ?, ?)";

  global.db.run(
    insertQuery,
    [articleId, commenterName, comment],
    function (err) {
      if (err) {
        // handle error
      } else {
        res.redirect(`/view-article/${articleId}`); // Redirect back to the article page
      }
    }
  );
});
router.get("/view-article/:articleId", (req, res) => {
  const articleId = req.params.articleId;

  // First, fetch the article data
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

    // Now, fetch comments for the article
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
router.post("/like-article/:articleId", (req, res) => {
  const articleId = req.params.articleId;
  const updateQuery =
    "UPDATE publishedarticles SET likes = likes + 1 WHERE article_id = ?";

  global.db.run(updateQuery, [articleId], function (err) {
    if (err) {
      console.error("Error updating likes:", err);
      res.status(500).send("Failed to update likes");
    } else {
      console.log(`Likes updated for article ID ${articleId}`);
      res.redirect(`/view-article/${articleId}`); // Redirect back to the article page
    }
  });
});

// Export the router object so index.js can access it
module.exports = router;
