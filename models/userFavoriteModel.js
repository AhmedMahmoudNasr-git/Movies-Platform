const { connectDB, ObjectId } = require('./mongodbConnection');

const collectionName = 'userFavorites';
let favoriteIndexPromise = null;

async function getFavoritesCollection() {
    const db = await connectDB();
    return db.collection(collectionName);
}

async function ensureFavoriteIndex() {
    const favorites = await getFavoritesCollection();

    if (!favoriteIndexPromise) {
        favoriteIndexPromise = favorites
            .createIndex({ userId: 1, movieId: 1 }, { unique: true })
            .catch((err) => {
                favoriteIndexPromise = null;
                throw err;
            });
    }

    await favoriteIndexPromise;
    return favorites;
}

async function getMovieIds(userId) {
    const favorites = await ensureFavoriteIndex();
    const entries = await favorites
        .find({ userId: new ObjectId(String(userId)) })
        .project({ movieId: 1, _id: 0 })
        .toArray();

    return entries.map((entry) => entry.movieId);
}

async function getMovies(userId, page = 1, limit = 12) {
    const favorites = await ensureFavoriteIndex();
    const userObjectId = new ObjectId(String(userId));
    const skip = (page - 1) * limit;

    const [totalMovies, entries] = await Promise.all([
        favorites.countDocuments({ userId: userObjectId }),
        favorites.find({ userId: userObjectId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .toArray()
    ]);

    const movieIds = entries.map((entry) => entry.movieId);
    const db = await connectDB();
    const movies = movieIds.length
        ? await db.collection('movies').find({ _id: { $in: movieIds } }).toArray()
        : [];
    const moviesById = new Map(movies.map((movie) => [movie._id.toString(), movie]));

    return {
        movies: movieIds.map((id) => moviesById.get(id.toString())).filter(Boolean),
        pagination: {
            page,
            totalPages: Math.ceil(totalMovies / limit) || 1,
            totalMovies,
            limit
        }
    };
}

async function setFavorite(userId, movieId, isFavorite) {
    const favorites = await ensureFavoriteIndex();
    const favorite = {
        userId: new ObjectId(String(userId)),
        movieId: new ObjectId(String(movieId))
    };

    if (!isFavorite) {
        return favorites.deleteOne(favorite);
    }

    const addFavorite = () => favorites.updateOne(
        favorite,
        { $setOnInsert: { ...favorite, createdAt: new Date() } },
        { upsert: true }
    );

    try {
        return await addFavorite();
    } catch (err) {
        if (err.code !== 11000) {
            throw err;
        }

        return addFavorite();
    }
}

async function removeForMovie(movieId) {
    const favorites = await getFavoritesCollection();
    return favorites.deleteMany({ movieId: new ObjectId(String(movieId)) });
}

module.exports = {
    getMovieIds,
    getMovies,
    setFavorite,
    removeForMovie
};
