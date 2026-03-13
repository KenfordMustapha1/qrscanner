# Attendance Management System - Design Document

## Database Structure

### Collections (MongoDB)

#### 1. **users**
| Field      | Type     | Notes                          |
|------------|----------|--------------------------------|
| _id        | ObjectId | Auto-generated                 |
| employeeId | String   | Required, unique, trimmed      |
| name       | String   | Required, trimmed              |
| department | String   | Required, trimmed              |
| position   | String   | Optional                       |
| profilePhotoUrl | String | Optional                    |
| email      | String   | Required, unique, lowercase    |
| role       | String   | Default "employee", enum: employee/admin |
| qrCode     | String   | Required, unique (UUID v4)     |
| createdAt  | Date     | Default: Date.now              |

#### 2. **attendances**
| Field      | Type     | Notes                          |
|------------|----------|--------------------------------|
| _id        | ObjectId | Auto-generated                 |
| userId     | ObjectId | Ref: User, required            |
| date       | Date     | Required (normalized to midnight) |
| time       | String   | Legacy single time field       |
| timeIn     | String   | HH:mm format                   |
| timeOut    | String   | HH:mm format                   |
| status     | String   | "Present", "Late", "Absent"    |
| createdAt  | Date     | Timestamps                     |
| updatedAt  | Date     | Timestamps                     |

**Index:** `{ userId: 1, date: 1 }` (unique) — prevents duplicate attendance per user per day.

#### 3. **admins**
| Field      | Type     | Notes                          |
|------------|----------|--------------------------------|
| _id        | ObjectId | Auto-generated                 |
| email      | String   | Required, unique               |
| password   | String   | Required, bcrypt hashed        |
| name       | String   | Required                       |
| createdAt  | Date     | Timestamps                     |
| updatedAt  | Date     | Timestamps                     |

#### 4. **settings**
| Field      | Type     | Notes                          |
|------------|----------|--------------------------------|
| _id        | ObjectId | Auto-generated                 |
| key        | String   | Required, unique (e.g. "lateCutoffTime") |
| value      | Mixed    | Required                       |
| updatedAt  | Date     | Default: Date.now              |

---

## UI Layout

### Dashboard Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  SIDEBAR (280px)     │  MAIN CONTENT                             │
│  ┌──────────────┐    │  ┌─────────────────────────────────────┐  │
│  │ Logo         │    │  │ Header: Title + Subtitle            │  │
│  ├──────────────┤    │  ├─────────────────────────────────────┤  │
│  │ Dashboard    │    │  │ Stats Cards (5):                     │  │
│  │ Students     │    │  │ [Present] [Absent] [Late] [%] [Total]│  │
│  │ Attendance   │    │  ├─────────────────────────────────────┤  │
│  │ Logs         │    │  │ Chart (14-day trend) │ Recent Scans   │  │
│  │ Settings     │    │  │                     │                │  │
│  ├──────────────┤    │  └─────────────────────────────────────┘  │
│  │ Admin info   │    │                                           │
│  │ Logout       │    │                                           │
│  └──────────────┘    │                                           │
└─────────────────────────────────────────────────────────────────┘
```

### Tab Views

- **Dashboard:** Stats cards, area chart, recent scans list
- **Students:** Table with Add/Edit/Delete/QR actions
- **Attendance Logs:** Date filter, search, export buttons, table
- **Settings:** Late cutoff time picker

---

## Additional Features to Consider

### 1. **Bulk Import**
- CSV/Excel upload to add multiple students at once
- Template download for correct format

### 2. **Email Notifications**
- Daily attendance summary to admin
- Absence alerts for parents/guardians
- Late arrival notifications

### 3. **Multi-Location / Classes**
- Support for multiple classes or locations
- Class-specific late cutoff times
- Filter by class in reports

### 4. **Manual Attendance Override**
- Admin can manually mark Present/Absent/Late
- Useful for excused absences or corrections

### 5. **Attendance Reports by Student**
- Per-student attendance history
- Monthly/weekly summary per student
- Export individual student report

### 6. **Dashboard Date Picker**
- View stats for any past date
- Compare attendance across weeks

### 7. **Role-Based Access**
- Multiple admin levels (super admin, viewer)
- Audit log for sensitive actions

### 8. **Mobile App / PWA**
- Offline-capable scanner
- Push notifications for scan confirmation

### 9. **Geolocation Verification**
- Optional: require scan within campus radius
- Prevents remote QR sharing abuse

### 10. **Holiday / Non-Working Days**
- Mark days as non-attendance
- Exclude from reports and stats

---

## API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/admin/login | Admin login |
| POST | /api/admin/create-user | Create student |
| GET | /api/admin/users | List students |
| PUT | /api/admin/users/:id | Update student |
| DELETE | /api/admin/users/:id | Delete student |
| POST | /api/admin/users/:id/regenerate-qr | Regenerate QR |
| GET | /api/admin/attendance | List attendance (filter by date, search) |
| GET | /api/admin/attendance/stats | Dashboard stats |
| GET | /api/admin/attendance/analytics | Chart data (14 days) |
| GET | /api/admin/export-attendance | Export CSV |
| GET | /api/admin/export-attendance/excel | Export Excel |
| GET | /api/admin/export-attendance/pdf | Export PDF |
| GET | /api/admin/settings | Get settings |
| PUT | /api/admin/settings | Update settings |
| POST | /api/attendance/scan | Scan QR (Time In/Out) |
| POST | /api/employee/login | Employee login |
| GET | /api/employee/me | Employee profile + QR + today's status |
| GET | /api/employee/attendance | Employee attendance history |
