
const express = require("express");
const { MongoClient } = require("mongodb");

const server = express();
server.use(express.json());

// MongoDB connection details
const url = "mongodb://localhost:27017";
const client = new MongoClient(url);

let studentsCollection;

// Initial sample data
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

// HOME - Check server
server.get("/", (req, res) => {
    res.send("Student Management Backend is running!");
});

// GET - Get all students
server.get("/students", async (req, res) => {
    try {
        const students = await studentsCollection
            .find({})
            .sort({ id: 1 })
            .toArray();

        res.status(200).json(students);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch students"
        });
    }
});

// GET - Get student by ID
server.get("/students/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);

        const student = await studentsCollection.findOne({ id });

        if (!student) {
            return res.status(404).json({
                message: "Student not found"
            });
        }

        res.status(200).json(student);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch student"
        });
    }
});

// POST - Add a new student
server.post("/students", async (req, res) => {
    try {
        const { id, name, course } = req.body;

        if (
            id == null ||
            typeof name !== "string" ||
            !name.trim() ||
            typeof course !== "string" ||
            !course.trim()
        ) {
            return res.status(400).json({
                message: "Please provide id, name, and course"
            });
        }

        const newId = Number(id);

        if (!Number.isInteger(newId) || newId <= 0) {
            return res.status(400).json({
                message: "ID must be a positive integer"
            });
        }

        const existingStudent =
            await studentsCollection.findOne({ id: newId });

        if (existingStudent) {
            return res.status(409).json({
                message: "Student ID already exists"
            });
        }

        const newStudent = {
            id: newId,
            name: name.trim(),
            course: course.trim()
        };

        const result =
            await studentsCollection.insertOne(newStudent);

        res.status(201).json({
            message: "Student added successfully",
            student: {
                _id: result.insertedId,
                ...newStudent
            }
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: "Student ID already exists"
            });
        }

        res.status(500).json({
            message: "Failed to add student"
        });
    }
});

// PUT - Replace complete student details
server.put("/students/:id", async (req, res) => {
    try {
        const currentId = Number(req.params.id);
        const { id, name, course } = req.body;

        if (
            id == null ||
            typeof name !== "string" ||
            !name.trim() ||
            typeof course !== "string" ||
            !course.trim()
        ) {
            return res.status(400).json({
                message: "Please provide id, name, and course"
            });
        }

        const newId = Number(id);

        if (!Number.isInteger(newId) || newId <= 0) {
            return res.status(400).json({
                message: "ID must be a positive integer"
            });
        }

        const existingStudent =
            await studentsCollection.findOne({ id: currentId });

        if (!existingStudent) {
            return res.status(404).json({
                message: "Student not found"
            });
        }

        if (newId !== currentId) {
            const duplicate =
                await studentsCollection.findOne({ id: newId });

            if (duplicate) {
                return res.status(409).json({
                    message: "Student ID already exists"
                });
            }
        }

        const updatedStudent = {
            id: newId,
            name: name.trim(),
            course: course.trim()
        };

        await studentsCollection.updateOne(
            { id: currentId },
            { $set: updatedStudent }
        );

        res.status(200).json({
            message: "Student updated successfully",
            student: {
                _id: existingStudent._id,
                ...updatedStudent
            }
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to update student"
        });
    }
});

// PATCH - Update selected student fields
server.patch("/students/:id", async (req, res) => {
    try {
        const currentId = Number(req.params.id);

        const student =
            await studentsCollection.findOne({ id: currentId });

        if (!student) {
            return res.status(404).json({
                message: "Student not found"
            });
        }

        const { id, name, course } = req.body;

        if (
            id === undefined &&
            name === undefined &&
            course === undefined
        ) {
            return res.status(400).json({
                message: "Please provide id, name, or course to update"
            });
        }

        const updates = {};

        if (id !== undefined) {
            const newId = Number(id);

            if (!Number.isInteger(newId) || newId <= 0) {
                return res.status(400).json({
                    message: "ID must be a positive integer"
                });
            }

            if (newId !== currentId) {
                const duplicate =
                    await studentsCollection.findOne({ id: newId });

                if (duplicate) {
                    return res.status(409).json({
                        message: "Student ID already exists"
                    });
                }
            }

            updates.id = newId;
        }

        if (name !== undefined) {
            if (typeof name !== "string" || !name.trim()) {
                return res.status(400).json({
                    message: "Name must be a non-empty string"
                });
            }

            updates.name = name.trim();
        }

        if (course !== undefined) {
            if (typeof course !== "string" || !course.trim()) {
                return res.status(400).json({
                    message: "Course must be a non-empty string"
                });
            }

            updates.course = course.trim();
        }

        await studentsCollection.updateOne(
            { id: currentId },
            { $set: updates }
        );

        const updatedStudent =
            await studentsCollection.findOne({ id: updates.id ?? currentId });

        res.status(200).json({
            message: "Student updated successfully",
            student: updatedStudent
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to update student"
        });
    }
});

// DELETE - Delete student by ID
server.delete("/students/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);

        const student = await studentsCollection.findOne({ id });

        if (!student) {
            return res.status(404).json({
                message: "Student not found"
            });
        }

        await studentsCollection.deleteOne({ id });

        res.status(200).json({
            message: "Student deleted successfully",
            student
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to delete student"
        });
    }
});

// Connect to MongoDB and start server
async function startServer() {
    try {
        await client.connect();

        console.log("MongoDB connected successfully!");

        const database = client.db("student_management");
        studentsCollection = database.collection("students");

        // Prevent duplicate student IDs
        await studentsCollection.createIndex(
            { id: 1 },
            { unique: true }
        );

        // Insert sample data only if collection is empty
        const count = await studentsCollection.countDocuments();

        if (count === 0) {
            await studentsCollection.insertMany(sampleStudents);
            console.log("Sample students inserted successfully!");
        }

        server.listen(3000, () => {
            console.log("Server started successfully!");
            console.log("Home URL:     http://localhost:3000/");
            console.log("Students URL: http://localhost:3000/students");
            console.log("Student by ID: http://localhost:3000/students/1");
        });
    } catch (error) {
        console.error("Startup failed:", error.message);
        await client.close().catch(() => {});
        process.exitCode = 1;
    }
}

startServer();
