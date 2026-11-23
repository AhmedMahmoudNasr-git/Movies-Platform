const movieModel = require("../models/movieModel");

const index = (req, res) => {
    movieModel.index()
        .then(movies => {
            res.render("pages/movies/index", { movies, activeGenre: 'all' });
        });
}

const moviesSearch = (req, res) => {
    const partOfMovieTitle = req.query.partOfMovieTitle;
    movieModel.moviesSearch(partOfMovieTitle)
        .then(movies => {
            res.render("pages/movies/index", { movies, activeGenre: '' });
        });
}

// تصفية حسب التصنيف (Action, Drama, Comedy)
const byGenre = (req, res) => {
    const genre = req.params.genre;
    movieModel.getByGenre(genre)
        .then(movies => {
            res.render("pages/movies/index", { movies, activeGenre: genre });
        });
}

// CRUD: عرض فيلم محدد
const show = (req, res) => {
    const id = req.params.id;
    movieModel.show(id)
        .then(movies => {
            res.render("pages/movies/show", { movie: movies[0] });
        });
}

// CRUD: صفحة نموذج الإضافة
const createForm = (req, res) => {
    res.render("pages/movies/createForm");
}

// CRUD: حفظ الفيلم جديد
const store = (req, res) => {
    const formData = req.body;
    if (req.file) {
        formData.thumbnail = req.file.filename;
    }
    movieModel.store(formData)
        .then(() => {
            res.redirect("/movies");
        });
}

// CRUD: صفحة نموذج التعديل
const updateForm = (req, res) => {
    const id = req.params.id;
    movieModel.updateForm(id)
        .then(movies => {
            res.render("pages/movies/updateForm", { movie: movies[0] });
        });
}

// CRUD: حفظ التعديلات
const update = (req, res) => {
    const formData = req.body;
    if (req.file) {
        formData.thumbnail = req.file.filename;
    }
    movieModel.update(formData)
        .then(() => {
            res.redirect("/movies");
        });
}

// CRUD: حذف فيلم
const destroy = (req, res) => {
    const id = req.params.id;
    movieModel.destroy(id)
        .then(() => {
            res.redirect("/movies");
        });
}

module.exports = {
    index,
    moviesSearch,
    byGenre,
    show,
    createForm,
    store,
    updateForm,
    update,
    destroy
};