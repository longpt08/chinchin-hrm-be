# ChinChin HRM - Backend Integration Guide

Tài liệu này tổng hợp toàn bộ các API endpoints, cấu trúc payload và chuẩn giao tiếp mà Frontend (React) hiện đang mong đợi từ Backend. Backend team vui lòng tham khảo tài liệu này để xây dựng API trả về đúng format, giúp quá trình tích hợp không bị conflict hay lỗi type.

## 1. Cấu hình Chung (General Configs)
- **Base URL:** Frontend gọi API qua biến môi trường `VITE_API_URL` (mặc định là `http://localhost:3000`).
- **Prefix:** Các request đều có prefix `/api/`.
- **Authentication:** Frontend tự động đính kèm token vào mọi request thông qua Header `Authorization: Bearer <token>`. (Token được lưu trữ trong localStorage bằng Zustand persist).
- **Xử lý 401 Unauthorized:** Khi Backend trả về HTTP Status `401`, Frontend sẽ tự động clear session và redirect user về trang đăng nhập.
- **Quy ước tham số ngày tháng:** Các trường ngày tháng nên dùng định dạng ISO 8601 string (VD: `2026-09-29T00:00:00Z` hoặc `2026-09-29`).

---

## 2. Các Module API

### 2.1. Xác thực (Auth)
- **POST** `/api/auth/login`
  - **Payload:** 
    - Manager: `{ "phone": "string", "password": "password123", "role": "manager" }`
    - Employee: `{ "phone": "string", "pin": "123456", "role": "employee" }`
  - **Response mong đợi:**
    ```json
    {
      "token": "jwt_token_string",
      "user": {
        "id": "uuid",
        "name": "Nguyễn Văn A",
        "phone": "0987654321",
        "role": "manager", // hoặc "employee"
        "avatarUrl": "https://..." // optional
      }
    }
    ```

### 2.2. Quản lý Nhân viên (Employee)
- **GET** `/api/users`
  - **Response:** Array các User object.
- **GET** `/api/users/:id`
  - **Response:** Chi tiết 1 User object.
- **POST** `/api/users`
  - **Payload:** `{ "name", "phone", "roleId", "employmentType", "contractType", "onboardDate", "baseSalary", "probationSalary" (optional) }`
- **PUT** `/api/users/:id`
  - **Payload:** Các trường update tương tự như POST. Đặc biệt: gửi `{ "isActive": false }` để cho nhân viên nghỉ việc (Fire).
- **GET** `/api/roles`
  - **Response:** Array roles `{ "id", "name", "description" }`.

### 2.3. Chấm công (Attendance)
- **POST** `/api/time-logs/clock-in`
  - **Payload:** `{ "userId": "uuid", "photo": "base64_string" (optional) }`
- **POST** `/api/time-logs/clock-out`
  - **Payload:** `{ "userId": "uuid", "photo": "base64_string" (optional) }`
- **GET** `/api/time-logs`
  - **Query Params:** `?dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD&userId=uuid`
  - **Response:** Array các TimeLog `{ "id", "userId", "clockIn", "clockOut", "status", "photoUrl" }`.

### 2.4. Ca làm việc (Shift)
- **GET** `/api/shift-templates`
  - **Response:** Array templates `{ "id", "name", "startTime", "endTime", "allowedLateMinutes", "isActive" }`.
- **POST** `/api/shift-templates` / **PUT** `/api/shift-templates/:id`
  - **Payload:** Giống response trên.
- **GET** `/api/shifts`
  - **Query Params:** `?dateFrom=...&dateTo=...&userId=...&status=...`
  - **Response:** Array các ca làm `{ "id", "userId", "templateId", "date", "startTime", "endTime", "status": "draft" | "published" }`.
- **POST** `/api/shifts/register`
  - **Payload:** `{ "userId": "uuid", "shifts": [ { "date", "templateId", "startTime", "endTime" } ] }`
- **PUT** `/api/shifts/:id/publish`
  - Cập nhật trạng thái ca làm thành "published".

### 2.5. Lương (Payroll)
- **GET** `/api/payroll/calculate`
  - **Query Params:** `?month=10&year=2026&userId=...`
  - **Response:** Mảng hoặc Object PayrollCalculation: 
    `{ "userId", "userName", "month", "year", "baseSalary", "totalHours", "allowances", "punishments", "advances", "finalTotal", "adjustments": [] }`
- **POST** `/api/payroll/adjustments`
  - **Payload:** `{ "userId", "type": "allowance" | "punishment" | "advance", "amount": number, "date": "YYYY-MM-DD", "description" }`
- **GET** `/api/payroll/adjustments`
  - **Query Params:** `?userId=...&month=...&year=...`
- **POST** `/api/payroll/payslips`
  - **Payload:** `{ "userId", "month", "year" }` (Chốt lương tạo payslip).
- **GET** `/api/payroll/payslips`
  - **Query Params:** `?userId=...&month=...&year=...`

### 2.6. Cẩm nang (Handbook)
- **GET** `/api/handbook`
  - **Query Params:** `?category=...&targetRole=...`
- **GET** `/api/handbook/:id`
- **POST** `/api/handbook` / **PUT** `/api/handbook/:id`
  - **Payload:** `{ "title", "category", "content" (markdown text), "targetRoles": ["manager", "employee"], "status": "draft" | "published" }`
- **POST** `/api/handbook/:id/acknowledge`
  - Nhân viên xác nhận đã đọc. Không cần payload, backend tự lấy userId từ token.

### 2.7. Dashboard
- **GET** `/api/dashboard/stats`
  - **Response:** `{ "totalEmployees": number, "activeToday": number, "currentlyWorking": number, "pendingShiftApprovals": number }`
- **GET** `/api/dashboard/today-status`
  - **Response:** Array trạng thái nhân viên hôm nay `{ "userId", "userName", "avatarUrl", "lastClockIn", "lastClockOut", "isWorking", "hoursToday" }`

---

## 3. Các Type Chính (Shared Types)
Frontend định nghĩa các interface chính tại `src/types/index.ts`. Backend nên tham khảo để map object 1-1:

```typescript
export interface User {
  id: string
  name: string
  phone: string
  email?: string
  role: 'manager' | 'employee'
  roleId: string
  employmentType: 'Full-time' | 'Part-time'
  contractType: 'Probation' | 'Official'
  onboardDate: string
  baseSalary: number
  probationSalary?: number
  isActive: boolean
  avatarUrl?: string
}

export interface TimeLog {
  id: string
  userId: string
  clockIn: string // ISO Date String
  clockOut?: string
  status: 'on_time' | 'late' | 'early_leave'
  photoUrl?: string
}
```

## 4. Xử lý Lỗi (Error Handling)
Frontend sử dụng Axios interceptor.
Backend nên trả về các HTTP status code chuẩn:
- `200/201`: Thành công.
- `400`: Bad Request (Lỗi validation form, payload sai). Có thể đính kèm field `message` hoặc `errors` object.
- `401`: Unauthorized (Token hết hạn/sai). Frontend sẽ tự động logout.
- `403`: Forbidden (User không có quyền).
- `404`: Not Found.
- `500`: Internal Server Error.

Frontend sẽ tự động hiển thị error message lấy từ `response.data.message` của API (nếu có) thông qua thư viện toast (nếu được thêm vào) hoặc alert cơ bản.
