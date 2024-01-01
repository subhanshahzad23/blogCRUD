
-- This makes sure that foreign_key constraints are observed and that errors will be thrown for violations
PRAGMA foreign_keys=ON;

BEGIN TRANSACTION;


CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS email_accounts (
    email_account_id INTEGER PRIMARY KEY AUTOINCREMENT,
    email_address TEXT NOT NULL,
    user_id  INT, --the user that the email account belongs to
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS drafts (
    draft_id INTEGER PRIMARY KEY AUTOINCREMENT,
    draft_title TEXT NOT NULL,
    draft_content TEXT NOT NULL,
    draft_image_path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS comments (
    comment_id INTEGER PRIMARY KEY AUTOINCREMENT,
    article_id INTEGER,
    commenter_name TEXT NOT NULL,
    comment TEXT NOT NULL,
    posted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (article_id) REFERENCES publishedarticles(article_id)
);


CREATE TABLE IF NOT EXISTS publishedarticles (
    article_id INTEGER PRIMARY KEY AUTOINCREMENT,
    article_title TEXT NOT NULL,
    article_content TEXT NOT NULL,
    article_image_path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_modified_date DATETIME,
    likes INTEGER DEFAULT 0
);


-- Insert default data (if necessary here)

-- Set up three users
INSERT INTO users ('user_name') VALUES ('Simon Star');
INSERT INTO users ('user_name') VALUES ('Dianne Dean');
INSERT INTO users ('user_name') VALUES ('Harry Hilbert');

-- Give Simon two email addresses and Diane one, but Harry has none
INSERT INTO email_accounts ('email_address', 'user_id') VALUES ('simon@gmail.com', 1); 
INSERT INTO email_accounts ('email_address', 'user_id') VALUES ('simon@hotmail.com', 1); 
INSERT INTO email_accounts ('email_address', 'user_id') VALUES ('dianne@yahoo.co.uk', 2); 

COMMIT;

