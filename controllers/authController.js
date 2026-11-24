const userModel = require('../models/userModel');
const AppError = require('../utils/AppError');

// Sign In page
const loginForm = (req, res) => {
    res.render('pages/auth/login', {
        pageTitle: 'Sign In',
        redirectUrl: req.query.redirect || '/movies',
        error: req.query.error || null
    });
};

// Process Sign In
const login = async (req, res, next) => {
    try {
        const { email, password, redirectUrl } = req.body;

        if (!email || !password) {
            return res.render('pages/auth/login', {
                pageTitle: 'Sign In',
                redirectUrl: redirectUrl || '/movies',
                error: 'Please enter both email and password.'
            });
        }

        const user = await userModel.findByEmail(email);
        if (!user) {
            return res.render('pages/auth/login', {
                pageTitle: 'Sign In',
                redirectUrl: redirectUrl || '/movies',
                error: 'Invalid email address or password.'
            });
        }

        const isMatch = await userModel.comparePassword(password, user.password);
        if (!isMatch) {
            return res.render('pages/auth/login', {
                pageTitle: 'Sign In',
                redirectUrl: redirectUrl || '/movies',
                error: 'Invalid email address or password.'
            });
        }

        req.session.user = {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role
        };

        res.redirect(redirectUrl || '/movies');
    } catch (err) {
        next(err);
    }
};

// Create Account page
const registerForm = (req, res) => {
    res.render('pages/auth/register', {
        pageTitle: 'Create Account',
        error: null
    });
};

// Process Create Account
const register = async (req, res, next) => {
    try {
        const { username, email, password, confirmPassword } = req.body;

        if (!username || !email || !password) {
            return res.render('pages/auth/register', {
                pageTitle: 'Create Account',
                error: 'All fields are required.'
            });
        }

        if (password.length < 6) {
            return res.render('pages/auth/register', {
                pageTitle: 'Create Account',
                error: 'Password must be at least 6 characters.'
            });
        }

        if (password !== confirmPassword) {
            return res.render('pages/auth/register', {
                pageTitle: 'Create Account',
                error: 'Passwords do not match.'
            });
        }

        const existingUser = await userModel.findByEmail(email);
        if (existingUser) {
            return res.render('pages/auth/register', {
                pageTitle: 'Create Account',
                error: 'Email is already registered.'
            });
        }

        const newUser = await userModel.create({
            username,
            email,
            password,
            role: 'user'
        });

        req.session.user = {
            id: newUser._id,
            username: newUser.username,
            email: newUser.email,
            role: newUser.role
        };

        res.redirect('/movies');
    } catch (err) {
        next(err);
    }
};

// Sign Out
const logout = (req, res, next) => {
    req.session.destroy((err) => {
        if (err) {
            return next(err);
        }

        res.redirect('/movies');
    });
};

module.exports = {
    loginForm,
    login,
    registerForm,
    register,
    logout
};
