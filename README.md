# Student Management App

A Student Management Application built to manage student records using a React Native frontend, Node.js and Express.js backend, and MongoDB database.

## 🚀 Technologies Used

- **Frontend:** React Native, Expo
- **Backend:** Node.js, Express.js
- **Database:** MongoDB
- **API Testing:** Postman
- **Version Control:** Git and GitHub

## ✨ Features

- Create student records
- Retrieve student records
- Update existing student information
- Delete student records
- REST API integration
- MongoDB database connectivity
- Separate frontend and backend structure

## 📁 Project Structure

```text
student-management-app/
├── student-frontend/
│   ├── App.js
│   ├── package.json
│   └── ...
├── student-backend/
│   ├── config/
│   ├── controllers/
│   ├── routes/
│   ├── services/
│   ├── server.js
│   └── package.json
└── README.md
```

## ⚙️ Prerequisites

Install the following before running the project:

- Node.js and npm
- MongoDB running locally
- Expo Go app on your mobile device, if testing on a physical phone

## 🛠️ How to Run the Project

### 1. Start the Backend

Open a terminal and navigate to the backend folder:

```bash
cd student-backend
npm install
node server.js
```

Make sure MongoDB is running locally before starting the backend.

The backend server runs on port `3000`.

### 2. Start the Frontend

Open another terminal and navigate to the frontend folder:

```bash
cd student-frontend
npm install
npx expo start
```

Follow the Expo instructions to open the application on your device or supported emulator.

### 3. Database

The backend connects to MongoDB running at:

`mongodb://localhost:27017`

Database name: `student_management`

Collection name: `students`

## 🧪 API Testing

The backend REST APIs were tested using Postman for CRUD operations:

- **Create** student records
- **Read** student records
- **Update** student records
- **Delete** student records

## 🎯 Project Objective

The objective of this project is to gain practical experience in mobile application development, REST API development, database integration, and connecting a frontend application to a backend service.

## 👨‍💻 Author

Developed as a hands-on software development project.

## 🔗 GitHub Repository

[Student Management App](https://github.com/Abhishek045024/student-management-app)
