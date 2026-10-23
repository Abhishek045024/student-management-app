const getCollection = (req) => {
    return req.app.locals.studentsCollection;
};

// GET - Get all students
const getAllStudents = async (req) => {
    console.log("GET /students - Request received");

    const collection = getCollection(req);

    console.time("Students MongoDB Query");

    try {
        const students = await collection
            .find({})
            .sort({ id: 1 })
            .toArray();

        console.timeEnd("Students MongoDB Query");

        console.log("Students count:", students.length);

        return students;
    } catch (error) {
        console.timeEnd("Students MongoDB Query");
        console.error("Error fetching students:", error);
        throw error;
    }
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

// PATCH - Update any combination of id, name, and course
const patchStudent = async (req) => {
    const collection = getCollection(req);
    const currentId = Number(req.params.id);

    // Validate the current ID from the URL
    if (!Number.isInteger(currentId) || currentId <= 0) {
        const error = new Error(
            "Student ID must be a positive integer"
        );
        error.statusCode = 400;
        throw error;
    }

    // Find the existing student
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
        req.body,
        "id"
    );

    const hasName = Object.prototype.hasOwnProperty.call(
        req.body,
        "name"
    );

    const hasCourse = Object.prototype.hasOwnProperty.call(
        req.body,
        "course"
    );

    // Require at least one field
    if (!hasId && !hasName && !hasCourse) {
        const error = new Error(
            "Please provide id, name, or course to update"
        );
        error.statusCode = 400;
        throw error;
    }

    const updates = {};

    // Validate ID if supplied
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
            const