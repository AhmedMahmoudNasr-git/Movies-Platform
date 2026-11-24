const { MongoClient, ObjectId } = require('mongodb');

// استخراج رابط الاتصال واسم قاعدة البيانات من .env
const configuredMongoUri = process.env.MONGODB_CONNECTION;
if (!configuredMongoUri) {
    throw new Error('MONGODB_CONNECTION must be set in the environment.');
}

const mongoUri = configuredMongoUri.replace(/['"]/g, '');
const dbName = process.env.DB_NAME || 'm01';

// إنشاء Connection Pool مع إعدادات احترافية
const client = new MongoClient(mongoUri, {
    maxPoolSize: 20,          // الحد الأقصى للاتصالات المتزامنة
    minPoolSize: process.env.VERCEL ? 0 : 5, // Avoid idle connections in serverless instances.
    serverSelectionTimeoutMS: 5000,
});

let dbInstance = null;
let clientPromise = null;

// دالة الاتصال الموحدة (Singleton Pattern)
function getMongoClientPromise() {
    if (!clientPromise) {
        clientPromise = client.connect().catch((err) => {
            clientPromise = null;
            throw err;
        });
    }

    return clientPromise;
}

async function connectDB() {
    await getMongoClientPromise();

    if (!dbInstance) {
        dbInstance = client.db(dbName);
        console.log('✅ Connected to MongoDB connection pool successfully');
    }

    return dbInstance;
}

// دالة لجلب كائن قاعدة البيانات بعد الاتصال
function getDB() {
    if (!dbInstance) {
        throw new Error('Database not initialized. Please call connectDB() first.');
    }
    return dbInstance;
}

// إغلاق الاتصال بأمان عند إيقاف السيرفر (Graceful Shutdown)
async function closeDB() {
    if (clientPromise) {
        await client.close();
        clientPromise = null;
        dbInstance = null;
        console.log('MongoDB connection closed gracefully');
    }
}

module.exports = {
    connectDB,
    getMongoClientPromise,
    getDB,
    closeDB,
    ObjectId,
    client,
    dbName
};
