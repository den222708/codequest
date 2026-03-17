# CodeQuest Roles & Permissions Specification

## User Roles

| Role ID | Role Name | Description |
|---------|-----------|-------------|
| 1 | Student | End users who attempt quizzes and view their results |
| 2 | Professor | Faculty who create/manage assessments and view class analytics |
| 3 | Admin | System administrators with full platform control |

> **Note:** The original spec included Sub Admin and Super Admin roles. These were consolidated into a single Admin role to match the backend's 3-role model (`student`, `teacher`/`professor`, `admin`). Backend stores `teacher`; frontend displays `professor`.

## Feature Access Matrix

| Feature | Student | Professor | Admin |
|---------|:-------:|:---------:|:-----:|
| **Dashboard** | Personal | Class | System |
| **Attempt Quizzes** | Yes | No | No |
| **View Results** | Own | Class | All |
| **Create Assessments** | No | Yes | No |
| **Question Bank** | No | Yes | No |
| **User Management** | No | No | Yes |
| **Admin Management** | No | No | Yes |
| **Analytics** | Personal | Class | System |
| **System Settings** | No | No | Yes |
| **System Logs** | No | No | Yes |
| **System Health** | No | No | Yes |
| **Backups** | No | No | Yes |
| **Live Monitor** | No | Yes | No |
| **Leaderboard** | Yes | Yes | Yes |

## Role Details

### Student
**Navigation:** Dashboard, Assessments, Submissions, Leaderboard, Profile
- Can attempt quizzes and questions
- Can view own submissions and results
- Cannot see draft assessments
- Cannot create or modify assessments

### Professor
**Navigation:** Dashboard, Assessments, Create Assessment, Question Bank, Live Monitor, Analytics, Leaderboard, Group Setup, Plagiarism
- Can create and manage assessments
- Can add/remove/edit questions
- Can toggle question visibility
- Can view class analytics and student submissions

### Admin
**Navigation:** Dashboard, User Management, Admin Management, Analytics, System Health, System Logs, Backups, Settings, Notifications
- Full user management
- Can configure platform settings
- Can manage backups and system health
- Can view system logs and analytics

## Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Student | alex@university.edu | 8+ chars with complexity |
| Professor | turing@university.edu | 8+ chars with complexity |
| Admin | admin@university.edu | 8+ chars with complexity |

## Implementation Details

### Permission System
Centralized in `types.ts`:
- `RolePermissions` interface defines all permission flags
- `ROLE_PERMISSIONS` constant maps each role to its permissions
- `hasPermission()` helper in `AppContext.tsx` for easy permission checking

### Route Protection
- `ProtectedRoute.tsx` supports both `requiredRole` and `allowedRoles` props
- Admin routes require `admin` role
- Each role gets appropriate navigation based on permissions

### Backend Role Mapping
- Backend (Supabase): `student`, `teacher`, `admin`
- Frontend (types.ts): `student`, `professor`, `admin`
- Translation: `authService.mapUser()` converts `teacher` to `professor`

### Component-Level Enforcement
- **UserManagement**: Admin manages all users
- **AdminManagement**: Admin-only page
- **AllAssessments**: Students cannot see draft assessments
- **Layout**: Dynamic navigation based on role
