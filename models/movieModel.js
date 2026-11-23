const { MongoClient, ObjectId, mongoConnection } = require('./mongodbConnection');

// 1. جلب أحدث 20 فيلم في الصفحة الرئيسية
async function index() {
    const client = await MongoClient.connect(mongoConnection);
    const db = client.db("m01");
    const movies = await db.collection("movies")
        .find()
        .sort({ year: -1 })
        .limit(20)
        .toArray();
    await client.close();
    return movies;
}

// 2. البحث عن فيلم باسمه أو باسم أحد الممثلين
async function moviesSearch(partOfMovieTitle) {
    const client = await MongoClient.connect(mongoConnection);
    const db = client.db("m01");
    const movies = await db.collection("movies")
        .find({
            $or: [
                { title: { $regex: partOfMovieTitle,$options: 'i' } },
                { cast: { $regex: partOfMovieTitle,$options: 'i' } }
            ]
        })
        .sort({ year: -1 })
        .limit(20)
        .toArray();
    await client.close();
    return movies;
}

// 3. جلب أحدث 20 فيلم حسب التصنيف
async function getByGenre(genre) {
    const client = await MongoClient.connect(mongoConnection);
    const db = client.db("m01");
    const movies = await db.collection("movies")
        .find({ genres: { $regex: new RegExp(`^${genre}$`, 'i') } })
        .sort({ year: -1 })
        .limit(20)
        .toArray();
    await client.close();
    return movies;
}

// 4. عرض تفاصيل فيلم محدد
async function show(id) {
    const client = await MongoClient.connect(mongoConnection);
    const db = client.db("m01");
    const movies = await db.collection("movies").find({ _id: new ObjectId(String(id)) }).toArray();
    await client.close();
    return movies;
}

// 5. إضافة فيلم جديد
async function store(createFormData) {
    let doc = {
        title: createFormData.title,
        year: Number(createFormData.year),
        genres: typeof createFormData.genres === 'string' 
            ? createFormData.genres.split(',').map(g => g.trim()) 
            : createFormData.genres,
        cast: typeof createFormData.cast === 'string' 
            ? createFormData.cast.split(',').map(c => c.trim()) 
            : createFormData.cast,
        thumbnail: createFormData.thumbnail || ''
    };

    const client = await MongoClient.connect(mongoConnection);
    const db = client.db("m01");
    await db.collection("movies").insertOne(doc);
    await client.close();
    return { "operation": "success" };
}

// 6. جلب بيانات فيلم لتعديلها
async function updateForm(id) {
    const client = await MongoClient.connect(mongoConnection);
    const db = client.db("m01");
    const movies = await db.collection("movies").find({ _id: new ObjectId(String(id)) }).toArray();
    await client.close();
    return movies;
}

// 7. تحديث بيانات فيلم
async function update(updateFormData) {
    const id = updateFormData.id;
    let updateSQL = {
        title: updateFormData.title,
        year: Number(updateFormData.year),
        genres: typeof updateFormData.genres === 'string' 
            ? updateFormData.genres.split(',').map(g => g.trim()) 
            : updateFormData.genres,
        cast: typeof updateFormData.cast === 'string' 
            ? updateFormData.cast.split(',').map(c => c.trim()) 
            : updateFormData.cast,
    };

    if (updateFormData.thumbnail && updateFormData.thumbnail !== "") {
        updateSQL.thumbnail = updateFormData.thumbnail;
    }

    const client = await MongoClient.connect(mongoConnection);
    const db = client.db("m01");
    await db.collection("movies").updateOne(
        { _id: new ObjectId(String(id)) },
        { $set: updateSQL }
    );
    await client.close();
    return { "operation": "success" };
}

// 8. حذف فيلم
async function destroy(id) {
    const client = await MongoClient.connect(mongoConnection);
    const db = client.db("m01");
    await db.collection("movies").deleteOne({ _id: new ObjectId(String(id)) });
    await client.close();
    return { "operation": "success" };
}

module.exports = {
    index,
    moviesSearch,
    getByGenre,
    show,
    store,
    updateForm,
    update,
    destroy
};