
-- This makes sure that foreign_key constraints are observed and that errors will be thrown for violations
PRAGMA foreign_keys=ON;

BEGIN TRANSACTION;


CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL -- In real-world applications, this should be a hashed password
);

-- CREATE TABLE IF NOT EXISTS email_accounts (
--     email_account_id INTEGER PRIMARY KEY AUTOINCREMENT,
--     email_address TEXT NOT NULL,
--     user_id  INT, --the user that the email account belongs to
--     FOREIGN KEY (user_id) REFERENCES users(user_id)
-- );

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
    likes INTEGER DEFAULT 0,
    reads INTEGER DEFAULT 0

);


-- Insert default data (if necessary here)

-- Set up three users
-- INSERT INTO users ('user_name') VALUES ('Simon Star');
-- INSERT INTO users ('user_name') VALUES ('Dianne Dean');
-- INSERT INTO users ('user_name') VALUES ('Harry Hilbert');

-- -- Give Simon two email addresses and Diane one, but Harry has none
-- INSERT INTO email_accounts ('email_address', 'user_id') VALUES ('simon@gmail.com', 1); 
-- INSERT INTO email_accounts ('email_address', 'user_id') VALUES ('simon@hotmail.com', 1); 
-- INSERT INTO email_accounts ('email_address', 'user_id') VALUES ('dianne@yahoo.co.uk', 2); 

INSERT INTO drafts (draft_title, draft_content, draft_image_path) VALUES 
('Computer Blogs', 'In the rapidly evolving digital world, staying updated with the latest advancements in technology is crucial. Computer articles serve as a vital resource for individuals looking to expand their knowledge and stay abreast with the ever-changing landscape of technology.', 'images/bll2.png'),
('Scientific Theory', 'Scientific theories are the pillars of modern scientific understanding. They provide explanations for natural phenomena and are fundamental in advancing scientific knowledge.', 'images/bll3.png'),
('Politics', 'Politics, a term often met with mixed emotions, is an integral part of human society. It shapes our governance, public policies, and the very structure of our communities.', 'images/bll4.png');

INSERT INTO publishedarticles (article_title, article_content, article_image_path, last_modified_date, likes, reads) VALUES 
('Online Business', 'The advent of the internet has revolutionized the way we conduct business. Online business, or e-commerce, has emerged as a dominant force in the global economy, reshaping traditional market dynamics.', 'images/bll5.png', '2022-01-01 10:00:00', 5,2),
('5 Business Ideas', 'A subscription-based service providing eco-friendly and sustainable products. This can range from household items to personal care products, all focused on promoting a sustainable lifestyle', 'images/bll6.png', '2022-01-02 11:00:00', 3,3),
('Earn Online', 'Offer your skills and services on a freelance basis. Popular fields include writing, graphic design, web development, programming, and digital marketing', 'images/bll3.png', '2022-01-03 12:00:00', 8,4);

INSERT INTO users ('user_name', 'username', 'password') VALUES ('John Victor', 'admin', 'admin123');

COMMIT;

