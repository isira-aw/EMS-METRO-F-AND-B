# EMS METRO F&B - Employee Management System

A full-stack employee management system for Metro F&B with a modern web interface and robust backend.

## Project Structure

This is a monorepo containing two main applications:

```
EMS-METRO-F-AND-B/
├── front-e/          # Next.js frontend application
├── back-e/           # Spring Boot backend application
└── docker-compose.yml # Docker setup for development
```

## Technology Stack

### Frontend (front-e)
- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Query (@tanstack/react-query)
- **HTTP Client**: Axios
- **Form Handling**: React Hook Form
- **UI Components**: Lucide React icons, Recharts
- **Date Utilities**: date-fns

### Backend (back-e)
- **Framework**: Spring Boot 3.2.0
- **Language**: Java 17
- **Build Tool**: Maven
- **Database**: PostgreSQL
- **Security**: Spring Security with JWT
- **ORM**: Spring Data JPA
- **Additional**: Spring Mail, Lombok, Validation

## Getting Started

### Prerequisites

- Node.js 18+ and npm (for frontend)
- Java 17+ and Maven (for backend)
- PostgreSQL 14+ (or use Docker)
- Docker and Docker Compose (optional, for containerized setup)

### Environment Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd EMS-METRO-F-AND-B
```

2. Set up environment variables:
   - Copy `.env.example` to `.env` in both `front-e/` and `back-e/` directories
   - Update the values according to your local setup

### Frontend Setup

```bash
cd front-e
npm install
npm run dev
```

The frontend will be available at `http://localhost:3000`

### Backend Setup

```bash
cd back-e
mvn clean install
mvn spring-boot:run
```

The backend API will be available at `http://localhost:8080`

### Docker Setup (Recommended for Development)

Run the entire stack with Docker Compose:

```bash
docker-compose up -d
```

This will start:
- PostgreSQL database
- Spring Boot backend
- Next.js frontend

## Development

### Frontend Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Backend Commands

- `mvn clean install` - Build the project
- `mvn spring-boot:run` - Run the application
- `mvn test` - Run tests
- `mvn clean package` - Package as JAR

## Project Features

- Employee Management (CRUD operations)
- Authentication & Authorization (JWT-based)
- Role-based Access Control
- Dashboard with Analytics
- Responsive UI Design
- RESTful API

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

[Add your license information here]
