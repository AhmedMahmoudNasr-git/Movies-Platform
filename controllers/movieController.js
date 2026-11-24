const movieModel = require("../models/movieModel");
const userFavoriteModel = require("../models/userFavoriteModel");
const { ObjectId } = require("../models/mongodbConnection");
const AppError = require("../utils/AppError");
const deleteUploadedFile = require("../utils/deleteFile");
const saveUploadedFile = require("../utils/saveUploadedFile");

async function getFavoriteMovieIds(req) {
    const currentUser = req.session && req.session.user;
    if (!currentUser) {
        return [];
    }

    const movieIds = await userFavoriteModel.getMovieIds(currentUser.id);
    return movieIds.map((id) => id.toString());
}

// 1. عرض جميع الأفلام مع الترقيم
const index = async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const { movies, pagination } = await movieModel.index(page, 12);
        const favoriteMovieIds = await getFavoriteMovieIds(req);
        
        res.render("pages/movies/index", { 
            movies,
            pagination,
            favoriteMovieIds,
            activeGenre: 'all',
            searchQuery: '',
            baseUrl: '/movies',
            pageTitle: 'Featured Movies'
        });
    } catch (err) {
        next(err);
    }
};

// 2. تصفية الأفلام التي لها أجزاء فقط (Sequels Only)
const byFranchise = async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const { movies, pagination } = await movieModel.getFranchiseMovies(page, 12);
        const favoriteMovieIds = await getFavoriteMovieIds(req);

        res.render("pages/movies/index", { 
            movies,
            pagination,
            favoriteMovieIds,
            activeGenre: 'franchises',
            searchQuery: '',
            baseUrl: '/movies/franchises',
            pageTitle: 'Sequels & Movie Franchises'
        });
    } catch (err) {
        next(err);
    }
};

// 3. البحث عن أفلام مع الترقيم
const moviesSearch = async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const partOfMovieTitle = (req.query.partOfMovieTitle || '').trim();
        const { movies, pagination } = await movieModel.moviesSearch(partOfMovieTitle, page, 12);
        const favoriteMovieIds = await getFavoriteMovieIds(req);

        res.render("pages/movies/index", { 
            movies,
            pagination,
            favoriteMovieIds,
            activeGenre: '',
            searchQuery: partOfMovieTitle,
            baseUrl: '/movies/search',
            pageTitle: `Search: ${partOfMovieTitle}`
        });
    } catch (err) {
        next(err);
    }
};

// 4. تصفية حسب التصنيف مع الترقيم
const byGenre = async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const genre = req.params.genre;
        const { movies, pagination } = await movieModel.getByGenre(genre, page, 12);
        const favoriteMovieIds = await getFavoriteMovieIds(req);

        res.render("pages/movies/index", { 
            movies,
            pagination,
            favoriteMovieIds,
            activeGenre: genre,
            searchQuery: '',
            baseUrl: `/movies/genre/${genre}`,
            pageTitle: `${genre.charAt(0).toUpperCase() + genre.slice(1)} Movies`
        });
    } catch (err) {
        next(err);
    }
};

const favourites = async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const { movies, pagination } = await userFavoriteModel.getMovies(req.session.user.id, page, 12);
        const favoriteMovieIds = movies.map((movie) => movie._id.toString());

        res.render("pages/movies/index", {
            movies,
            pagination,
            favoriteMovieIds,
            activeGenre: 'favourites',
            searchQuery: '',
            baseUrl: '/movies/favourites',
            pageTitle: 'Favourites'
        });
    } catch (err) {
        next(err);
    }
};

const setFavourite = async (req, res, next) => {
    const currentUser = req.session && req.session.user;
    if (!currentUser) {
        return res.status(401).json({ error: 'Please sign in to save favourite movies.' });
    }

    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid Movie ID format.' });
    }

    if (!req.body || typeof req.body.isFavorite !== 'boolean') {
        return res.status(400).json({ error: 'A valid favourite state is required.' });
    }

    try {
        if (req.body.isFavorite) {
            const movie = await movieModel.show(id);
            if (!movie) {
                return res.status(404).json({ error: 'Movie not found.' });
            }
        }

        await userFavoriteModel.setFavorite(currentUser.id, id, req.body.isFavorite);
        res.json({ movieId: id, isFavorite: req.body.isFavorite });
    } catch (err) {
        next(err);
    }
};

