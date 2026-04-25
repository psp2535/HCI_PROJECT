# 🎓 ABV-IIITM online Semester Registration System

A comprehensive web-based semester registration and management system for ABV-Indian Institute of Information Technology and Management (ABV-IIITM). This system streamlines the entire student registration process, from course selection to fee payment and verification.

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#️-tech-stack)
- [System Architecture](#️-system-architecture)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#️-configuration)
- [Running the Application](#-running-the-application)
- [User Roles](#-user-roles)
- [API Documentation](#-api-documentation)
- [Project Structure](#-project-structure)
- [Screenshots](#-screenshots)
- [Contributing](#-contributing)
- [Bug Reports](#-bug-reports)
- [License](#-license)
- [Authors](#-authors)
- [Acknowledgments](#-acknowledgments)
- [Support](#-support)
- [Future Enhancements](#-future-enhancements)

## ✨ Features

### For Students
- 📝 **Student Registration & Authentication** - Secure login and registration system
- 📚 **Subject Selection** - Browse and select courses for the semester
- 💳 **Fee Payment** - Online payment processing for academic and mess fees
- 🧾 **Receipt Generation** - Automatic PDF receipt generation after payment
- 👤 **Profile Management** - View and update student profile information
- 📊 **Dashboard** - Comprehensive overview of registration status

### For Faculty
- 👨‍🏫 **Faculty Dashboard** - Manage courses and view enrolled students
- 📋 **Student Management** - View student registrations and course enrollments
- ✅ **Course Approval** - Approve or reject student course selections

### For Verification Team
- 🔍 **Document Verification** - Review and verify student documents
- ✔️ **Registration Approval** - Approve or reject student registrations
- 📄 **Document Management** - View uploaded documents and certificates

### For Administrators
- 🎛️ **Admin Dashboard** - Complete system overview and analytics
- 👥 **User Management** - Manage students, faculty, and staff accounts
- 📈 **Reports & Analytics** - Generate reports and view system statistics
- ⚙️ **System Configuration** - Configure system settings and parameters

## 🛠️ Tech Stack

### Frontend
- **React 19** - Modern UI library
- **Vite** - Fast build tool and development server
- **React Router DOM** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **Axios** - HTTP client
- **Lucide React** - Icon library
- **React Hot Toast** - Toast notifications
- **Recharts** - Data visualization
- **jsPDF** - PDF generation

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **PDFKit** - Server-side PDF generation
- **Multer** - File upload handling
- **CORS** - Cross-origin resource sharing

## 🏗️ System Architecture

```
┌─────────────────┐
│   React Client  │
│   (Port 5173)   │
└────────┬────────┘
         │
         │ HTTP/REST API
         │
┌────────▼────────┐
│  Express Server │
│   (Port 5000)   │
└────────┬────────┘
         │
         │ Mongoose ODM
         │
┌────────▼────────┐
│   MongoDB       │
│   Database      │
└─────────────────┘
```

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (v6 or higher) - [Download](https://www.mongodb.com/try/download/community)
- **npm** or **yarn** - Package manager (comes with Node.js)
- **Git** - Version control system

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/psp2535/HCI_PROJECT.git
cd HCI_PROJECT
```

### 2. Install Server Dependencies

```bash
cd server
npm install
```

### 3. Install Client Dependencies

```bash
cd ../client
npm install
```

## ⚙️ Configuration

### Server Configuration

Create a `.env` file in the `server` directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGO_URI=mongodb://127.0.0.1:27017/abviiitm-registration

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
JWT_EXPIRE=7d

# Client URL (for CORS)
CLIENT_URL=http://localhost:5173

# File Upload Configuration
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,application/pdf
```

### Client Configuration

Update the API base URL in `client/src/utils/api.js` if needed:

```javascript
const API_BASE_URL = 'http://localhost:5000/api';
```

## 🏃 Running the Application

### Start MongoDB

Make sure MongoDB is running on your system:

```bash
# Windows
mongod

# macOS/Linux
sudo systemctl start mongod
```

### Start the Backend Server

```bash
cd server
npm run dev
```

The server will start on `http://localhost:5000`

### Start the Frontend Client

Open a new terminal:

```bash
cd client
npm run dev
```

The client will start on `http://localhost:5173`

### Access the Application

Open your browser and navigate to:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000/api/health

## 👥 User Roles

The system supports four user roles:

### 1. Student
- **Default Credentials**: Create new account via registration
- **Capabilities**: Course selection, fee payment, profile management

### 2. Faculty
- **Role**: `faculty`
- **Capabilities**: View students, manage courses, approve registrations

### 3. Verification Team
- **Role**: `verification`
- **Capabilities**: Verify documents, approve/reject registrations

### 4. Administrator
- **Role**: `admin`
- **Capabilities**: Full system access, user management, analytics

## 📡 API Documentation

### Authentication Endpoints

```
POST   /api/auth/register          - Register new student
POST   /api/auth/login             - User login
GET    /api/auth/me                - Get current user
POST   /api/auth/logout            - User logout
```

### Student Endpoints

```
GET    /api/student/profile        - Get student profile
PUT    /api/student/profile        - Update student profile
GET    /api/student/registrations  - Get student registrations
POST   /api/student/register       - Submit registration
```

### Subject Endpoints

```
GET    /api/subjects               - Get all subjects
GET    /api/subjects/:id           - Get subject by ID
POST   /api/subjects               - Create new subject (Admin)
PUT    /api/subjects/:id           - Update subject (Admin)
DELETE /api/subjects/:id           - Delete subject (Admin)
```

### Payment Endpoints

```
POST   /api/payment/process        - Process payment
GET    /api/payment/history        - Get payment history
GET    /api/payment/:id            - Get payment details
```

### Receipt Endpoints

```
GET    /api/receipt/:id            - Get receipt
POST   /api/receipt/generate       - Generate receipt PDF
GET    /api/receipt/download/:id   - Download receipt
```

### Verification Endpoints

```
GET    /api/verification/pending   - Get pending verifications
PUT    /api/verification/:id       - Update verification status
GET    /api/verification/stats     - Get verification statistics
```

### Faculty Endpoints

```
GET    /api/faculty/students       - Get enrolled students
GET    /api/faculty/courses        - Get assigned courses
PUT    /api/faculty/approve/:id    - Approve student registration
```

### Admin Endpoints

```
GET    /api/admin/dashboard        - Get dashboard statistics
GET    /api/admin/users            - Get all users
POST   /api/admin/users            - Create new user
PUT    /api/admin/users/:id        - Update user
DELETE /api/admin/users/:id        - Delete user
GET    /api/admin/reports          - Generate reports
```

## 📁 Project Structure

```
HCI_PROJECT/
├── client/                      # Frontend React application
│   ├── public/                  # Static assets
│   │   ├── favicon.svg
│   │   └── icons.svg
│   ├── src/
│   │   ├── assets/              # Images and media
│   │   ├── components/          # React components
│   │   │   ├── AdminLayout.jsx
│   │   │   ├── FacultyLayout.jsx
│   │   │   ├── StudentLayout.jsx
│   │   │   ├── VerificationLayout.jsx
│   │   │   └── AIChat.jsx
│   │   ├── context/             # React context
│   │   │   └── AuthContext.jsx
│   │   ├── pages/               # Page components
│   │   │   ├── admin/
│   │   │   ├── faculty/
│   │   │   ├── student/
│   │   │   ├── verification/
│   │   │   ├── LoginPage.jsx
│   │   │   └── RegisterPage.jsx
│   │   ├── utils/               # Utility functions
│   │   │   └── api.js
│   │   ├── App.jsx              # Main App component
│   │   ├── main.jsx             # Entry point
│   │   └── index.css            # Global styles
│   ├── package.json
│   ├── vite.config.js
│   └── eslint.config.js
│
├── server/                      # Backend Node.js application
│   ├── middleware/              # Express middleware
│   │   └── auth.js
│   ├── models/                  # Mongoose models
│   │   ├── Student.js
│   │   ├── Staff.js
│   │   ├── Subject.js
│   │   ├── Registration.js
│   │   ├── Payment.js
│   │   └── Receipt.js
│   ├── routes/                  # API routes
│   │   ├── auth.js
│   │   ├── student.js
│   │   ├── subject.js
│   │   ├── payment.js
│   │   ├── receipt.js
│   │   ├── verification.js
│   │   ├── faculty.js
│   │   └── admin.js
│   ├── uploads/                 # Uploaded files
│   ├── receipts/                # Generated receipts
│   ├── index.js                 # Server entry point
│   ├── package.json
│   └── .env                     # Environment variables
│
├── .gitignore                   # Git ignore rules
└── README.md                    # This file
```

## 📸 Screenshots

### Student Dashboard
![Student Dashboard](https://via.placeholder.com/800x400?text=Student+Dashboard)

### Subject Selection
![Subject Selection](https://via.placeholder.com/800x400?text=Subject+Selection)

### Payment Processing
![Payment Processing](https://via.placeholder.com/800x400?text=Payment+Processing)

### Admin Dashboard
![Admin Dashboard](https://via.placeholder.com/800x400?text=Admin+Dashboard)

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Coding Standards

- Follow ESLint configuration
- Use meaningful variable and function names
- Write comments for complex logic
- Keep components small and focused
- Write clean, maintainable code

## 🐛 Bug Reports

If you find a bug, please create an issue with:
- Clear description of the bug
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots (if applicable)

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Authors

- **Your Name** - *Initial work* - [psp2535](https://github.com/psp2535)

## 🙏 Acknowledgments

- ABV-Indian Institute of Information Technology and Management
- All contributors who helped with this project
- Open source community for amazing tools and libraries

## 📞 Support

For support, email your-email@example.com or create an issue in the repository.

## 🔮 Future Enhancements

- [ ] Email notifications for registration status
- [ ] SMS alerts for important updates
- [ ] Mobile application (React Native)
- [ ] Advanced analytics and reporting
- [ ] Integration with payment gateways
- [ ] Multi-language support
- [ ] Dark mode theme
- [ ] Export data to Excel/CSV
- [ ] Real-time chat support
- [ ] Automated backup system

---

**Made with ❤️ for ABV-IIITM**
