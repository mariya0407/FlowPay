# FlowPay

FlowPay is a comprehensive reimbursement and expense management application designed to streamline internal financial operations. It features a modern, responsive frontend and a robust backend to handle user authentication, role-based access control, expense tracking, and approval workflows.

## Architecture

The project is divided into two primary workspaces:
*   `frontend`: A Next.js application handling the user interface and client-side logic.
*   `backend`: A Next.js API-based backend managing database interactions, business logic, and authentication.

## Technologies Used

### Frontend
*   **Framework:** Next.js
*   **Styling:** Tailwind CSS
*   **UI Components:** Radix UI Primitives, Lucide React
*   **State Management:** Zustand
*   **Form Handling and Validation:** React Hook Form, Zod
*   **Charts:** Recharts
*   **Date Formatting:** date-fns, react-day-picker

### Backend
*   **Framework:** Next.js (API Routes)
*   **Database:** PostgreSQL
*   **ORM:** Prisma
*   **Authentication:** JSON Web Tokens (JWT), bcryptjs

## Getting Started

### Prerequisites
*   Node.js (Latest LTS recommended)
*   PostgreSQL database instance

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/mariya0407/FlowPay.git
    cd FlowPay
    ```

2.  Install frontend dependencies:
    ```bash
    cd frontend
    npm install
    ```

3.  Install backend dependencies:
    ```bash
    cd ../backend
    npm install
    ```

### Configuration

#### Backend
1.  Navigate to the `backend` directory.
2.  Create a `.env` file based on configuration requirements.
3.  Configure your `DATABASE_URL` with your PostgreSQL connection string.
4.  Run Prisma migrations to synchronize the database schema:
    ```bash
    npx prisma migrate dev
    ```
5.  (Optional) Seed the database:
    ```bash
    npm run prisma:seed
    ```

#### Frontend
1.  Navigate to the `frontend` directory.
2.  Create a `.env` file and configure necessary environment variables (e.g., API bases, Firebase keys if applicable).

### Running the Application

1.  Start the backend development server:
    ```bash
    cd backend
    npm run dev
    ```

2.  Start the frontend development server:
    ```bash
    cd frontend
    npm run dev
    ```

The frontend application will be available at `http://localhost:9002` (or the port specified). 

## Project Structure

*   **/frontend:** Client-side Next.js code including components, pages, context, and utilities.
*   **/backend:** Server-side logic, Prisma schemas (`prisma/schema.prisma`), API routes, and database configuration.
*   **/Expense Approval ER Diagram.png:** Entity-Relationship diagram illustrating the database schema.
*   **/Expense management - 8 hours.png:** Project documentation.
*   **/Reimbursement management.pdf:** Functional requirements or business logic documentation.


