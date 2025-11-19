Presence - Attendance Management System
=======================================

A comprehensive attendance management system built with Node.js, Express, and TypeScript. This application provides real-time attendance tracking with location verification, field trip management, and administrative reporting capabilities.

📋 Table of Contents
--------------------

*   [Features](#-features)
    
*   [Tech Stack](#-tech-stack)
    
*   [Prerequisites](#-prerequisites)
    
*   [Installation](#-installation)
    
*   [Configuration](#-configuration)
    
*   [Database Setup](#-database-setup)
    
*   [Running the Application](#-running-the-application)
    
*   [Project Structure](#-project-structure)
    
*   [API Documentation](#-api-documentation)
    
*   [Authentication](#-authentication)
    
*   [Cron Jobs](#-cron-jobs)
    
*   [Contributing](#-contributing)
    
*   [License](#-license)
    

✨ Features
----------

### Core Functionality

*   **Real-time Attendance Tracking**: Check-in/check-out system with timestamp recording
    
*   **Location Verification**: GPS-based location tracking with reverse geocoding
    
*   **Multi-media Support**: Photo and audio recording capabilities for attendance verification
    
*   **Calendar Management**: Automated holiday and weekend tracking
    
*   **Field Trip Management**: Special attendance handling for off-campus activities
    

### User Roles

*   **Employees**: Record attendance, view personal attendance history
    
*   **Principal Investigators (PIs)**: Monitor team attendance, submit reports to HR
    
*   **HR Administrators**: Request attendance data, generate comprehensive reports
    

### Advanced Features

*   **Active Directory Integration**: Secure LDAP authentication
    
*   **Flexible Authentication**: Support for both JWT and SSO
    
*   **Automated Processing**: Auto-completion of attendance at 11 PM daily
    
*   **Data Export**: CSV report generation for attendance records
    
*   **Dual Database Architecture**: Separation of attendance and staff data
    

🛠 Tech Stack
-------------

### Backend

*   **Runtime**: Node.js
    
*   **Framework**: Express.js 5.x
    
*   **Language**: TypeScript
    
*   **ORM**: Prisma 6.x
    
*   **Database**: MySQL
    

### Authentication & Security

*   **LDAP**: ldapts for Active Directory integration
    
*   **JWT**: jsonwebtoken for token-based authentication
    
*   **Password Hashing**: bcrypt
    

### Additional Libraries

*   **File Upload**: Multer
    
*   **Scheduling**: node-cron
    
*   **Location Services**: Axios with OpenStreetMap Nominatim API
    
*   **CSV Generation**: csv-writer
    
*   **CORS**: cors middleware
    

📦 Prerequisites
----------------

Before you begin, ensure you have the following installed:

*   **Node.js**: v18.x or higher
    
*   **npm**: v9.x or higher
    
*   **MySQL**: v8.x or higher
    
*   **Active Directory Server** (for authentication)
    

🚀 Installation
---------------

1.  **Clone the repository**
    

bash

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   git clone   cd presence   `

1.  **Install dependencies**
    

bash

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   npm install   `

1.  **Generate Prisma clients**
    

bash

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   npm run prisma:generate   `

⚙️ Configuration
----------------

### Environment Variables

Create a .env file in the project root (/opt/presencedb/.env) with the following variables:

env

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML``   # Database Configuration  DATABASE_URL="mysql://user:password@host:port/presence_db"  STAFF_DATABASE_URL="mysql://user:password@host:port/staff_view_db"  # Active Directory Configuration  AD_SERVER="your-ad-server.domain.com"  AD_PORT="636"  AD_DOMAIN="your-domain.com"  AD_TIMEOUT="5000"  # Server Configuration  PORT="3000"  NODE_ENV="development"  # File Upload Configuration  UPLOAD_DIR="uploads"  UPLOAD_PATH="/uploads"  MAX_FILE_SIZE="10485760"  # JWT Configuration  JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"  ```  ### SSL Certificates for LDAPS  Place your certificate chain in the `certs` directory:  ```  certs/  ├── intermediate-ca.pem  └── root-ca.pem   ``

🗄️ Database Setup
------------------

### 1\. Create Databases

sql

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   CREATE DATABASE presence_db;  CREATE DATABASE staff_view_db;   `

### 2\. Run Prisma Migrations

bash

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   # Generate Prisma clients  npm run prisma:generate  # Run migrations (if using Prisma Migrate)  # npx prisma migrate dev --schema=./prisma/presence.prisma   `

### 3\. Seed Data

bash

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   # Seed calendar with weekends  npm run seed:calendar  # Seed holidays  npm run seed:holidays  # Additional seeding scripts (if needed)  npm run seed:users  npm run seed:pis   `

🎯 Running the Application
--------------------------

### Development Mode

bash

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   npm run dev   `

### Production Mode

bash

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML``   # Build TypeScript  npm run build  # Start server  npm start  # or  npm run start:prod  ```  ### Server will be available at:  - Local: `http://localhost:3000`  - Network: `http://your-ip:3000`  ## 📁 Project Structure  ```  presence/  ├── certs/                      # SSL certificates for LDAPS  ├── generated/                  # Generated Prisma clients  │   ├── presence/  │   └── staff_view/  ├── prisma/                     # Prisma schema files  │   ├── presence.prisma  │   └── staff_view.prisma  ├── src/  │   ├── config/                 # Configuration files  │   │   └── db.ts              # Database connections  │   ├── controllers/            # Request handlers  │   │   ├── attendance.controller.ts  │   │   ├── calendar.controller.ts  │   │   ├── hr.controller.ts  │   │   ├── pi.controller.ts  │   │   ├── profile.controller.ts  │   │   ├── user.controller.ts  │   │   └── userLocation.controller.ts  │   ├── middleware/             # Express middleware  │   │   └── auth.ts            # Authentication middleware  │   ├── routes/                 # API routes  │   │   ├── attendance.route.ts  │   │   ├── calendar.route.ts  │   │   ├── hr.route.ts  │   │   ├── pi.routes.ts  │   │   ├── profile.route.ts  │   │   ├── user.route.ts  │   │   └── userLocation.route.ts  │   ├── scripts/                # Utility scripts  │   │   ├── seed-calendar.ts  │   │   └── seed-holidays.ts  │   ├── services/               # Business logic  │   │   ├── adAuthService.ts   # Active Directory authentication  │   │   └── cronJobs.ts        # Scheduled tasks  │   ├── shared/                 # Shared state and types  │   │   └── state.ts  │   ├── types/                  # TypeScript type definitions  │   │   └── express.d.ts  │   ├── utils/                  # Utility functions  │   │   ├── fileUpload.ts  │   │   ├── folderUtils.ts  │   │   └── jwt.ts  │   └── index.ts               # Application entry point  ├── uploads/                    # User-uploaded files  ├── .env                        # Environment variables  ├── .gitignore  ├── package.json  ├── tsconfig.json  └── README.md  ```  ## 📚 API Documentation  ### Base URL  ```  http://localhost:3000/api   ``

### Authentication Endpoints

#### Login

http

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   POST /api/login  Content-Type: application/json  {    "username": "string",    "password": "string"  }   `

**Response:**

json

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   {    "success": true,    "employeeNumber": "string",    "username": "string",    "empClass": "string",    "projects": [],    "token": "jwt-token",    "message": "Login successful"  }   `

### Attendance Endpoints

#### Create Attendance (Check-in)

http

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   POST /api/attendance  Authorization: Bearer {token}  Content-Type: multipart/form-data  {    "username": "string",    "location": "string",    "latitude": "number",    "longitude": "number",    "audioDuration": "number",    "timestamp": "number",    "photo": "file",    "audio": "file"  }   `

#### Checkout

http

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   POST /api/attendance/checkout  Authorization: Bearer {token}  Content-Type: application/json  {    "employeeNumber": "string"  }   `

#### Get Today's Attendance

http

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   GET /api/attendance/today/:employeeNumber  Authorization: Bearer {token}   `

#### Get Attendance Calendar

http

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   GET /api/attendance/calendar/:employeeNumber?year=2025&month=1  Authorization: Bearer {token}   `

### Calendar Endpoints

#### Get Calendar Data

http

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   GET /api/calendar?year=2025&month=1   `

#### Get Holiday List

http

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   GET /api/calendar/holidays?year=2025   `

### Field Trip Endpoints

#### Save Field Trips

http

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   PUT /api/field-trips  Authorization: Bearer {token}  Content-Type: application/json  {    "employeeNumber": "string",    "fieldTripDates": [      {        "startDate": "2025-01-01",        "endDate": "2025-01-05",        "description": "Conference"      }    ]  }   `

#### Get User Field Trips

http

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   GET /api/user-field-trips/username/:username  Authorization: Bearer {token}   `

#### Get All Active Field Trips

http

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   GET /api/field-trips?date=2025-01-15  Authorization: Bearer {token}   `

### PI Endpoints

#### Get PI Users Attendance

http

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   GET /api/pi/users-attendance?month=1&year=2025  Authorization: Bearer {token}   `

#### Get PI Notifications

http

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   GET /api/pi/notifications  Authorization: Bearer {token}   `

#### Submit Data to HR

http

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   POST /api/pi/submit-data  Authorization: Bearer {token}  Content-Type: application/json  {    "month": 1,    "year": 2025,    "selectedEmployees": ["EMP001", "EMP002"],    "sendAll": false  }   `

### HR Endpoints

#### HR Login

http

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   POST /api/hr/login  Content-Type: application/json  {    "username": "HRUser",    "password": "password"  }   `

#### Get All PIs

http

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   GET /api/hr/pis  Authorization: Bearer {token}   `

#### Request Data from PIs

http

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   POST /api/hr/request-data  Authorization: Bearer {token}  Content-Type: application/json  {    "piUsernames": ["pi1", "pi2"],    "month": 1,    "year": 2025,    "message": "Please submit attendance data"  }   `

#### Get Submission Status

http

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   GET /api/hr/submission-status?month=1&year=2025  Authorization: Bearer {token}   `

#### Download Report

http

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   GET /api/hr/download-report?piUsernames=pi1,pi2&month=1&year=2025  Authorization: Bearer {token}   `

🔐 Authentication
-----------------

The application supports two authentication methods:

### 1\. JWT Authentication

*   Standard token-based authentication
    
*   Token expiry: 30 days
    
*   Include in header: Authorization: Bearer {token}
    

### 2\. SSO Authentication

*   Single Sign-On via custom header
    
*   Include in header: X-SSO-User: {json-data}
    

**SSO Header Format:**

json

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   {    "username": "string",    "projectCodes": ["string"],    "timestamp": 1234567890  }   `

⏰ Cron Jobs
-----------

### Auto-Complete Attendance

*   **Schedule**: Daily at 11:00 PM
    
*   **Function**: Automatically marks incomplete attendance records as FULL\_DAY
    
*   **Purpose**: Ensures all checked-in users are properly recorded even if they forget to check out
    

📊 Database Schema
------------------

### Attendance Table

*   Stores daily attendance records
    
*   Tracks check-in/check-out times
    
*   Records location data and media files
    
*   Session types: FN (Forenoon), AF (Afternoon)
    
*   Attendance types: FULL\_DAY, HALF\_DAY
    

### Calendar Table

*   Manages holidays and weekends
    
*   Used for working day calculations
    

### Field Trip Table

*   Manages off-campus activities
    
*   Auto-marks attendance for active field trips
    

### Staff View (Read-only)

*   Links staff with their Principal Investigators
    
*   Contains employee and project information
    

🔧 Available Scripts
--------------------

json

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   {    "dev": "Development mode with watch",    "build": "Compile TypeScript",    "start": "Production mode",    "start:prod": "Production with tsx",    "seed:calendar": "Seed calendar data",    "seed:holidays": "Seed holiday data",    "prisma:generate": "Generate Prisma clients"  }   `

🌐 Environment-Specific Notes
-----------------------------

### Development

*   Uses tsx watch for hot reloading
    
*   Detailed error logging
    
*   CORS enabled for all origins
    

### Production

*   Set NODE\_ENV=production
    
*   Use compiled JavaScript from dist/
    
*   Configure proper CORS origins
    
*   Use environment-specific database URLs
    

🐛 Troubleshooting
------------------

### Common Issues

**1\. Database Connection Failed**

*   Verify MySQL is running
    
*   Check DATABASE\_URL and STAFF\_DATABASE\_URL
    
*   Ensure databases exist
    

**2\. LDAP Authentication Failed**

*   Verify AD server is reachable
    
*   Check certificate chain in certs/ directory
    
*   Validate AD\_SERVER, AD\_PORT, and AD\_DOMAIN
    

**3\. File Upload Issues**

*   Ensure UPLOAD\_DIR exists and has write permissions
    
*   Check MAX\_FILE\_SIZE configuration
    
*   Verify multer configuration
    

**4\. Missing Environment Variables**

*   Application will exit with error listing missing variables
    
*   Ensure .env file is in the correct location
    

📝 Contributing
---------------

1.  Fork the repository
    
2.  Create a feature branch (git checkout -b feature/amazing-feature)
    
3.  Commit your changes (git commit -m 'Add amazing feature')
    
4.  Push to the branch (git push origin feature/amazing-feature)
    
5.  Open a Pull Request
    

📄 License
----------

This project is licensed under the ISC License.

👥 Authors
----------

Your Organization Name

🙏 Acknowledgments
------------------

*   OpenStreetMap for geocoding services
    
*   Prisma for database ORM
    
*   Express.js community