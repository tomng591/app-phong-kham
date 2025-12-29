# Clinic Task Scheduler - Specification

## Overview

A single-page web application for scheduling medical tasks at a clinic. The app assigns patients to doctors based on task requirements and availability, ensuring no conflicts (one doctor does one task for one patient at a time).

**Target user:** Clinic admin (single user)
**Language:** Vietnamese (all UI text in Vietnamese, support Vietnamese characters for names)

---

## Tech Stack

- **Frontend:** React (single page application)
- **Hosting:** GitHub Pages (static site)
- **Data storage:** localStorage (persists between browser sessions)
- **No backend required**

---

## Data Model

```typescript
interface Settings {
  break_between_tasks: number; // minutes - mandatory break for doctors between tasks
}

interface Task {
  id: string;
  name: string;
  doctor_duration: number; // minutes - how long doctor is occupied
  patient_duration: number; // minutes - how long patient is occupied (may be longer due to recovery/settling time)
}

interface Doctor {
  id: string;
  name: string;
  can_do: string[]; // array of task IDs this doctor can perform
}

interface Patient {
  id: string;
  name: string;
  needs: string[]; // array of task IDs this patient needs
}

// For daily scheduling
interface DailyScheduleInput {
  working_doctor_ids: string[]; // which doctors are working today
  patients: Patient[]; // today's patients
}

// Output
interface ScheduledTask {
  patient_id: string;
  doctor_id: string;
  task_id: string;
  start_time: number; // minutes from start of day (0 = clinic opening)
  doctor_end_time: number; // when doctor is free
  patient_end_time: number; // when patient is free
}

interface ScheduleResult {
  scheduled: ScheduledTask[];
  unhandled: {
    patient_id: string;
    task_id: string;
    reason: string; // e.g., "Không có bác sĩ nào thực hiện được" (no doctor can do this task)
  }[];
}
```

---

## Scheduling Algorithm

**Approach:** Greedy algorithm (find any valid schedule, no optimization required)

**Constraints:**
1. For a task to be scheduled, BOTH doctor AND patient must be free
2. Doctor is occupied from `start_time` to `start_time + doctor_duration`
3. Patient is occupied from `start_time` to `start_time + patient_duration`
4. Doctor must have `break_between_tasks` minutes of rest before starting next task
5. Doctor must have the task in their `can_do` list

**Algorithm steps:**
1. Build a queue of all `(patient, task)` pairs that need scheduling
2. For each pair, find the earliest time where:
   - At least one doctor who can perform this task is free (including break time)
   - The patient is free
3. Schedule the task, update both doctor's and patient's `free_at` times
4. If no doctor can perform a required task (skill mismatch), mark as unhandled
5. Assume all patients arrive at start of day (time = 0)
6. Task order for each patient does not matter

---

## App Structure

### Tab 1: Cài đặt (Setup)

**Section 1.1: Cài đặt chung (General Settings)**
- Input: `Thời gian nghỉ giữa các công việc (phút)` — break time between tasks in minutes

**Section 1.2: Quản lý công việc (Task Management)**
- Table showing all tasks with columns:
  - Tên công việc (Task name)
  - Thời gian bác sĩ (phút) (Doctor duration)
  - Thời gian bệnh nhân (phút) (Patient duration)
  - Actions: Edit, Delete
- Button: `+ Thêm công việc` (Add task)

**Section 1.3: Quản lý bác sĩ (Doctor Management)**
- Table showing all doctors with columns:
  - Tên bác sĩ (Doctor name)
  - Công việc có thể làm (Tasks they can do) — show as tags/chips
  - Actions: Edit, Delete
- Button: `+ Thêm bác sĩ` (Add doctor)
- When adding/editing doctor: multi-select dropdown for tasks

### Tab 2: Lịch hàng ngày (Daily Schedule)

