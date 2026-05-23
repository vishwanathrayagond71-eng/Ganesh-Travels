// ============================================================
// auth.js - Authentication Middleware
// Protects routes so only logged-in users/admins can access
// ============================================================

// Check if user is logged in
function requireUser(req, res, next) {
  if (req.session && req.session.user) {
    return next(); // User is authenticated, proceed
  }
  req.flash('error', 'Please login to access this page.');
  res.redirect('/login');
}

// Check if admin is logged in
function requireAdmin(req, res, next) {
  if (req.session && req.session.admin) {
    return next(); // Admin is authenticated, proceed
  }
  req.flash('error', 'Admin access required.');
  res.redirect('/admin/login');
}

// Check if user is NOT logged in (redirect away from login/register pages)
function redirectIfLoggedIn(req, res, next) {
  if (req.session && req.session.user) {
    return res.redirect('/dashboard');
  }
  next();
}

// Check if admin is NOT logged in (redirect away from admin login)
function redirectIfAdminLoggedIn(req, res, next) {
  if (req.session && req.session.admin) {
    return res.redirect('/admin/dashboard');
  }
  next();
}

module.exports = { requireUser, requireAdmin, redirectIfLoggedIn, redirectIfAdminLoggedIn };
