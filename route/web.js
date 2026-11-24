const express = require('express');
const webRouter = express.Router();
const movieController = require('../controllers/movieController');
const authController = require('../controllers/authController');
const validateMovie = require('../middlewares/validateMovie');
const upload = require('../middlewares/upload');
const { requireAuth, requireAdmin } = require('../middlewares/auth');

/* ----------------- Authentication Routes ----------------- */
webRouter.get('/auth/login', authController.loginForm);
webRouter.post('/auth/login', authController.login);
webRouter.get('/auth/register', authController.registerForm);
webRouter.post('/auth/register', authController.register);
webRouter.get('/auth/logout', authController.logout);
webRouter.post('/auth/logout', authController.logout);

/* ----------------- Movies Routes ----------------- */

// 1. مسارات العرض والبحث العامة
webRouter.get('/', movieController.index);
webRouter.get('/movies', movieController.index);

// 2. مسار تصفية أفلام السلاسل والأجزاء فقط (Sequels & Franchises Only)
webRouter.get('/movies/franchises', movieController.byFranchise);
webRouter.get('/movies/series', movieController.byFranchise);

// 3. البحث والتصنيفات
webRouter.get('/movies/search', movieController.moviesSearch);
webRouter.get('/moviesSearch', movieController.moviesSearch);
webRouter.get('/movies/genre/:genre', movieController.byGenre);
webRouter.get('/movies/favourites', requireAuth, movieController.favourites);
webRouter.post('/movies/:id/favourite', movieController.setFavourite);

// 4. مسارات إنشاء فيلم جديد (قبل /movies/:id)
webRouter.get('/movies/new', requireAdmin, movieController.createForm);
webRouter.get('/movies/createForm', requireAdmin, movieController.createForm);
webRouter.post('/movies', requireAdmin, upload.single('thumbnail'), validateMovie, movieController.store);
webRouter.post('/movies/store', requireAdmin, upload.single('thumbnail'), validateMovie, movieController.store);

// 5. مسار تعديل فيلم محدد
webRouter.get('/movies/:id/edit', requireAdmin, movieController.updateForm);
webRouter.get('/movies/updateForm/:id', requireAdmin, movieController.updateForm);
webRouter.put('/movies/:id', requireAdmin, upload.single('thumbnail'), validateMovie, movieController.update);
webRouter.post('/movies/update', requireAdmin, upload.single('thumbnail'), validateMovie, movieController.update);

// 6. مسار حذف فيلم
webRouter.delete('/movies/:id', requireAdmin, movieController.destroy);

// 7. مسار عرض تفاصيل الفيلم بالمعرّف
webRouter.get('/movies/:id', movieController.show);
webRouter.get('/movies/show/:id', movieController.show);

module.exports = webRouter;
