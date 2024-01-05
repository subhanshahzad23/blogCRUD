function isAuthenticated(req, res, next) {
  if (
    req.session &&
    req.session.user &&
    new Date().getTime() - req.session.lastRequestTime < 40 * 1000
  ) {
    req.session.lastRequestTime = new Date().getTime(); // Update the last request time
    return next();
  } else {
    req.session.destroy(); // Destroy the session if it's expired
    res.redirect("/login");
  }
}

module.exports = {
  isAuthenticated,
};
