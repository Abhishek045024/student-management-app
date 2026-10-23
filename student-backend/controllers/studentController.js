
const getCollection = (req) => {
    return req.app.locals.studentsCollection;
};

// GET - Get all students
const getAllStudents = async (req) => {
    return await getCollection(req)
        .find({})
        .sort({ id: 1 })
        .toArray();
};

// GET - Get student by ID
const getStudentById = async (req) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        const error = new Error(
            "Student ID must be a positive integer"
        );
        error.statusCode = 400;
        throw error;
    }

    return await getCollection(req).findOne({ id });
};

// POST - Add a new student
const addStudent = async (req) => {
    const { id, name, course } = req.body;

    if (
        id == null ||
        typeof name !== "string" ||
        !name.trim() ||
        typeof course !== "string" ||
        !course.trim()
    ) {
        const error = new Error(
            "Please provide id, name, and course"
        );
        error.statusCode = 400;
        throw error;
    }

    const newId = Number(id);

    if (!Number.isInteger(newId) || newId <= 0) {
        const error = new Error(
            "ID must be a positive integer"
        );
        error.statusCode = 400;
        throw error;
    }

    const collection = getCollection(req);

    const existingStudent = await collection.findOne({
        id: newId
    });

    if (existingStudent) {
        const error = new Error("Student ID already exists");
        error.statusCode = 409;
        throw error;
    }

    const newStudent = {
        id: newId,
        name: name.trim(),
        course: course.trim()
    };

    try {
        const result = await collection.insertOne(newStudent);

        return {
            _id: result.insertedId,
            ...newStudent
        };
    } catch (error) {
        if (error.code === 11000) {
            const duplicateError = new Error(
                "Student ID already exists"
            );
            duplicateError.statusCode = 409;
            throw duplicateError;
        }

        throw error;
    }
};

// PUT - Replace complete student details
const updateStudent = async (req) => {
    const collection = getCollection(req);
    const currentId = Number(req.params.id);
    const { id, name, course } = req.body;

    if (!Number.isInteger(currentId) || currentId <= 0) {
        const error = new Error(
            "Student ID must be a positive integer"
        );
        error.statusCode = 400;
        throw error;
    }

    if (
        id == null ||
        typeof name !== "string" ||
        !name.trim() ||
        typeof course !== "string" ||
        !course.trim()
    ) {
        const error = new Error(
            "Please provide id, name, and course"
        );
        error.statusCode = 400;
        throw error;
    }

    const newId = Number(id);

    if (!Number.isInteger(newId) || newId <= 0) {
        const error = new Error(
            "ID must be a positive integer"
        );
        error.statusCode = 400;
        throw error;
    }

    const existingStudent = await collection.findOne({
        id: currentId
    });

    if (!existingStudent) {
        const error = new Error("Student not found");
        error.statusCode = 404;
        throw error;
    }

    if (newId !== currentId) {
        const duplicate = await collection.findOne({
            id: newId
        });

        if (duplicate) {
            const error = new Error(
                "Student ID already exists"
            );
            error.statusCode = 409;
            throw error;
        }
    }

    const updatedStudent = {
        id: newId,
        name: name.trim(),
        course: course.trim()
    };

    try {
        await collection.updateOne(
            { id: currentId },
            { $set: updatedStudent }
        );
    } catch (error) {
        if (error.code === 11000) {
            const duplicateError = new Error(
                "Student ID already exists"
            );
            duplicateError.statusCode = 409;
            throw duplicateError;
        }

        throw error;
    }

    return {
        _id: existingStudent._id,
        ...updatedStudent
    };
};

// PATCH - Update selected fields
const patchStudent = async (req) => {
    const collection = getCollection(req);
    const currentId = Number(req.params.id);

    if (!Number.isInteger(currentId) || currentId <= 0) {
        const error = new Error(
            "Student ID must be a positive integer"
        );
        error.statusCode = 400;
        throw error;
    }

    const existingStudent = await collection.findOne({
        id: currentId
    });

    if (!existingStudent) {
        const error = new Error("Student not found");
        error.statusCode = 404;
        throw error;
    }

    const { id, name, course } = req.body;
    const hasId = Object.prototype.hasOwnProperty.call(
        req.body, "id"
    );
    const hasName = Object.prototype.hasOwnProperty.call(
        req.body, "name"
    );
    const hasCourse = Object.prototype.hasOwnProperty.call(
        req.body, "course"
    );

    if (!hasId && !hasName && !hasCourse) {
        const error = new Error(
            "Please provide id, name, or course to update"
        );
        error.statusCode = 400;
        throw error;
    }

    const updates = {};

    if (hasId) {
        const newId = Number(id);

        if (!Number.isInteger(newId) || newId <= 0) {
            const error = new Error(
                "ID must be a positive integer"
            );
            error.statusCode = 400;
            throw error;
        }

        if (newId !== currentId) {
            const duplicate = await collection.findOne({
                id: newId
            });

            if (duplicate) {
                const error = new Error(
                    "Student ID already exists"
                );
                error.statusCode = 409;
                throw error;
            }
        }

        updates.id = newId;
    }

    if (hasName) {
        if (typeof name !== "string" || !name.trim()) {
            const error = new Error(
                "Name must be a non-empty string"
            );
            error.statusCode = 400;
            throw error;
        }

        updates.name = name.trim();
    }

    if (hasCourse) {
        if (typeof course !== "string" || !course.trim()) {
            const error = new Error(
                "Course must be a non-empty string"
            );
            error.statusCode = 400;
            throw error;
        }

        updates.course = course.trim();
    }

    try {
        await collection.updateOne(
            { id: currentId },
            { $set: updates }
        );
    } catch (error) {
        if (error.code === 11000) {
            const duplicateError = new Error(
                "Student ID already exists"
            );
            duplicateError.statusCode = 409;
            throw duplicateError;
        }

        throw error;
    }

    const finalId = updates.id ?? currentId;

    return await collection.findOne({
        id: finalId
    });
};

// DELETE - Delete student and renumber remaining IDs
const deleteStudent = async (req) => {
    const collection = getCollection(req);
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        const error = new Error(
            "Student ID must be a positive integer"
        );
        error.statusCode = 400;
        throw error;
    }

    // 1. Find the student to delete
    const student = await collection.findOne({ id });

    if (!student) {
        const error = new Error("Student not found");
        error.statusCode = 404;
        throw error;
    }

    // 2. Delete the selected student
    await collection.deleteOne({ id });

    // 3. Get remaining students in ID order
    const remainingStudents = await collection
        .find({})
        .sort({ id: 1 })
        .toArray();

    // 4. Assign temporary negative IDs to avoid
    // collisions with existing IDs or a unique ID index
    if (remainingStudents.length > 0) {
        await collection.bulkWrite(
            remainingStudents.map((student, index) => ({
                updateOne: {
                    filter: { _id: student._id },
                    update: {
                        $set: { id: -(index + 1) }
                    }
                }
            }))
        );

        // 5. Assign sequential IDs starting from 1
        await collection.bulkWrite(
            remainingStudents.map((student, index) => ({
                updateOne: {
                    filter: { _id: student._id },
                    update: {
                        $set: { id: index + 1 }
                    }
                }
            }))
        );
    }

    // Return the deleted student's original details
    return student;
};

module.exports = {
    getAllStudents,
    getStudentById,
    addStudent,
    updateStudent,
    patchStudent,
    deleteStudent
};
