const Joi = require('joi');
const AppError = require('../utils/AppError');

const currentYear = new Date().getFullYear();

// Comprehensive movie validation schema
const movieSchema = Joi.object({
    title: Joi.string().trim().min(1).max(255).required().messages({
        'string.empty': 'Movie title cannot be empty',
        'any.required': 'Movie title is required'
    }),
    year: Joi.number().integer().min(1888).max(currentYear + 5).required().messages({
        'number.base': 'Release year must be a valid number',
        'number.min': 'Release year must be 1888 or later',
        'number.max': `Release year cannot exceed ${currentYear + 5}`,
        'any.required': 'Release year is required'
    }),
    genres: Joi.alternatives().try(
        Joi.string().allow(''),
        Joi.array().items(Joi.string())
    ).optional(),
    cast: Joi.alternatives().try(
        Joi.string().allow(''),
        Joi.array().items(Joi.string())
    ).optional(),
    series: Joi.string().allow('', null).optional(),
    partNumber: Joi.alternatives().try(
        Joi.number().integer().min(1),
        Joi.string().allow('', null)
    ).optional(),
    id: Joi.string().optional(),
    _method: Joi.string().optional()
}).unknown(true);

const validateMovie = (req, res, next) => {
    const { error } = movieSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const errorMsg = error.details.map(detail => detail.message).join(', ');
        return next(new AppError(errorMsg, 400));
    }
    next();
};

module.exports = validateMovie;
