const express = require('express');
const webRouter = express.Router();
const app = express();

/* ------------- controllers ------------------- */

/* const productController = require('../controllers/productController'); */

const movieController = require('../controllers/movieController');

/* -------------- parse of form ------------------- */
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));

const multer = require("multer");

const path = require("path");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "public/img/uploades/");
    },
    filename: (req, file, cb) => {
        if(file){
            cb(null, Date.now() + path.extname(file.originalname))
        }
    }
});

const upload = multer({
    storage: storage
});


/* -------------- route roles ------------------------ */

/* -------------------products route roles----------------------- */
// webRouter.get('/    ', (req, res) => {
//     movieController.index(req, res);
// });

// webRouter.get('/moviesSearch', (req, res) => {
//     movieController.moviesSearch(req, res);
// });


/* ----------------- movies route roles ----------------- */
webRouter.get('/', movieController.index);
webRouter.get('/movies', movieController.index);
webRouter.get('/moviesSearch', movieController.moviesSearch);
webRouter.get('/movies/genre/:genre', movieController.byGenre);

// CRUD Routes
webRouter.get('/movies/createForm', movieController.createForm);
webRouter.post('/movies/store', upload.single('thumbnail'), movieController.store);
webRouter.get('/movies/show/:id', movieController.show);
webRouter.get('/movies/updateForm/:id', movieController.updateForm);
webRouter.post('/movies/update', upload.single('thumbnail'), movieController.update);
webRouter.get('/movies/destroy/:id', movieController.destroy);


/* webRouter.get('/products', (req, res) => {
    productController.index(req, res);
});

webRouter.get('/products/createForm', (req, res) => {
    productController.createForm(req, res);
});

webRouter.post('/products/store', upload.single('photo'), (req, res) => {
    productController.store(req, res);
});

webRouter.get('/products/show/:id', (req, res) => {
    productController.show(req, res);
});

webRouter.get('/products/destroy/:id', (req, res) => {
    productController.destroy(req, res);
});

webRouter.get('/products/updateForm/:id', (req, res) => {
    productController.updateForm(req, res);
});
webRouter.post('/products/update', upload.single('photo'), (req, res) => {
    productController.update(req, res);
}); */


module.exports = webRouter;