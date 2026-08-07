# Smart Team Task Board — Full Stack MERN Application

A Team Task Management System built with the **MERN Stack** (MongoDB, Express.js, React, Node.js), featuring **JWT Authentication**, **Role-based Security (Admin, Manager, Employee)**, **Kanban Sprint Board**, **MongoDB Aggregation Analytics**, **Audit Activity Logging**, **Socket.io Real-time Notifications**, and **Docker** containerization.

---

## 🌟 Key Features & Business Rules Enforced

1. **Hierarchy**: Workspace → Sprint → Task (Strict dependency: every task requires a sprint).
2. **Role-Based Permissions**:
   - **Admin**: Manages platform users, creates workspaces, manages workspace members, archives workspaces (blocked if active sprints exist), views system-wide analytics.
   - **Manager**: Creates sprints, activates/deactivates sprints, creates/assigns/edits tasks, approves or rejects task reviews (`review → done` or `review → in_progress`).
   - **Employee**: Strictly scoped to assigned tasks. Moves assigned tasks `todo → in_progress → review`.
3. **8 Active Task Limit**: Employees cannot hold $>8$ active tasks (`todo`, `in_progress`, `review`). Checked during task creation, assignment, and reassignment.
4. **Task Flow State Machine**: `Todo → In Progress → Review → Done` (Direct jumps like `todo → done` are blocked at API level).
5. **Soft Delete & Task Unassignment Cascade**: Deleting a user sets `isDeleted: true`, unassigns active tasks (`assignedTo: null`), preserves snapshot details (`lastAssignedUserSnapshot`), and emits an activity log.
6. **Activity Log & Audit Trail**: Every data modification creates an immutable audit log entry.
7. **Real-time Engine (Socket.io)**: Live updates on the Kanban board when tasks are created, assigned, moved, or commented on.
8. **Docker & Compose**: One-command setup running Node API and MongoDB in isolated containers.

---

## 🚀 Quick Start Instructions

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas URI or local MongoDB instance
- Docker & Docker Compose (optional for containerized run)

### Option 1: Running Locally

#### 1. Setup Backend
```bash
cd backend
npm install
npm run seed     # Populates 3 Workspaces & gives Employee 1 max 8 active tasks
npm run dev      # Starts Express API & Socket.io server on http://localhost:5000
```

#### 2. Setup Frontend
```bash
cd ../frontend
npm install
npm run dev      # Starts React Vite app on http://localhost:5173
```

---

### Option 2: Running with Docker Compose

```bash
docker-compose up --build
```
* **Backend API**: `http://localhost:5000`
* **MongoDB**: `localhost:27017`

---

## 🔑 Pre-populated Demo Test Accounts & Workspaces (`npm run seed`)

All test accounts use the password: `Password123!`

| Role | Email | Permissions / Scope & Seeded State |
|---|---|---|
| **Admin** | `admin@example.com` | Full User management, Create Workspaces, Member management, Global stats |
| **Manager** | `manager@example.com` | Create Sprints, Assign Tasks, Approve/Reject Reviews, Workspace stats |
| **Employee 1** | `employee1@example.com` | **Seeded with MAX 8 ACTIVE TASKS** to demonstrate active limit rule |
| **Employee 2** | `employee2@example.com` | Regular employee account with overdue task & completed task history |

### 🏢 Seeded Workspaces
1. **`Engineering Workspace`**: Primary active workspace with Sprint 1 & Sprint 2.
2. **`Mobile App Workspace`**: Secondary active workspace with Mobile Sprint 1.
3. **`Design & Marketing Workspace`**: Additional team workspace.
