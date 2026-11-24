const AppError = require('../utils/AppError');

// Require authentication
const requireAuth = (req, res, next) => {
    if (!req.session || !req.session.user) {
        return res.redirect('/auth/login?redirect=' + encodeURIComponent(req.originalUrl));
    }
    next();
};

// Require administrator privileges
const requireAdmin = (req, res, next) => {
    if (!req.session || !req.session.user) {
        return res.redirect('/auth/login?redirect=' + encodeURIComponent(req.originalUrl));
    }

    if (req.session.user.role !== 'admin') {
        return next(new AppError('Access denied. Administrator privileges required.', 403));
    }

    next();
};

module.exports = {
    requireAuth,
    requireAdmin
};
