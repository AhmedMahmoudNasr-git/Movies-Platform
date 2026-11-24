const { connectDB, ObjectId } = require('./mongodbConnection');
const escapeRegex = require('../utils/escapeRegex');

// دالة مساعدة للوصول لمجموعة الأفلام
async function getCollection() {
    const db = await connectDB();
    return db.collection("movies");
}

// 1. جلب الأفلام في الصفحة الرئيسية مع الترقيم (Pagination)
async function index(page = 1, limit = 12) {
    const movies = await getCollection();
    const skip = (page - 1) * limit;

    const [totalMovies, data] = await Promise.all([
        movies.countDocuments(),
        movies.find().sort({ year: -1 }).skip(skip).limit(limit).toArray()
    ]);

    const totalPages = Math.ceil(totalMovies / limit) || 1;

    return {
        movies: data,
        pagination: {
            page,
            totalPages,
            totalMovies,
            limit
        }
    };
}

// 2. البحث عن فيلم باسمه أو ممثليه مع الترقيم (Pagination & ReDoS Safe)
async function moviesSearch(partOfMovieTitle, page = 1, limit = 12) {
    if (!partOfMovieTitle || typeof partOfMovieTitle !== 'string') {
        return await index(page, limit);
    }
    const safeQuery = escapeRegex(partOfMovieTitle.trim());
    if (!safeQuery) {
        return await index(page, limit);
    }

    const movies = await getCollection();
    const filter = {
        $or: [
            { title: { $regex: safeQuery, $options: 'i' } },
            { cast: { $regex: safeQuery, $options: 'i' } }
        ]
    };

    const skip = (page - 1) * limit;

    const [totalMovies, data] = await Promise.all([
        movies.countDocuments(filter),
        movies.find(filter).sort({ year: -1 }).skip(skip).limit(limit).toArray()
    ]);

    const totalPages = Math.ceil(totalMovies / limit) || 1;

    return {
        movies: data,
        pagination: {
            page,
            totalPages,
            totalMovies,
            limit
        }
    };
}

// 3. جلب الأفلام حسب التصنيف مع الترقيم (Pagination & ReDoS Safe)
async function getByGenre(genre, page = 1, limit = 12) {
    if (!genre || typeof genre !== 'string') {
        return { movies: [], pagination: { page: 1, totalPages: 1, totalMovies: 0, limit } };
    }
    const safeGenre = escapeRegex(genre.trim());
    const filter = { genres: { $regex: new RegExp(`^${safeGenre}$`, 'i') } };

    const movies = await getCollection();
    const skip = (page - 1) * limit;

    const [totalMovies, data] = await Promise.all([
        movies.countDocuments(filter),
        movies.find(filter).sort({ year: -1 }).skip(skip).limit(limit).toArray()
    ]);

    const totalPages = Math.ceil(totalMovies / limit) || 1;

    return {
        movies: data,
        pagination: {
            page,
            totalPages,
            totalMovies,
            limit
        }
    };
}

// 4. جلب الأفلام التي لها أجزاء فقط (Sequels & Franchises Only)
async function getFranchiseMovies(page = 1, limit = 12) {
    const filter = {
        $or: [
            { series: { $ne: null, $exists: true } },
            { title: { $regex: '(:\\s*Chapter|:\\s*Part|\\bPart\\s+[0-9IVX]+|\\bChapter\\s+[0-9IVX]+|\\bVol\\.?\\s*[0-9]+|\\s+2\\b|\\s+3\\b|\\s+4\\b|\\s+II\\b|\\s+III\\b|\\s+IV\\b|\\bSequel\\b|\\bTrilogy\\b)', $options: 'i' } }
        ]
    };

    const movies = await getCollection();
    const skip = (page - 1) * limit;

    const [totalMovies, data] = await Promise.all([
        movies.countDocuments(filter),
        movies.find(filter).sort({ year: -1 }).skip(skip).limit(limit).toArray()
    ]);

    const totalPages = Math.ceil(totalMovies / limit) || 1;

    return {
        movies: data,
        pagination: {
            page,
            totalPages,
            totalMovies,
            limit
        }
    };
}

