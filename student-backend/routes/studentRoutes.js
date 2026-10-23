const express = require("express");
const router = express.Router();

const {
    getAllStudents,
    getStudentById,
    addStudent,
    updateStudent,
    patchStudent,
    deleteStudent
} = require("../controllers/studentController");

// Wrapper: execute controller and send HTTP response
const handleRequest = (controller, successStatus = 200) => {
    return async (req, res) => {
        try {
            const result = await controller(req);
            res.status(successStatus).json(result);
        } catch (error) {
            console.error("API Error:", error);

            res.status(error.statusCode || 500).json({
                message: error.message || "Internal Server Error"
            });
        }
    };
};

// HOME
router.get("/", (req, res) => {
    res.send("Student Management Backend is running!");
});

// GET - All students
router.get("/students", handleRequest(getAllStudents));

// GET - Student by ID
router.get("/students/:id", handleRequest(getStudentById));

// POST - Add student
router.post("/students", handleRequest(addStudent, 201));

// PUT - Replace student details
router.put("/students/:id", handleRequest(updateStudent));

// PATCH - Update selected fields
router.patch("/students/:id", handleRequest(patchStudent));

// DELETE - Delete student
router.delete("/students/:id", handleRequest(deleteStudent));

module.exports = router;