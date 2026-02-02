# NexHR System Documentation

## 1. System Overview
NexHR is a comprehensive Human Resource Management System (HRMS) designed to streamline HR operations, finance management, and employee administrative tasks. It features role-based access control, dynamic dashboards, and integrated modules for detailed workflows.

## 2. User Roles & Permissions
The system defines several core roles, each with specific access privileges:
- **Admin**: Full system access, including role management and system settings.
- **HR Manager**: Focuses on Hiring, Employee Management, and Attendance.
- **Finance Manager**: Manages Payroll, Expenses, Loans, and Financial Reporting.
- **Employee**: Access to self-service portal (Attendance, Leave, Payslips, Tasks).

*Note: Roles and permissions are dynamically managed via the `Roles & Permissions` module, allowing custom fine-tuning.*

## 3. Main Modules & Workflows

### 3.1. Hiring Module
The Hiring module follows a linear recruitment lifecycle:
1.  **Post Job**:
    *   HR creates a new job posting (`/jobs/create`).
    *   Defines General Info, Application Form schema, and Interview Stages.
2.  **Screening Console**:
    *   (`hiring/job-screening`): HR views applicants in a Kanban-style or list view.
    *   Candidates are moved through stages (Applied, Screened, Interview, Offer, Hired).
3.  **Interview Scheduling**:
    *   (`/assessment-interview`): HR schedules interviews for candidates.
    *   Interviewers (Employees) receive notifications/tasks.
4.  **Conduct & Score**:
    *   (`/hiring/interview`): Interviewers score candidates during or after interviews.
5.  **Review Offer Letters**:
    *   (`/hiring/review-offers`): Final step to generate and send offer letters.
6.  **Onboarding**:
    *   (`/onboarding`): Hired candidates are converted to employees with initial setup.

### 3.2. Finance & Payroll Module
Designed for the Finance Manager to handle compensation and disbursements.
1.  **Finance Dashboard**:
    *   (`/finance`): High-level view of pending disbursements, recent transactions, and payroll trends.
2.  **Salary Structures**:
    *   (`/salary-structures`): Define base salary, allowances, and deductions templates.
    *   Assign structures to employees.
3.  **Payroll Processing**:
    *   (`/payroll`):
        *   **Generate**: Select a month and year to generate payroll for eligible employees.
        *   **Review**: Check calculated net pay, tax, and deductions.
        *   **Approve/Finalize**: Lock the payroll for the period.
4.  **Bulk Payments**:
    *   (`/bulk-payments`): Integration (e.g., Stripe) to disburse salaries in batches.
5.  **Expenses & Loans**:
    *   **Expenses** (`/expenses`): Employees submit claims; Finance reviews/approves.
    *   **Loans** (`/loans`): Manage employee loan requests, approvals, and repayment tracking.

### 3.3. Attendance & Leave Module
1.  **Employee Actions**:
    *   **Check-in/out**: Dashboard widget using Geofencing (Lat/Long) and optionally Face Registration (`/register-face`).
    *   **Leave Request**: Apply for leave via `Attendance & Leave`.
2.  **HR Management**:
    *   **Attendance Management** (`/attendance-management`): View daily/monthly attendance logs.
    *   **Face Register**: Enforce face registration for security.

### 3.4. Organization & Teams
1.  **Employees**:
    *   (`/employees`): Master directory of all staff. Add/Edit employee details.
2.  **Branches & Departments**:
    *   (`/branches-departments`): Configure organizational hierarchy.
3.  **Resource Allocation**:
    *   (`/resource-allocation`): View or assign employees to projects/teams.

### 3.5. Employee Self-Service (ESS)
Employees have a dedicated view to manage their personal work life:
- **Dashboard**: Quick actions for attendance and task overview.
- **My Tasks**: (`/my-tasks`) Assigned tasks (e.g., Interview feedback, simplified to-dos).
- **Payslips**: (`/payslips`) View and download generated salary slips.
- **Bank Info**: (`/bank-info`) Manage personal bank details for salary credit.
- **Salary Structure**: (`/employee-salary-structure`) View their own breakdown.

## 4. Technical Architecture

### Frontend
- **Framework**: React (Vite) with TypeScript.
- **Styling**: Tailwind CSS for responsive design.
- **State Management**: Redux Toolkit (presues auth state, permissions).
- **Routing**: React Router with Role-Based Route Guards (`RoleBasedRoute.tsx`).

### Backend (Contextual)
- **API**: The frontend consumes RESTful APIs (Django/Python based on referenced docs).
- **Authentication**: JWT-based auth flow.
- **Geo-Services**: Integration for location-based attendance.

## 5. Key Directory Structure
- `src/components`: Reusable UI components and feature-specific widgets.
    - `financeDashboard/`: Components for payroll and finance.
    - `hiring/`: Components for recruitment flow.
    - `sidebar/`: Navigation logic (`sidebarItems.ts` defines the menu structure).
- `src/pages`: Top-level page components corresponding to routes.
- `src/store`: Redux slices and store configuration.
- `src/services`: API service calls organized by domain.
