# CodeQuest Roles & Permissions Specification

## User Roles

| Role ID | Role Name | Description |
|---------|-----------|-------------|
| 1 | Student | End users who attempt quizzes and view their results |
| 2 | Professor | Faculty who create/manage assessments and view class analytics |
| 3 | Sub Admin | Limited admin with view-only access and basic user management |
| 4 | Admin | System administrators with full platform control |
| 5 | Super Admin | Top-level admin with ability to manage other admins |

## Feature Access Matrix

| Feature | Student | Professor | Sub Admin | Admin | Super Admin |
|---------|:-------:|:---------:|:---------:|:-----:|:-----------:|
| **Dashboard** | ✅ Personal | ✅ Class | ✅ System | ✅ System | ✅ System |
| **Attempt Quizzes** | ✅ | ✗ | ✗ | ✗ | ✗ |
| **View Results** | ✅ Own | ✅ Class | ✅ All | ✅ All | ✅ All |
| **Create Assessments** | ✗ | ✅ | ✗ | ✗ | ✅ |
| **Question Bank** | ✗ | ✅ | ✗ | ✗ | ✅ |
| **User Management** | ✗ | ✗ | ✅ Limited* | ✅ | ✅ |
| **Admin Management** | ✗ | ✗ | ✗ | ✗ | ✅ |
| **Analytics** | Personal | Class | System | System | System |
| **System Settings** | ✗ | ✗ | ✗ | ✅ | ✅ |
| **System Logs** | ✗ | ✗ | ✅ View | ✅ | ✅ |
| **System Health** | ✗ | ✗ | ✅ View | ✅ | ✅ |
| **Backups** | ✗ | ✗ | ✗ | ✅ | ✅ |
| **Live Monitor** | ✗ | ✅ | ✗ | ✗ | ✅ |
| **Leaderboard** | ✅ | ✅ | ✅ | ✅ | ✅ |

*Sub Admin can only manage Students and Professors, not Admin-level users

## Role Details

### Student (Role ID: 1)
**Navigation:** Dashboard, Assessments, Submissions, Leaderboard, Profile
- Can attempt quizzes and questions
- Can view own submissions and results
- Cannot see draft assessments
- Cannot create or modify assessments

### Professor (Role ID: 2)
**Navigation:** Dashboard, Assessments, Create Assessment, Question Bank, Live Monitor, Analytics, Leaderboard, Group Setup, Plagiarism
- Can create and manage assessments
- Can add/remove/edit questions
- Can toggle question visibility
- Can view class analytics and student submissions

### Sub Admin (Role ID: 3)
**Navigation:** Dashboard, User Management, Analytics, System Health, System Logs
- Limited user management (students/professors only)
- View-only access to system logs and health
- Cannot access Settings, Backups, or Admin Management
- Cannot create assessments

### Admin (Role ID: 4)
**Navigation:** Dashboard, User Management, Analytics, System Health, System Logs, Backups, Settings
- Full user management (except other admins)
- Can configure platform settings
- Can manage backups
- Cannot manage other admin accounts

### Super Admin (Role ID: 5)
**Navigation:** Dashboard, User Management, Admin Management, Analytics, Question Bank, Assessments, System Health, System Logs, Backups, Settings
- **Full access to all features**
- Can manage all user types including admins
- Has dedicated Admin Management page
- Can create assessments and access question bank
- Has all professor AND admin capabilities

## Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Student | alex@university.edu | (any 6+ chars) |
| Professor | turing@university.edu | (any 6+ chars) |
| Sub Admin | subadmin@university.edu | (any 6+ chars) |
| Admin | admin@university.edu | (any 6+ chars) |
| Super Admin | superadmin@university.edu | (any 6+ chars) |

## Implementation Details

### Permission System
Centralized in `types.ts`:
- `RolePermissions` interface defines all permission flags
- `ROLE_PERMISSIONS` constant maps each role to its permissions
- `hasPermission()` helper in `AppContext.tsx` for easy permission checking

### Route Protection
- `ProtectedRoute.tsx` supports both `requiredRole` and `allowedRoles` props
- Admin routes allow `admin`, `subadmin`, and `superadmin`
- Each role gets appropriate navigation based on permissions

### Component-Level Enforcement
- **UserManagement**: Sub Admin sees only students/professors
- **AdminManagement**: Super Admin exclusive page
- **AllAssessments**: Students cannot see draft assessments
- **Layout**: Dynamic navigation based on role