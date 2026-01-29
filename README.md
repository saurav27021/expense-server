# 💸 Expense App (MERN Stack)

An **Expense Management Application** built while learning the **MERN Stack**.  
This project helps users **register, login, and manage expenses** efficiently while practicing real-world backend and frontend concepts.

---

## 🚀 Features

- 🔐 User Authentication (Register & Login)
- 🔑 Secure password hashing using **bcrypt**
- 🗄️ MongoDB database integration
- 📦 RESTful APIs using **Express & Node.js**
- 🧱 Clean MVC-based project structure
- 🌱 Environment variable support with **dotenv**
- 🧪 API tested using **Postman**

---

## 🛠️ Tech Stack

### Frontend (Coming Soon)
- React.js
- Axios
- CSS / Tailwind (planned)

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- bcryptjs

### Tools
- Git & GitHub
- Postman
- MongoDB Compass
- VS Code

---

## 📁 Project Structure
```
Expense-App
└── Expense-Server
├── src
│ ├── controllers
│ │ └── authController.js
│ ├── dao
│ │ └── userDao.js
│ ├── model
│ │ └── user.js
│ └── routes
│ └── authRoutes.js
├── .env
├── server.js
├── package.json
└── README.md

```



## 🔐 Authentication APIs

### ▶ Register User
**POST** `/auth/register`

```json
{
  "name": "prince",
  "email": "prince@gmail.com",
  "password": "123456"
}
```
### ▶ Login User
**POST** `/auth/login`

```json
{
  "email": "prince@gmail.com",
  "password": "123456"
}
```
## ⚙️ Environment Variables
Create a .env file in the root directory:
env
```
MONGO_DB_CONNECTION_URI=mongodb://127.0.0.1:27017/Expense-App
```
### ▶️ How to Run the Project  

### 1️⃣ Clone the repository


```git clone https://github.com/USERNAME/REPO_NAME.git```  

### 2️⃣ Navigate to backend folder

```
cd Expense-Server
```
### 3️⃣ Install dependencies

```
npm install
```
### 4️⃣ Start the server

```
npm start
```

Server will run on:```http://localhost:5001```

## 🧠 Learning Outcomes

- Understanding **MERN project structure**
- Implementing **authentication logic**
- Handling **errors & validations**
- Working with **MongoDB & Mongoose**
- Writing **clean and reusable backend code**

---

## 🔮 Future Enhancements

- ➕ Add expense CRUD operations
- 📊 Expense analytics & charts
- 🔐 JWT-based authentication
- 🎨 Frontend with React
- 📱 Responsive UI

---

## 👨‍💻 Author

**Prince Verma**  
📌 Learning MERN Stack through real-world projects  

---

⭐ If you like this project, don’t forget to **star the repository**!