// 5. عرض تفاصيل فيلم محدد مع جلب أجزاء السلسلة المرتبطة
const show = async (req, res, next) => {
    try {
        const id = req.params.id;

        if (id === 'new' || id === 'createForm') {
            return createForm(req, res);
        }

        if (!ObjectId.isValid(id)) {
            return next(new AppError('Invalid Movie ID format', 400));
        }

        const movie = await movieModel.show(id);
        if (!movie) {
            return next(new AppError('Movie not found', 404));
        }

        const { seriesName, parts: seriesMovies } = await movieModel.getSeriesMovies(movie);
        const favoriteMovieIds = await getFavoriteMovieIds(req);
        const requestedReturnTo = req.query.returnTo;
        const returnTo = typeof requestedReturnTo === 'string'
            && (requestedReturnTo === '/' || requestedReturnTo.startsWith('/movies'))
            && !requestedReturnTo.startsWith('//')
            && !requestedReturnTo.includes('\\')
            ? requestedReturnTo
            : '/movies';
        const requestedReturnScroll = Number(req.query.returnScroll);
        const returnScroll = Number.isFinite(requestedReturnScroll) && requestedReturnScroll >= 0
            ? requestedReturnScroll
            : 0;

        res.render("pages/movies/show", { 
            movie,
            seriesName,
            seriesMovies,
            favoriteMovieIds,
            returnTo,
            returnScroll,
            pageTitle: movie.title 
        });
    } catch (err) {
        next(err);
    }
};

// 6. صفحة نموذج الإضافة
const createForm = (req, res) => {
    res.render("pages/movies/createForm", {
        pageTitle: 'Add New Movie'
    });
};

// 7. حفظ فيلم جديد
const store = async (req, res, next) => {
    let uploadedThumbnail;
    try {
        const formData = req.body;
        if (req.file) {
            uploadedThumbnail = await saveUploadedFile(req.file);
            formData.thumbnail = uploadedThumbnail;
        }

        await movieModel.store(formData);
        res.redirect("/movies");
    } catch (err) {
        if (uploadedThumbnail) {
            await deleteUploadedFile(uploadedThumbnail);
        }
        next(err);
    }
};

// 8. صفحة نموذج التعديل
const updateForm = async (req, res, next) => {
    try {
        const id = req.params.id;

        if (!ObjectId.isValid(id)) {
            return next(new AppError('Invalid Movie ID format', 400));
        }

        const movie = await movieModel.updateForm(id);
        if (!movie) {
            return next(new AppError('Movie to edit not found', 404));
        }

        res.render("pages/movies/updateForm", { 
            movie,
            pageTitle: `Edit: ${movie.title}`
        });
    } catch (err) {
        next(err);
    }
};

// 9. حفظ التعديلات
const update = async (req, res, next) => {
    let uploadedThumbnail;
    let movieUpdated = false;
    try {
        const id = req.params.id || req.body.id;

        if (!id || !ObjectId.isValid(id)) {
            return next(new AppError('Invalid Movie ID format', 400));
        }

        const oldMovie = await movieModel.show(id);
        if (!oldMovie) {
            return next(new AppError('Movie to update not found', 404));
        }

        const formData = { ...req.body, id };

        if (req.file) {
            uploadedThumbnail = await saveUploadedFile(req.file);
            formData.thumbnail = uploadedThumbnail;
        }

        await movieModel.update(formData);
        movieUpdated = true;

        if (uploadedThumbnail && oldMovie.thumbnail) {
            await deleteUploadedFile(oldMovie.thumbnail);
        }

        res.redirect(`/movies/${id}`);
    } catch (err) {
        if (uploadedThumbnail && !movieUpdated) {
            await deleteUploadedFile(uploadedThumbnail);
        }
        next(err);
    }
};

// 10. حذف فيلم
const destroy = async (req, res, next) => {
    try {
        const id = req.params.id;

        if (!ObjectId.isValid(id)) {
            return next(new AppError('Invalid Movie ID format', 400));
        }

        const movie = await movieModel.show(id);
        if (!movie) {
            return next(new AppError('Movie to delete not found', 404));
        }

        if (movie.thumbnail) {
            await deleteUploadedFile(movie.thumbnail);
        }

        await movieModel.destroy(id);
        await userFavoriteModel.removeForMovie(id);
        res.redirect("/movies");
    } catch (err) {
        next(err);
    }
};

module.exports = {
    index,
    byFranchise,
    moviesSearch,
    byGenre,
    favourites,
    setFavourite,
    show,
    createForm,
    store,
    updateForm,
    update,
    destroy
};