// 5. عرض تفاصيل فيلم محدد
async function show(id) {
    const movies = await getCollection();
    return await movies.findOne({ _id: new ObjectId(String(id)) });
}

// 6. جلب كافة أجزاء السلسلة المرتبطة بفيلم (ذكاء تلقائي + دعم الحقل المخصص)
async function getSeriesMovies(movie) {
    if (!movie) return { seriesName: '', parts: [] };

    let seriesName = movie.series;

    // إذا لم يكن هناك اسم سلسلة محدد يدوياً، نستخرجه تلقائياً من اسم الفيلم
    if (!seriesName && movie.title) {
        let base = movie.title.split(/[:\–\-\–]/)[0].trim();
        base = base.replace(/\s+(part|chapter|vol|volume)?\s*[0-9ivx]+$/i, '').trim();
        if (base.length >= 3) {
            seriesName = base;
        }
    }

    if (!seriesName) {
        return { seriesName: '', parts: [] };
    }

    const safeSeries = escapeRegex(seriesName.trim());
    const movies = await getCollection();

    const parts = await movies
        .find({
            $or: [
                { series: { $regex: `^${safeSeries}$`, $options: 'i' } },
                { title: { $regex: `^${safeSeries}\\b`, $options: 'i' } }
            ]
        })
        .sort({ partNumber: 1, year: 1 })
        .toArray();

    if (parts.length > 1) {
        return { seriesName, parts };
    }

    return { seriesName: '', parts: [] };
}

// 7. إضافة فيلم جديد (يدعم السلسلة ورقم الجزء)
async function store(createFormData) {
    let doc = {
        title: createFormData.title.trim(),
        year: Number(createFormData.year),
        genres: typeof createFormData.genres === 'string' 
            ? createFormData.genres.split(',').map(g => g.trim()).filter(Boolean) 
            : (createFormData.genres || []),
        cast: typeof createFormData.cast === 'string' 
            ? createFormData.cast.split(',').map(c => c.trim()).filter(Boolean) 
            : (createFormData.cast || []),
        series: createFormData.series && createFormData.series.trim() !== '' ? createFormData.series.trim() : null,
        partNumber: createFormData.partNumber && createFormData.partNumber !== '' ? Number(createFormData.partNumber) : null,
        thumbnail: createFormData.thumbnail || ''
    };

    const movies = await getCollection();
    const result = await movies.insertOne(doc);
    return { operation: "success", insertedId: result.insertedId };
}

// 8. جلب بيانات فيلم لتعديلها
async function updateForm(id) {
    const movies = await getCollection();
    return await movies.findOne({ _id: new ObjectId(String(id)) });
}

// 9. تحديث بيانات فيلم (يدعم السلسلة ورقم الجزء)
async function update(updateFormData) {
    const id = updateFormData.id;
    let updateDoc = {
        title: updateFormData.title.trim(),
        year: Number(updateFormData.year),
        genres: typeof updateFormData.genres === 'string' 
            ? updateFormData.genres.split(',').map(g => g.trim()).filter(Boolean) 
            : (updateFormData.genres || []),
        cast: typeof updateFormData.cast === 'string' 
            ? updateFormData.cast.split(',').map(c => c.trim()).filter(Boolean) 
            : (updateFormData.cast || []),
        series: updateFormData.series && updateFormData.series.trim() !== '' ? updateFormData.series.trim() : null,
        partNumber: updateFormData.partNumber && updateFormData.partNumber !== '' ? Number(updateFormData.partNumber) : null,
    };

    if (updateFormData.thumbnail && updateFormData.thumbnail !== "") {
        updateDoc.thumbnail = updateFormData.thumbnail;
    }

    const movies = await getCollection();
    const result = await movies.updateOne(
        { _id: new ObjectId(String(id)) },
        { $set: updateDoc }
    );
    return result;
}

// 10. حذف فيلم
async function destroy(id) {
    const movies = await getCollection();
    const result = await movies.deleteOne({ _id: new ObjectId(String(id)) });
    return result;
}

module.exports = {
    index,
    moviesSearch,
    getByGenre,
    getFranchiseMovies,
    show,
    getSeriesMovies,
    store,
    updateForm,
    update,
    destroy
};
