# UI/UX Mockup Document

## CodeQuest: University Coding Assessment Platform

**Version:** 1.0  
**Last Updated:** January 11, 2026  
**Design Tool:** Figma (recommended)  
**Status:** High-Fidelity Mockups - Ready for Development

---

## Table of Contents

1. [Design System Overview](#1-design-system-overview)
2. [Color Palette & Typography](#2-color-palette--typography)
3. [Component Library](#3-component-library)
4. [User Flows & Wireframes](#4-user-flows--wireframes)
5. [Screen Specifications](#5-screen-specifications)
6. [Responsive Design Guidelines](#6-responsive-design-guidelines)
7. [Accessibility Standards](#7-accessibility-standards)
8. [Design Patterns](#8-design-patterns)
9. [Animation & Interactions](#9-animation--interactions)
10. [Design Tokens](#10-design-tokens)

---

## 1. Design System Overview

### 1.1 Design Philosophy

**Core Principles:**
- **Clarity:** Simple, intuitive interfaces for coding assessments
- **Efficiency:** Minimize friction between student action and code execution
- **Accessibility:** WCAG 2.1 AA compliant for all users
- **Consistency:** Unified visual language across all roles
- **Feedback:** Real-time, meaningful feedback on code submissions

### 1.2 Design Goals

- Create a **professional, educational** atmosphere (not entertainment-focused)
- Support **focused coding sessions** with minimal distractions
- Provide **clear visual hierarchy** for problem statements and code editor
- Enable **quick navigation** between assessments and questions
- Display **meaningful feedback** on test results

---

## 2. Color Palette & Typography

### 2.1 Color System

#### Primary Colors

| Color | Hex | Usage | Contrast Ratio |
|-------|-----|-------|----------------|
| **Teal (Primary)** | #208090 | Buttons, links, highlights | 7.2:1 ✓ |
| **Teal Light** | #32B8C6 | Hover states, backgrounds | 6.1:1 ✓ |
| **Teal Dark** | #1A6873 | Active states, depth | 8.9:1 ✓ |

#### Semantic Colors

| Intent | Light Mode | Dark Mode | Usage |
|--------|-----------|----------|-------|
| **Success** | #22C55E | #4ADE80 | Passing tests, confirmations |
| **Error** | #C01530 | #FF5459 | Failed tests, errors |
| **Warning** | #A84B2F | #E6815F | Warnings, caution states |
| **Info** | #627C85 | #A7A9A9 | Informational messages |

#### Neutral Colors (Light Mode)

| Shade | Hex | Usage |
|-------|-----|-------|
| **White** | #FFFCF9 | Primary backgrounds |
| **Light Gray** | #F5F5F5 | Secondary backgrounds |
| **Medium Gray** | #A7A9A9 | Text secondary |
| **Dark Gray** | #1F2121 | Text primary |

#### Neutral Colors (Dark Mode)

| Shade | Hex | Usage |
|-------|-----|-------|
| **Dark BG** | #1F2121 | Primary backgrounds |
| **Card BG** | #262828 | Secondary backgrounds |
| **Light Gray** | #A7A9A9 | Text secondary |
| **White** | #F5F5F5 | Text primary |

### 2.2 Typography System

#### Font Family

- **Primary Font:** Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
- **Code Font:** "Courier New", Courier, monospace (for code editor)
- **Fallback Stack:** Ensures cross-platform consistency

#### Type Scale

| Level | Size | Weight | Line Height | Usage |
|-------|------|--------|------------|-------|
| **H1** | 30px | 600 (Semibold) | 1.2 | Page titles |
| **H2** | 24px | 600 (Semibold) | 1.2 | Section headers |
| **H3** | 20px | 600 (Semibold) | 1.2 | Subsection headers |
| **H4** | 18px | 500 (Medium) | 1.3 | Small headers |
| **Body Large** | 16px | 400 (Regular) | 1.5 | Primary content |
| **Body Regular** | 14px | 400 (Regular) | 1.5 | Standard text |
| **Body Small** | 12px | 400 (Regular) | 1.4 | Secondary text, labels |
| **Code** | 13px | 400 (Regular) | 1.6 | Code blocks |
| **Caption** | 11px | 400 (Regular) | 1.4 | Meta information |

#### Line Length

- **Optimal:** 50-75 characters per line
- **Maximum:** 120 characters per line
- **Code Editor:** Configurable, typically 100 characters

---

## 3. Component Library

### 3.1 Buttons

#### Button Variants

**Primary Button**
```
State      | Background | Text     | Border
-----------|-----------|----------|--------
Default    | #208090   | White    | None
Hover      | #1A6873   | White    | None
Active     | #166575   | White    | None
Disabled   | #A7A9A9   | #627C85  | None
Focus      | #208090   | White    | 3px teal outline
```

**Secondary Button**
```
State      | Background | Text     | Border
-----------|-----------|----------|--------
Default    | #F5F5F5   | #1F2121  | 1px #A7A9A9
Hover      | #E8E8E8   | #1F2121  | 1px #627C85
Active     | #D0D0D0   | #1F2121  | 1px #627C85
Disabled   | #F5F5F5   | #A7A9A9  | 1px #D0D0D0
```

**Danger Button**
```
State      | Background | Text     | Border
-----------|-----------|----------|--------
Default    | #C01530   | White    | None
Hover      | #A01225   | White    | None
Active     | #801020   | White    | None
Disabled   | #D4B5BA   | #F5F5F5  | None
```

**Button Sizes**
- **Small (sm):** 32px height, 8px vertical padding, 12px horizontal padding
- **Medium (md):** 40px height, 10px vertical padding, 16px horizontal padding
- **Large (lg):** 48px height, 12px vertical padding, 20px horizontal padding

**Button Spacing**
- Icon + Text: 8px gap
- Button Groups: 8px gap between buttons
- Button + Text: 16px margin above/below

### 3.2 Form Elements

#### Input Fields

**States:**
- **Default:** 1px border #A7A9A9, 8px padding, 6px border-radius
- **Focused:** 2px solid border #208090, 3px teal outline
- **Error:** 1px solid border #C01530, error icon, error message below
- **Disabled:** Background #F5F5F5, border #D0D0D0, cursor not-allowed
- **Filled/Readonly:** Background #F5F5F5, border #D0D0D0

**Input Height:** 40px (standard), 48px (large)

**Placeholder Text:** #A7A9A9, italic, opacity 0.7

#### Labels

**Format:**
- **Weight:** 500 (Medium)
- **Size:** 12px
- **Color:** #1F2121
- **Margin Bottom:** 8px
- **Required Indicator:** Asterisk (*) in #C01530, to the right of label

#### Validation Messages

**Error Message:**
- **Color:** #C01530
- **Icon:** ✕ symbol or alert icon
- **Size:** 12px
- **Margin Top:** 4px

**Success Message:**
- **Color:** #22C55E
- **Icon:** ✓ symbol
- **Size:** 12px
- **Margin Top:** 4px

#### Text Area

- **Default Height:** 120px, expandable
- **Max Height:** 400px
- **Font:** 14px monospace for code input
- **Padding:** 12px
- **Border:** 1px solid #A7A9A9

#### Select/Dropdown

- **Height:** 40px
- **Padding:** 10px 12px
- **Border:** 1px solid #A7A9A9
- **Caret:** Positioned right 12px, size 16px
- **Hover:** Border color changes to #627C85
- **Open State:** Border #208090, outline 3px teal

### 3.3 Cards

#### Card Component

**Structure:**
```
┌─────────────────────────────┐
│  Card Header (Optional)     │  ← 16px padding, border-bottom
├─────────────────────────────┤
│                             │
│      Card Body (Content)    │  ← 16px padding
│                             │
├─────────────────────────────┤
│  Card Footer (Optional)     │  ← 16px padding, border-top
└─────────────────────────────┘
```

**Specifications:**
- **Border:** 1px solid #D0D0D0
- **Border Radius:** 8px
- **Background:** White (#FFFCF9)
- **Box Shadow:** 0 1px 3px rgba(0,0,0,0.08)
- **Hover Shadow:** 0 4px 6px rgba(0,0,0,0.12)
- **Padding:** 16px (body), 12px (header/footer)

#### Card Variants

**Outlined Card:**
- Border: 2px solid #208090
- Background: #FFFCF9
- Shadow: None

**Elevated Card:**
- Shadow: 0 4px 6px rgba(0,0,0,0.12)
- Border: None
- Background: White

**Filled Card:**
- Background: #F5F5F5
- Border: None
- Shadow: None

### 3.4 Badges & Status Indicators

#### Badge Component

**Styles:**
```
Success    | Background: #F0FDF4  | Text: #22C55E | Border: 1px #C6E9C9
Error      | Background: #FEF2F2  | Text: #C01530 | Border: 1px #F5D9DD
Warning    | Background: #FFF7ED  | Text: #A84B2F | Border: 1px #FEDD9D
Info       | Background: #F0F4F8  | Text: #627C85 | Border: 1px #D0DFE9
```

**Sizes:**
- **Small:** 20px height, 6px padding, 4px border-radius, 12px font
- **Medium:** 24px height, 8px padding, 6px border-radius, 14px font

#### Status Indicator

**Dot + Label Format:**
- Dot: 8px diameter, inline
- Label: 12px, 8px gap from dot
- Example: ● Passed, ● Failed, ● In Progress

### 3.5 Navigation Components

#### Top Navigation Bar

**Height:** 64px

**Layout:**
```
┌────────────────────────────────────────────────────────────┐
│ [Logo] [Breadcrumb]       [Search] [Notifications] [Avatar]│
└────────────────────────────────────────────────────────────┘
```

**Specifications:**
- **Background:** White (#FFFCF9)
- **Border-Bottom:** 1px solid #D0D0D0
- **Box Shadow:** 0 1px 3px rgba(0,0,0,0.08)
- **Logo Size:** 32px height
- **Padding:** 12px 24px

#### Sidebar Navigation

**Width:**
- **Desktop:** 260px (expanded), 80px (collapsed)
- **Tablet:** Drawer (hidden by default)
- **Mobile:** Bottom navigation bar or side drawer

**Menu Item Height:** 48px

**Submenu Indent:** 16px

**Active State:** 
- Left border: 4px solid #208090
- Background: #F0F8FA
- Font weight: 600

#### Breadcrumb

**Format:** Home > Dashboard > Assessments > Assessment Name

**Styling:**
- **Separator:** "/" or ">" icon, color #A7A9A9
- **Active (Last):** Color #1F2121, weight 500
- **Inactive:** Color #627C85, weight 400, underline on hover
- **Size:** 12px

### 3.6 Tables

#### Table Structure

```
┌──────┬─────────────────┬──────────┬──────────┐
│ Chk  │ Name            │ Status   │ Action   │
├──────┼─────────────────┼──────────┼──────────┤
│ [ ]  │ Problem 1       │ ✓ Passed │ [View]   │
├──────┼─────────────────┼──────────┼──────────┤
│ [ ]  │ Problem 2       │ ✕ Failed │ [View]   │
└──────┴─────────────────┴──────────┴──────────┘
```

**Specifications:**
- **Header Background:** #F5F5F5
- **Header Font:** 12px, weight 600, color #627C85
- **Row Height:** 56px
- **Border:** 1px solid #D0D0D0 (between rows)
- **Padding:** 12px per cell
- **Alternating Rows:** None (maintain white background for clarity)

**Hover State:**
- **Background:** #F9FAFB
- **Cursor:** Pointer
- **Subtle shadow:** 0 1px 2px rgba(0,0,0,0.04)

### 3.7 Modal/Dialog

#### Modal Structure

```
┌─────────────────────────────────────────────┐
│ Modal Title                          [✕]    │  ← Header
├─────────────────────────────────────────────┤
│                                             │
│              Modal Content                  │  ← Body (scrollable)
│                                             │
├─────────────────────────────────────────────┤
│  [Cancel]                        [Confirm]  │  ← Footer
└─────────────────────────────────────────────┘
```

**Specifications:**
- **Width:** 90% (mobile), 600px (tablet), 720px (desktop)
- **Max Height:** 90vh
- **Border Radius:** 8px
- **Background:** White (#FFFCF9)
- **Backdrop:** Solid black, opacity 0.5
- **Header Padding:** 20px
- **Body Padding:** 20px
- **Footer Padding:** 16px, border-top 1px #D0D0D0
- **Box Shadow:** 0 10px 25px rgba(0,0,0,0.2)

#### Close Button
- **Position:** Top-right corner
- **Icon:** ✕ (X) symbol
- **Size:** 24px
- **Color:** #627C85
- **Hover Color:** #1F2121

---

## 4. User Flows & Wireframes

### 4.1 Student User Flow

#### Flow: Attempt Assessment

```
┌─────────────────────┐
│   Student Login     │
└──────────┬──────────┘
           │
    ┌──────▼──────┐
    │  Dashboard  │
    └──────┬──────┘
           │
    ┌──────▼──────────────────────┐
    │  View Available Assessments │
    └──────┬──────────────────────┘
           │
    ┌──────▼──────────────┐
    │  Click "Start"      │
    └──────┬──────────────┘
           │
    ┌──────▼────────────────────────┐
    │  Assessment Instructions      │
    │  (Duration, rules, etc.)      │
    └──────┬────────────────────────┘
           │
    ┌──────▼──────────────┐
    │  Problem #1         │
    │  (Code Editor)      │
    └──────┬──────────────┘
           │
    ┌──────▼──────────────────────┐
    │  Run Code / Submit          │  ─→ [Real-time Feedback]
    └──────┬──────────────────────┘
           │
    ┌──────▼──────────────┐
    │  Next Problem       │
    └──────┬──────────────┘
           │
    ┌──────▼──────────────┐
    │  Review & Submit    │
    └──────┬──────────────┘
           │
    ┌──────▼──────────────┐
    │  Results Page       │
    │  (Score, Feedback)  │
    └─────────────────────┘
```

#### Key Decision Points
- **Can Re-attempt?** Yes/No (Professor defined)
- **Show Answers?** Yes/No (Professor defined)
- **Skip Problem?** Yes (for later)

---

### 4.2 Professor User Flow

#### Flow: Create Assessment

```
┌─────────────────────┐
│  Professor Login    │
└──────────┬──────────┘
           │
    ┌──────▼──────┐
    │  Dashboard  │
    └──────┬──────┘
           │
    ┌──────▼────────────────────┐
    │ Click "Create Assessment" │
    └──────┬────────────────────┘
           │
    ┌──────▼──────────────────────┐
    │  Assessment Details         │
    │  (Name, duration, type)     │
    └──────┬──────────────────────┘
           │
    ┌──────▼──────────────────────┐
    │  Select/Create Questions    │
    │  (From bank or new)         │
    └──────┬──────────────────────┘
           │
    ┌──────▼──────────────────────┐
    │  Configure Settings         │
    │  (Scoring, retakes, etc.)   │
    └──────┬──────────────────────┘
           │
    ┌──────▼──────────────────────┐
    │  Set Date/Time & Publish    │
    └──────┬──────────────────────┘
           │
    ┌──────▼──────────────────────┐
    │  Monitor Submissions        │
    │  (Real-time updates)        │
    └──────┬──────────────────────┘
           │
    ┌──────▼──────────────────────┐
    │  View Analytics/Grade       │
    └─────────────────────────────┘
```

---

### 4.3 Admin User Flow

#### Flow: User Management

```
┌─────────────────────┐
│   Admin Login       │
└──────────┬──────────┘
           │
    ┌──────▼──────┐
    │  Dashboard  │
    └──────┬──────┘
           │
    ┌──────▼──────────────────┐
    │ Click "User Management" │
    └──────┬──────────────────┘
           │
    ┌──────▼──────────────────────┐
    │  User List (Searchable)     │
    └──────┬──────────────────────┘
           │
    ┌─────────────────────────────┐
    │ [Create] [Edit] [Deactivate]│
    └──────┬──────────────────────┘
           │
    ┌──────▼──────────────────────┐
    │  User Details Form          │
    │  (Email, Role, Status)      │
    └──────┬──────────────────────┘
           │
    ┌──────▼──────────────────────┐
    │  Save / Confirm             │
    └─────────────────────────────┘
```

---

## 5. Screen Specifications

### 5.1 Student Dashboard

**Layout: Main Content + Right Sidebar**

```
┌────────────────────────────────────────────────────────┐
│ CodeQuest Logo    Breadcrumb    Search  [Notifications]│
├──────────────────────────────────┬─────────────────────┤
│                                  │                     │
│  Welcome, Arjun! 👋              │  Quick Stats:       │
│                                  │    ─────────────────│
│  My Assessments                  │  • Tests: 12        │
│  ────────────────────────────────│  • Pass Rate: 83%   │
│  ┌──────────────────────────────┐│  • Score Avg: 85    │
│  │ Assessment 1                 ││                     │
│  │ Due: 2 days                  ││  Recent Activity:   │
│  │ Status: Available  [Start]   ││  ─────────────────  │
│  └──────────────────────────────┘│  ✓ Passed Quiz 1   │
│                                  │  ✓ Attempted Q2     │
│  ┌──────────────────────────────┐│  ✕ Failed Q3        │
│  │ Assessment 2                 ││                    │
│  │ Due: 5 days                  ││                    │
│  │ Status: In Progress  [View]  ││                    │
│  └──────────────────────────────┘│                    │
│                                  │                    │
│  ┌──────────────────────────────┐│                    │
│  │ Score Progression            ││                    │
│  │ [Line Chart]                 ││                    │
│  └──────────────────────────────┘│                    │
└──────────────────────────────────┴────────────────────┘
```

**Key Elements:**
- **Welcome Header:** With user's name
- **Assessment Cards:** Title, due date, status badge, action button
- **Performance Chart:** Score over time (line chart)
- **Stats Sidebar:** Key metrics (read-only)
- **Activity Feed:** Recent submissions

**Responsive Behavior:**
- **Mobile:** Stack cards vertically, move stats to top, remove chart
- **Tablet:** 2-column layout, stats below assessments
- **Desktop:** 3-column layout (assessments, main content, stats)

---

### 5.2 Attempt Problem Screen

**Layout: Problem Left + Code Editor Right**

```
┌──────────────────────────────────────────────────────────┐
│ CodeQuest      Assessment: Data Structures Quiz    [Menu]│
├──────────────┬───────────────────────────────────────────┤
│              │                                           │
│ Problem 1/3  │ Problem: Two Sum                          │
│ Title        │ ───────────────────────────────────────── │
│              │ Given an array of integers nums and an    │
│              │ integer target, return the indices of the │
│ □ Problem 1  │ two numbers such that they add up to      │
│ □ Problem 2  │ target.                                   │
│ □ Problem 3  │                                           │
│              │ Example:                                  │
│ [Bookmark]   │ Input: nums = [2,7,11,15], target = 9     │
│              │ Output: [0,1]                             │
│              │                                           │
│ ✓ Completed  │ Constraints:                              │
│              │ • 2 <= nums.length <= 10^4                │
│              │ • 10^9 <= nums[i] <= 10^9                 │
│              │                                           │
│ ────────────┘────────────────────────────────────────────┤
│ Test Cases                                               │
│ ─────────────────────────────────────────────────────────┤
│ Example 1:                                               │
│ Input: nums = [2,7,11,15], target = 9                    │
│ Output: [0,1]                                            │
└──────────────────────────────────────────────────────────┘
```

**Code Editor Section:**

```
┌──────────────────────────────────────────────────────────┐
│ Python  ▼ |  Theme: Light ▼  |  [+] [-]  |  Copy         │
├──────────────────────────────────────────────────────────┤
│  1 │ def twoSum(nums, target):                           │
│  2 │     # Write your solution here                      │
│  3 │     pass                                            │
│  4 │                                                     │
│  5 │                                                     │
├──────────────────────────────────────────────────────────┤
│ [Run Code] [Submit] [Save Draft] [Reset]                 │
└──────────────────────────────────────────────────────────┘
```

**Output Section (After Run):**

```
┌──────────────────────────────────────────────────────────┐
│ Test Results                                             │
├──────────────────────────────────────────────────────────┤
│ ✓ Test Case 1: PASSED                                    │
│   Input: [2,7,11,15], 9                                  │
│   Expected: [0,1]                                        │
│   Got: [0,1]                                             │
│   Time: 0.12ms  Memory: 2.5MB                            │
│                                                          │
│ ✓ Test Case 2: PASSED                                    │
│   Input: [3,2,4], 6                                      │
│   Expected: [1,2]                                        │
│   Got: [1,2]                                             │
│   Time: 0.15ms  Memory: 2.3MB                            │
│                                                          │
│ ✕ Test Case 3: FAILED                                    │
│   Input: [3,3], 6                                        │
│   Expected: [0,1]                                        │
│   Got: None                                              │
│   Error: NoneType cannot be indexed                      │
│                                                          │
│ Score: 66.7% (2/3 passed)                                │
│ Time Limit: ✓ Within limit (max 2s)                      │
│ Memory Limit: ✓ Within limit (max 256MB)                 │
└──────────────────────────────────────────────────────────┘
```

**Responsive Behavior:**
- **Mobile:** Stack vertically (problem top, editor below, output below)
- **Tablet:** 2-row layout (problem top, editor + output below)
- **Desktop:** 2-column layout (problem left, editor + output right)

---

### 5.3 Assessment Results Page

**Layout: Centered Content**

```
┌──────────────────────────────────────────────────────────┐
│ CodeQuest       Data Structures Quiz           [Menu]    │
├──────────────────────────────────────────────────────────┤
│                                                          │
│                   Assessment Completed ✓                 │
│                                                          │
│  Score: 78/100 (78%)                                     │
│  ────────────────────────────────────────────────────────│
│  [████████░░] 78%                                        │
│                                                          │
│  Time Spent: 45 minutes / 60 minutes available           │
│  Submitted: Jan 11, 2026 at 3:15 PM                      │
│                                                          │
│                   Problem Results                        │
│  ────────────────────────────────────────────────────────│
│  ┌───────────────────────────────────────────────────┐   │
│  │ # │ Title         │ Status │ Score │ Action       │   │
│  ├───┼───────────────┼────────┼───────┼──────────────┤   │
│  │ 1 │ Two Sum       │ ✓      │ 100%  │ [View Code]  │   │
│  │ 2 │ Reverse Array │ ✓      │ 75%   │ [View Code]  │   │
│  │ 3 │ Merge Arrays  │ ✕      │ 0%    │ [View Code]  │   │
│  └───────────────────────────────────────────────────┘   │
│                                                          │
│  [⬅ Back]                    [View Detailed Feedback]    │
│                              [Download PDF Result]       │
└──────────────────────────────────────────────────────────┘
```

**Detailed Feedback Modal:**

```
┌──────────────────────────────────────────────────────┐
│ Problem #2: Reverse Array  (75%)          [✕]        │
├──────────────────────────────────────────────────────┤
│                                                       │
│ Your Score: 75/100                                   │
│                                                       │
│ Results:                                              │
│ • Passed 3/4 test cases                              │
│ • Time: 120ms (within 2s limit)                      │
│ • Memory: 15MB (within 256MB limit)                  │
│                                                       │
│ Failed Test Case:                                    │
│ Input: [1,2,3,4,5]                                  │
│ Expected: [5,4,3,2,1]                               │
│ Got: [5,4,3,2,0]  ← Wrong last element             │
│                                                       │
│ Your Code:                                            │
│ ───────────────────────────────────────────────────  │
│ def reverse(arr):                                    │
│     return arr[::-1]  # ← Missing proper handling   │
│                                                       │
│ Feedback:                                             │
│ Good approach! Consider edge cases where the last   │
│ element might be zero.                               │
│                                                       │
│ [Close]                                              │
└──────────────────────────────────────────────────────┘
```

---

### 5.4 Professor: Create Assessment

**Layout: Multi-step Form**

```
┌──────────────────────────────────────────────────────┐
│ CodeQuest    Create Assessment         [Draft Saved] │
├──────────────────────────────────────────────────────┤
│                                                      │
│ Step 1: Assessment Details                          │
│ ─────────────────────────────────────────────────   │
│                                                      │
│ Assessment Name *                                   │
│ [____________________________________]              │
│                                                      │
│ Description                                          │
│ [________________________                            │
│  ___________________________________]                │
│                                                      │
│ Assessment Type *       Difficulty *                │
│ [Quiz ▼]               [Easy ▼]                    │
│                                                      │
│ Duration (minutes) *    Passing Score (%) *        │
│ [120]                  [70]                         │
│                                                      │
│ ─────────────────────────────────────────────────   │
│ [◀ Cancel]  [Next: Add Questions ▶]                │
└──────────────────────────────────────────────────────┘
```

**Step 2: Add Questions**

```
┌──────────────────────────────────────────────────────┐
│ Step 2: Add Questions                               │
│ ─────────────────────────────────────────────────── │
│                                                      │
│ Search Question Bank:                               │
│ [________________________] [🔍 Search]             │
│ [Filter by: Difficulty ▼] [Topic ▼]               │
│                                                      │
│ Available Questions:                                 │
│ ┌──────────────────────────────────────────────┐   │
│ │ ☑ Two Sum (Easy) - 50 points                │   │
│ ├──────────────────────────────────────────────┤   │
│ │ ☑ Merge Arrays (Medium) - 75 points         │   │
│ ├──────────────────────────────────────────────┤   │
│ │ ☐ Graph DFS (Hard) - 100 points             │   │
│ └──────────────────────────────────────────────┘   │
│                                                      │
│ Selected Questions: 2                                │
│ Total Points: 125                                    │
│                                                      │
│ [+ Create New Question]                             │
│                                                      │
│ ─────────────────────────────────────────────────   │
│ [◀ Back]  [Next: Configure Settings ▶]            │
└──────────────────────────────────────────────────────┘
```

**Step 3: Settings & Publish**

```
┌──────────────────────────────────────────────────────┐
│ Step 3: Settings & Publish                           │
│ ─────────────────────────────────────────────────── │
│                                                      │
│ Settings:                                            │
│ ☐ Randomize question order                         │
│ ☐ Show correct answers after submission             │
│ ☐ Show score immediately                            │
│ ☐ Allow re-attempts     Max attempts: [3]          │
│                                                      │
│ Security:                                            │
│ ☐ IP Restriction (Whitelist for exam hall)         │
│   IPs: [____________________]                       │
│                                                      │
│ Plagiarism Detection:                               │
│ Sensitivity: [High ▼]                              │
│                                                      │
│ Date & Time:                                        │
│ Start: [Jan 15, 2026] [10:00 AM]                   │
│ End:   [Jan 15, 2026] [01:00 PM]                   │
│                                                      │
│ Status:                                              │
│ ◉ Published        ◯ Draft                          │
│                                                      │
│ ─────────────────────────────────────────────────   │
│ [◀ Back]  [Create Assessment]                       │
└──────────────────────────────────────────────────────┘
```

---

### 5.5 Admin: User Management

**Layout: Data Table + Side Panel**

```
┌────────────────────────────────────────────────────────┐
│ CodeQuest       User Management              [Menu]   │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ [+ Create User] [Import CSV]  Search: [________]  [🔍]  │
│ Filter: Role [All ▼] Status [Active ▼]                 │
│                                                          │
│ ┌────┬──────────┬──────────────┬──────────┬────────┐   │
│ │ ☑  │ Email    │ Name         │ Role     │ Status │   │
│ ├────┼──────────┼──────────────┼──────────┼────────┤   │
│ │ ☐  │ raj@uni. │ Rajesh Kumar │ Professor│ Active │   │
│ │    │ edu      │              │          │        │   │
│ ├────┼──────────┼──────────────┼──────────┼────────┤   │
│ │ ☐  │ arj@uni. │ Arjun Sharma │ Student  │ Active │   │
│ │    │ edu      │              │          │        │   │
│ ├────┼──────────┼──────────────┼──────────┼────────┤   │
│ │ ☐  │ pri@uni. │ Priya Desai  │ Admin    │ Active │   │
│ │    │ edu      │              │          │        │   │
│ └────┴──────────┴──────────────┴──────────┴────────┘   │
│                                                          │
│ Showing 1-10 of 145 users  [◀ 1 2 3 ... ▶]             │
└────────────────────────────────────────────────────────┘
```

**Create User Modal:**

```
┌──────────────────────────────────────┐
│ Create New User                [✕]   │
├──────────────────────────────────────┤
│                                      │
│ Email *                              │
│ [____________________________]        │
│                                      │
│ Full Name *                          │
│ [____________________________]        │
│                                      │
│ Role *                               │
│ ◉ Student  ◯ Professor  ◯ Admin     │
│                                      │
│ Department *                         │
│ [Computer Science ▼]                │
│                                      │
│ Enrollment ID (for students)         │
│ [____________________________]        │
│                                      │
│ ☐ Send temporary password to email   │
│                                      │
│ ────────────────────────────────────│
│ [Cancel]         [Create User]       │
└──────────────────────────────────────┘
```

---

## 6. Responsive Design Guidelines

### 6.1 Breakpoints

| Device | Width | Layout |
|--------|-------|--------|
| **Mobile** | <640px | Single column, stacked content |
| **Tablet** | 640px - 1024px | 2-column layout |
| **Desktop** | >1024px | 3-column with sidebars |
| **Large Screen** | >1440px | Full-width with optimal max-width |

### 6.2 Responsive Patterns

#### Navigation

**Mobile:**
- Hamburger menu (top-left)
- Bottom tab navigation for primary sections
- Overlay navigation drawer on menu open

**Tablet:**
- Collapsible sidebar (80px collapsed width)
- Top navigation bar
- Bottom tab bar for quick access

**Desktop:**
- Persistent sidebar (260px)
- Top navigation bar
- Breadcrumb navigation

#### Code Editor

**Mobile:**
- Full-screen code editor
- Problem statement in collapsible panel
- Output below editor with scroll

**Tablet:**
- Split-screen: problem left (40%), editor right (60%)
- Problem statement resizable
- Output in popup/modal

**Desktop:**
- Split-screen: problem left (35%), editor right (65%)
- Output panel below editor
- All panels visible simultaneously

#### Forms

**Mobile:**
- Full-width inputs
- Single column layout
- Labels above fields
- Larger touch targets (48px minimum)

**Tablet:**
- 2-column grid for related fields
- Responsive spacing

**Desktop:**
- 2-3 column grid
- Optimal form width: 600px max

### 6.3 Touch-Friendly Design (Mobile)

- **Minimum Touch Target:** 48px × 48px
- **Button Padding:** 12px vertical, 16px horizontal
- **Input Height:** 48px
- **Spacing:** 16px between elements
- **Font Size:** Minimum 16px to prevent zoom on iOS

### 6.4 Desktop-Optimized Design

- **Hover States:** All interactive elements
- **Keyboard Navigation:** Full support (Tab, Enter, Escape)
- **Cursor:** Changes (pointer, text, resize, etc.)
- **Tooltips:** On icon-only buttons and truncated text

---

## 7. Accessibility Standards

### 7.1 WCAG 2.1 AA Compliance

#### Color Contrast

| Element | Ratio | Standard |
|---------|-------|----------|
| **Text on background** | 4.5:1 | AA (normal), AAA (7:1) |
| **Large text** | 3:1 | AA |
| **UI components** | 3:1 | AA |
| **Graphical elements** | 3:1 | AA |

**Testing:** Use WebAIM contrast checker or Axe DevTools browser extension

#### Keyboard Navigation

- **Tab Order:** Logical, left-to-right, top-to-bottom
- **Focus Visible:** Clear 3px outline, minimum 2px solid color
- **Skip Links:** "Skip to main content" at top of page
- **Focus Trap:** Modal dialogs trap focus until closed
- **Keyboard Shortcuts:** Documented and accessible

#### Semantic HTML

```html
<!-- Good: Semantic structure -->
<header>
  <nav>
    <ul>
      <li><a href="/">Home</a></li>
    </ul>
  </nav>
</header>
<main>
  <article>
    <h1>Assessment Title</h1>
  </article>
</main>
<footer>
  <p>© 2026 CodeQuest</p>
</footer>

<!-- Avoid: Generic divs -->
<div class="header">
  <div class="nav">
    <div class="links">
      <div><a href="/">Home</a></div>
    </div>
  </div>
</div>
```

#### ARIA Labels

```html
<!-- Button with icon only -->
<button aria-label="Close modal">✕</button>

<!-- Input with associated label -->
<label for="email">Email Address</label>
<input id="email" type="email" required>

<!-- Live region for real-time updates -->
<div aria-live="polite" aria-atomic="true" role="status">
  Tests passed: 3/5
</div>

<!-- Complex component description -->
<div role="region" aria-label="Code submission results">
  ...
</div>
```

#### Form Accessibility

```html
<!-- Required fields -->
<label for="name">
  Name <span aria-label="required">*</span>
</label>
<input id="name" required>

<!-- Error messages linked to inputs -->
<input id="password" type="password" aria-describedby="pwd-error">
<span id="pwd-error" role="alert">
  Password must be at least 8 characters
</span>

<!-- Validation feedback -->
<input aria-invalid="true" aria-describedby="error-message">
<span id="error-message" role="alert">Invalid email format</span>
```

### 7.2 Accessibility Checklist

- [ ] All images have descriptive alt text (not "image" or "photo")
- [ ] All form inputs have associated labels
- [ ] Color is not the only way to convey information (use icons + text)
- [ ] Focus indicators are visible on all interactive elements
- [ ] Videos have captions and transcripts
- [ ] Font sizes are scalable (use relative units like rem)
- [ ] Content reflows properly at 200% zoom
- [ ] No time limits on interactive tasks (or easily extendable)
- [ ] Links are distinguishable from body text (underline or color + icon)
- [ ] Error messages are specific and actionable

---

## 8. Design Patterns

### 8.1 Feedback Patterns

#### Success Pattern

```
┌─────────────────────────────────┐
│ ✓ Submission successful          │
│ Your code has been submitted.    │
│ [View Results]                  │
└─────────────────────────────────┘
```

**Specifications:**
- **Color:** #22C55E (success green)
- **Icon:** ✓ checkmark
- **Duration:** 5-second auto-dismiss OR manual close
- **Position:** Top-right, fixed
- **Animation:** Slide in from top (200ms), fade out (300ms)

#### Error Pattern

```
┌─────────────────────────────────┐
│ ✕ Compilation Error              │
│ Unexpected token '}' on line 5   │
│ [Show Details]  [✕]             │
└─────────────────────────────────┘
```

**Specifications:**
- **Color:** #C01530 (error red)
- **Icon:** ✕ or ⚠
- **Duration:** Persistent (user must close)
- **Position:** Top-right or inline
- **Action:** "Show Details" for stack trace

#### Loading Pattern

```
┌─────────────────────────────────┐
│ ⟳ Running tests...               │
│ Executing test case 2 of 5       │
└─────────────────────────────────┘
```

**Specifications:**
- **Icon:** Animated spinner or progress ring
- **Text:** Brief status message
- **Duration:** Auto-hide on completion
- **Position:** Centered or top-right
- **Animation:** Smooth rotation (1.5s per rotation)

### 8.2 Empty States

#### No Assessments

```
┌────────────────────────────────┐
│                                │
│      📋 No Assessments         │
│                                │
│  You don't have any            │
│  assessments yet.              │
│                                │
│  Check back later or contact   │
│  your professor.               │
│                                │
└────────────────────────────────┘
```

**Specifications:**
- **Icon:** Large illustrative icon (100px+)
- **Heading:** Clear, friendly message
- **Subtext:** Explanation + next steps
- **Action:** Optional CTA button
- **Background:** Subtle pattern or solid color (#F9FAFB)

### 8.3 Confirmation Dialogs

#### Delete Confirmation

```
┌──────────────────────────────────┐
│ Delete Question?              [✕]│
├──────────────────────────────────┤
│                                  │
│ Are you sure you want to delete  │
│ "Two Sum"?                       │
│                                  │
│ This action cannot be undone.    │
│                                  │
│ ──────────────────────────────── │
│ [Cancel]         [Delete]        │
└──────────────────────────────────┘
```

**Specifications:**
- **Heading:** Clear action statement
- **Body:** Consequences of action
- **Primary Button:** Danger color (#C01530)
- **Secondary Button:** Gray (cancel)
- **Default Action:** Cancel (on Escape key)

---

## 9. Animation & Interactions

### 9.1 Micro-interactions

#### Button Click

```css
/* Press animation */
@keyframes buttonPress {
  0% { transform: scale(1); }
  50% { transform: scale(0.98); }
  100% { transform: scale(1); }
}

button:active {
  animation: buttonPress 150ms ease-out;
}
```

**Duration:** 150ms  
**Easing:** cubic-bezier(0.34, 1.56, 0.64, 1)

#### Hover Effects

```css
/* Subtle lift */
a:hover {
  color: var(--color-primary);
  text-decoration: underline;
}

.card:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
  transition: all 250ms ease-out;
}
```

**Duration:** 250ms  
**Easing:** ease-out (cubic-bezier(0.16, 1, 0.3, 1))

#### Focus Ring

```css
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  border-radius: 4px;
}
```

**Outline Width:** 2px  
**Outline Color:** #208090  
**Outline Offset:** 2px

### 9.2 Page Transitions

#### Fade In/Out

```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.page {
  animation: fadeIn 300ms ease-out;
}
```

**Duration:** 300ms  
**Easing:** ease-out

#### Slide In (Assessment Start)

```css
@keyframes slideInUp {
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: translateY(0); }
}

.assessment-start {
  animation: slideInUp 400ms ease-out;
}
```

**Duration:** 400ms  
**Easing:** ease-out

### 9.3 Transition Duration Standards

| Component | Duration | Purpose |
|-----------|----------|---------|
| **Button Hover** | 150ms | Quick feedback |
| **Navigation Menu** | 250ms | Smooth slide |
| **Modal Appear** | 300ms | Noticeable but not slow |
| **Page Transition** | 300-400ms | Context change |
| **Loading Spinner** | 1500ms per rotation | Continuous motion |
| **Toast Dismiss** | 300ms | Auto-fade out |

---

## 10. Design Tokens

### 10.1 Token Definitions

#### Color Tokens

```json
{
  "color": {
    "primary": "#208090",
    "primary-light": "#32B8C6",
    "primary-dark": "#1A6873",
    "success": "#22C55E",
    "error": "#C01530",
    "warning": "#A84B2F",
    "info": "#627C85",
    "text-primary": "#1F2121",
    "text-secondary": "#627C85",
    "background": "#FFFCF9",
    "surface": "#F5F5F5",
    "border": "#D0D0D0"
  }
}
```

#### Spacing Tokens

```json
{
  "space": {
    "0": "0",
    "1": "4px",
    "2": "8px",
    "3": "12px",
    "4": "16px",
    "5": "20px",
    "6": "24px",
    "7": "32px",
    "8": "40px",
    "9": "48px"
  }
}
```

#### Typography Tokens

```json
{
  "typography": {
    "h1": {
      "font-size": "30px",
      "font-weight": 600,
      "line-height": "1.2"
    },
    "h2": {
      "font-size": "24px",
      "font-weight": 600,
      "line-height": "1.2"
    },
    "body": {
      "font-size": "14px",
      "font-weight": 400,
      "line-height": "1.5"
    },
    "code": {
      "font-family": "'Courier New', monospace",
      "font-size": "13px",
      "font-weight": 400
    }
  }
}
```

#### Shadow Tokens

```json
{
  "shadow": {
    "sm": "0 1px 3px rgba(0, 0, 0, 0.08)",
    "md": "0 4px 6px rgba(0, 0, 0, 0.12)",
    "lg": "0 10px 25px rgba(0, 0, 0, 0.2)",
    "xl": "0 20px 40px rgba(0, 0, 0, 0.3)"
  }
}
```

#### Border Radius Tokens

```json
{
  "radius": {
    "sm": "4px",
    "base": "6px",
    "md": "8px",
    "lg": "12px",
    "full": "9999px"
  }
}
```

---

## 11. Implementation Notes for Developers

### 11.1 Component Library Structure

```
src/components/
├── common/
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.module.css
│   │   └── Button.stories.tsx
│   ├── Card/
│   ├── Input/
│   └── ...
├── layout/
│   ├── Navigation/
│   ├── Sidebar/
│   └── MainLayout/
├── assessment/
│   ├── ProblemStatement/
│   ├── CodeEditor/
│   └── TestResults/
└── admin/
    ├── UserManagement/
    └── Analytics/
```

### 11.2 CSS Naming Convention

Use BEM (Block Element Modifier) for CSS classes:

```css
/* Block */
.card { }

/* Element */
.card__header { }
.card__body { }

/* Modifier */
.card--elevated { }
.card--outlined { }

/* State */
.card.is-active { }
.card.is-disabled { }
```

### 11.3 Storybook Examples

```typescript
// Button.stories.tsx
import Button from './Button';

export default {
  title: 'Components/Button',
  component: Button,
};

export const Primary = () => (
  <Button variant="primary">Click me</Button>
);

export const Secondary = () => (
  <Button variant="secondary">Click me</Button>
);

export const Disabled = () => (
  <Button disabled>Click me</Button>
);
```

---

## 12. Design Handoff Checklist

Before handing to developers, ensure:

- [ ] All components documented in Figma/design tool
- [ ] All states documented (default, hover, active, disabled, focus)
- [ ] All responsive breakpoints specified
- [ ] Color tokens extracted and named
- [ ] Typography scaled and hierarchy clear
- [ ] Spacing/padding consistent using 8px grid
- [ ] Accessibility annotations added (ARIA labels, semantic HTML suggestions)
- [ ] Micro-interactions documented with duration/easing
- [ ] Focus states visible on all interactive elements
- [ ] Error states shown for all form inputs
- [ ] Empty states illustrated
- [ ] Loading states documented
- [ ] Skeleton screens for data loading
- [ ] Design tokens exported (colors, typography, spacing, shadows)
- [ ] Link to Figma file/design tool included
- [ ] Annotation/comments for non-obvious design decisions

---

## 13. Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-11 | Initial UI/UX mockup document |

---

## 14. Design References & Tools

### Recommended Tools

- **Design:** Figma (component library, prototypes, handoff)
- **Prototyping:** Figma, Adobe XD, or Penpot
- **Testing:** Chrome DevTools, Lighthouse, Axe DevTools
- **Accessibility:** WebAIM, WAVE, Accessible Colors Checker
- **Documentation:** Confluence, Notion, Storybook

### Resources

- WCAG 2.1 Guidelines: https://www.w3.org/WAI/WCAG21/quickref/
- Material Design 3: https://m3.material.io/
- Apple HIG: https://developer.apple.com/design/human-interface-guidelines/
- A11y Project: https://www.a11yproject.com/

---

**End of UI/UX Mockup Document**

*For design questions or clarifications, contact the design team.*
*For implementation questions, refer to the PRD (Product Requirements Document).*
