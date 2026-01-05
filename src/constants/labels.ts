export const LABELS = {
  // Navigation
  tabs: {
    settings: 'Cài đặt',
    daily: 'Lịch hàng ngày',
    results: 'Kết quả',
  },

  // Common actions
  actions: {
    save: 'Lưu',
    cancel: 'Hủy',
    delete: 'Xóa',
    edit: 'Sửa',
    add: 'Thêm',
    close: 'Đóng',
  },

  // Settings
  settings: {
    title: 'Cài đặt chung',
    breakTime: 'Thời gian nghỉ của bệnh nhân giữa các công việc (phút)',
    taskManagement: 'Quản lý công việc',
    doctorManagement: 'Quản lý bác sĩ',
  },

  // Tasks
  task: {
    name: 'Tên công việc',
    doctorDuration: 'Thời gian bác sĩ (phút)',
    patientDuration: 'Thời gian bệnh nhân (phút)',
    add: 'Thêm công việc',
    isManualSchedulable: 'Cho phép đặt lịch thủ công',
  },

  // Manual Appointments
  manualAppointment: {
    title: 'Đặt lịch thủ công',
    noTasks: 'Không có công việc nào cần đặt lịch thủ công',
    patient: 'Bệnh nhân',
    task: 'Công việc',
    time: 'Thời gian',
    doctor: 'Bác sĩ',
    selectDoctor: 'Chọn bác sĩ',
    selectTime: 'Chọn giờ',
    add: 'Thêm lịch',
    conflictDoctor: 'Bác sĩ {name} đã có lịch lúc {time}',
    conflictPatient: 'Bệnh nhân {name} đã có lịch lúc {time}',
    conflictTimeBounds: 'Thời gian {time} nằm ngoài ca làm việc',
  },

  // Doctors
  doctor: {
    name: 'Tên bác sĩ',
    canDo: 'Công việc có thể làm',
    add: 'Thêm bác sĩ',
  },

  // Patients
  patient: {
    id: 'STT',
    name: 'Tên bệnh nhân',
    needs: 'Công việc cần làm',
    add: 'Thêm bệnh nhân',
    list: 'Danh sách bệnh nhân',
  },

  // Daily
  daily: {
    selectDoctors: 'Chọn bác sĩ làm việc hôm nay',
    generateSchedule: 'Tạo lịch',
  },

  // Results
  results: {
    doctorTimeline: 'Lịch theo bác sĩ',
    patientJourney: 'Lịch theo bệnh nhân',
    unhandled: 'Không thể xếp lịch',
    completed: 'Hoàn thành',
    noDoctor: 'Không có bác sĩ nào thực hiện được',
    noSchedule: 'Chưa có lịch. Vui lòng tạo lịch từ tab "Lịch hàng ngày".',
  },

  // Time
  time: {
    label: 'Thời gian',
    minutes: 'phút',
  },

  // Messages
  messages: {
    confirmDelete: 'Bạn có chắc chắn muốn xóa?',
    noTasks: 'Chưa có công việc nào',
    noDoctors: 'Chưa có bác sĩ nào',
    noPatients: 'Chưa có bệnh nhân nào',
    noWorkingDoctors: 'Chưa chọn bác sĩ làm việc',
  },
}
