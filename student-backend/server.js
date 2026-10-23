
const express = require("express");
const { connectDB, client } = require("./config/db");
const studentRoutes = require("./routes/studentRoutes");

const server = express();

// Parse incoming JSON request bodies
server.use(express.json());

// Sample data for initial setup
const sampleStudents = [
    {
        id: 1,
        name: "Abhishek",
        course: "Java Full Stack"
    },
    {
        id: 2,
        name: "Rahul",
        course: "React Native"
    }
];

// Register student API routes
server.use("/", studentRoutes);

// Connect to MongoDB and start server
async function startServer() {
    try {
        const studentsCollection = await connectDB();

        // Make MongoDB collection available to the application
        server.locals.studentsCollection = studentsCollection;

        // Insert sample data only when collection is empty
        const count = await studentsCollection.countDocuments();

        if (count === 0) {
            await studentsCollection.insertMany(sampleStudents);
            console.log("Sample students inserted successfully!");
        }

        server.listen(3000,'0.0.0.0', () => {
            console.log("Server started successfully!");
            console.log("Home URL:      http://localhost:3000/");
            console.log("Students URL:  http://localhost:3000/students");
            console.log("Student by ID: http://localhost:3000/students/1");
        });
    } catch (error) {
        console.error("Startup failed:", error.message);
        await client.close().catch(() => {});
        process.exitCode = 1;
    }
}

startServer();
