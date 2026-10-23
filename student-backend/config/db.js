const { MongoClient } = require("mongodb");

const url = "mongodb://localhost:27017";
const client = new MongoClient(url);

async function connectDB() {
    try {
        await client.connect();

        console.log("MongoDB connected successfully!");

        const database = client.db("student_management");
        const studentsCollection = database.collection("students");

        // Prevent duplicate student IDs
        await studentsCollection.createIndex(
            { id: 1 },
            { unique: true }
        );

        console.log("Students collection is ready!");

        return studentsCollection;

    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
        throw error;
    }
}

module.exports = {
    connectDB,
    client
};