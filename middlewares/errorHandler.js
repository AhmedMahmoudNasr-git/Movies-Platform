// Centralized Global Error Handler
const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'An unexpected server error occurred';

    if (process.env.NODE_ENV !== 'production') {
        console.error(`💥 [Error ${statusCode}]:`, err.stack || err);
    } else {
        console.error(`💥 [Error ${statusCode}]:`, message);
    }

    res.status(statusCode);

    if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.json({
            status: err.status || 'error',
            statusCode,
            message
        });
    }

    res.render('pages/error', {
        pageTitle: `Error ${statusCode}`,
        statusCode,
        message: statusCode === 404 ? 'The requested page or movie could not be found.' : message
    });
};

module.exports = errorHandler;