**Section 2.1: Chọn bác sĩ làm việc hôm nay (Select today's working doctors)**
- Checkbox list of all doctors
- Or multi-select component

**Section 2.2: Danh sách bệnh nhân (Patient List)**
- Table showing today's patients:
  - Tên bệnh nhân (Patient name)
  - Công việc cần làm (Required tasks) — show as tags/chips
  - Actions: Edit, Delete
- Button: `+ Thêm bệnh nhân` (Add patient)
- When adding/editing patient: multi-select dropdown for tasks

**Section 2.3: Generate**
- Button: `Tạo lịch` (Generate Schedule)
- Clicking this runs the scheduling algorithm and shows results

### Tab 3: Kết quả (Results)

Only visible/populated after running "Tạo lịch"

**Section 3.1: Lịch theo bác sĩ (Doctor Timeline View)**
- Gantt-chart style visualization
- Rows = doctors
- Columns = time slots (in minutes, but displayed as HH:MM)
- Each block shows: Patient name, Task name
- Color-coded by task or patient

Example:
```
Thời gian  | BS. Nguyễn         | BS. Trần           | BS. Lê
-----------|--------------------|--------------------|------------------
8:00       | An (Chụp X-quang)  |                    | Bình (Khám tổng quát)
8:15       | ...                | Cường (Lấy cao)    | ...
8:30       | Dũng (...)         |                    |
```

**Section 3.2: Lịch theo bệnh nhân (Patient Journey View)**
- List showing each patient's schedule:
```
Bệnh nhân An: [Chụp X-quang 8:00-8:20] → [Trám răng 8:45-9:15] → Hoàn thành: 9:30
Bệnh nhân Bình: [Khám tổng quát 8:00-8:30] → Hoàn thành: 8:30
```

**Section 3.3: Không thể xếp lịch (Unhandled)**
- List of patients/tasks that couldn't be scheduled
- Show reason (e.g., no doctor available for this task)
```
⚠ Bệnh nhân X - Công việc Y: Không có bác sĩ nào thực hiện được
```

---

## UI/UX Notes

1. **Persistence:** All setup data (tasks, doctors, settings) saved to localStorage automatically
2. **Daily data:** Patient list for today can optionally be saved/loaded (nice to have: save yesterday's setup as starting point)
3. **Time display:** Input in minutes, but display as HH:MM format (assume clinic starts at 8:00 AM, so minute 0 = 8:00, minute 60 = 9:00, etc.)
4. **Responsive:** Should work on desktop (primary) and tablet (secondary)
5. **Simple styling:** Clean, functional UI. Nothing fancy needed.

---

## Vietnamese UI Labels Reference

```
// Navigation
Cài đặt = Setup
Lịch hàng ngày = Daily Schedule  
Kết quả = Results

// General
Lưu = Save
Hủy = Cancel
Xóa = Delete
Sửa = Edit
Thêm = Add
Đóng = Close

// Settings
Thời gian nghỉ giữa các công việc (phút) = Break time between tasks (minutes)

// Tasks
Công việc = Task
Tên công việc = Task name
Thời gian bác sĩ (phút) = Doctor duration (minutes)
Thời gian bệnh nhân (phút) = Patient duration (minutes)
Thêm công việc = Add task

// Doctors  
Bác sĩ = Doctor
Tên bác sĩ = Doctor name
Công việc có thể làm = Tasks they can do
Thêm bác sĩ = Add doctor

// Patients
Bệnh nhân = Patient
Tên bệnh nhân = Patient name
Công việc cần làm = Required tasks
Thêm bệnh nhân = Add patient

// Daily
Chọn bác sĩ làm việc hôm nay = Select today's working doctors
Danh sách bệnh nhân = Patient list
Tạo lịch = Generate schedule

// Results
Lịch theo bác sĩ = Schedule by doctor
Lịch theo bệnh nhân = Schedule by patient
Không thể xếp lịch = Cannot be scheduled
Hoàn thành = Completed
Không có bác sĩ nào thực hiện được = No doctor can perform this task

// Time
Thời gian = Time
phút = minutes
```

---

## Out of Scope (for v1)

- Multi-language support (Vietnamese only)
- User authentication
- Cloud sync / backend
- Optimization algorithms (finding best schedule)
- Patient arrival times (assume all arrive at start)
- Task ordering dependencies
- Multiple clinics
- Print/export functionality
- Drag-and-drop schedule editing

---

## Future Enhancements (maybe v2)

- Export schedule to PDF/Excel
- Copy previous day's patient list as template
- Clinic start/end time settings
- Multiple break time rules
- Task dependencies (must do A before B)
