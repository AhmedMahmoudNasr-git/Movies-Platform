const { connectDB, ObjectId } = require('./mongodbConnection');
const bcrypt = require('bcryptjs');

async function getUsersCollection() {
    const db = await connectDB();
    return db.collection("users");
}

async function findByEmail(email) {
    const users = await getUsersCollection();
    return await users.findOne({ email: email.toLowerCase().trim() });
}

async function findById(id) {
    const users = await getUsersCollection();
    return await users.findOne({ _id: new ObjectId(String(id)) });
}

async function create({ username, email, password, role = 'user' }) {
    const users = await getUsersCollection();
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const userDoc = {
        username: username.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: role, // 'admin' أو 'user'
        createdAt: new Date()
    };

    const result = await users.insertOne(userDoc);
    return { _id: result.insertedId, username: userDoc.username, email: userDoc.email, role: userDoc.role };
}

async function comparePassword(candidatePassword, hashedPassword) {
    return await bcrypt.compare(candidatePassword, hashedPassword);
}

// إنشاء حساب مسؤول افتراضي تلقائياً عند أول تشغيل
async function seedAdminIfNone() {
    const users = await getUsersCollection();
    const count = await users.countDocuments();

    if (count > 0) {
        return;
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
        if (adminEmail || adminPassword) {
            throw new Error('Set both ADMIN_EMAIL and ADMIN_PASSWORD to create the initial admin account.');
        }

        console.warn('No users found. Set ADMIN_EMAIL and ADMIN_PASSWORD to create an initial admin account.');
        return;
    }

    await create({
        username: process.env.ADMIN_USERNAME || 'Admin',
        email: adminEmail,
        password: adminPassword,
        role: 'admin'
    });
    console.log(`✅ Default Admin created: ${adminEmail}`);
}

module.exports = {
    findByEmail,
    findById,
    create,
    comparePassword,
    seedAdminIfNone
};
