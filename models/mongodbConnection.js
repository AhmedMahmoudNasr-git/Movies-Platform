const { MongoClient, ObjectId } = require('mongodb');

// إزالة أي علامات تنصيص زائدة إن وجدت تلقائياً
const mongoConnection = (process.env.MONGODB_CONNECTION || 'mongodb://localhost:27017').replace(/['"]/g, '');

module.exports = {
    MongoClient,
    ObjectId,
    mongoConnection,
};