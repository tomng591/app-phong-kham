import { createContext, useContext, ReactNode, useCallback, useEffect } from 'react';
import { Settings, Task, Doctor, Patient, ScheduleResult, TabType, SessionType, ManualAppointment, ScheduleHistoryEntry, ScheduleHistoryIndex } from '../types';
import { useLocalStorage, STORAGE_KEYS } from '../hooks/useLocalStorage';
import { generateId } from '../utils/idGenerator';
import { generateSchedule } from '../utils/scheduler';
import { useState } from 'react';

const RETENTION_DAYS = 90;

interface SessionData {
  patients: Patient[];
  workingDoctorIds: string[];
  manualAppointments: ManualAppointment[];
  scheduleResult: ScheduleResult | null;
}

interface AppContextType {
  // Data
  settings: Settings;
  tasks: Task[];
  doctors: Doctor[];
  activeTab: TabType;

  // Session data
  morning: SessionData;
  afternoon: SessionData;

  // Settings actions
  updateSettings: (settings: Settings) => void;

  // Task actions
  addTask: (task: Omit<Task, 'id'>) => void;
  updateTask: (task: Task) => void;
  deleteTask: (id: string) => void;

  // Doctor actions
  addDoctor: (doctor: Omit<Doctor, 'id'>) => void;
  updateDoctor: (doctor: Doctor) => void;
  deleteDoctor: (id: string) => void;

  // Patient actions (session-specific)
  addPatient: (session: SessionType, patient: Omit<Patient, 'id' | 'daily_id'>) => void;
  updatePatient: (session: SessionType, patient: Patient) => void;
  deletePatient: (session: SessionType, id: string) => void;
  clearPatients: (session: SessionType) => void;

  // Daily actions (session-specific)
  setWorkingDoctors: (session: SessionType, ids: string[]) => void;

  // Manual appointment actions (session-specific)
  addManualAppointment: (session: SessionType, appointment: Omit<ManualAppointment, 'id'>) => void;
  updateManualAppointment: (session: SessionType, appointment: ManualAppointment) => void;
  deleteManualAppointment: (session: SessionType, id: string) => void;
  clearManualAppointments: (session: SessionType) => void;

  // Schedule actions
  runScheduler: (session: SessionType) => void;
  clearSchedule: (session: SessionType) => void;
  clearAllSchedules: () => void;

  // History actions
  historyIndex: ScheduleHistoryIndex;
  getHistoryEntry: (date: string, session: SessionType) => ScheduleHistoryEntry | null;
  deleteHistoryEntry: (date: string, session: SessionType) => void;

  // Navigation
  setActiveTab: (tab: TabType) => void;
}

const AppContext = createContext<AppContextType | null>(null);

const DEFAULT_SETTINGS: Settings = {
  break_between_tasks: 5,
  break_between_tasks_doctor: 0,
};

export function AppProvider({ children }: { children: ReactNode }) {
  // Persistent data
  const [settings, setSettings] = useLocalStorage<Settings>(
    STORAGE_KEYS.SETTINGS,
    DEFAULT_SETTINGS
  );
  const [tasks, setTasks] = useLocalStorage<Task[]>(STORAGE_KEYS.TASKS, []);
  const [doctors, setDoctors] = useLocalStorage<Doctor[]>(STORAGE_KEYS.DOCTORS, []);

  // Morning session data
  const [morningPatients, setMorningPatients] = useLocalStorage<Patient[]>(
    STORAGE_KEYS.MORNING_PATIENTS,
    []
  );
  const [morningWorkingDoctorIds, setMorningWorkingDoctorIds] = useLocalStorage<string[]>(
    STORAGE_KEYS.MORNING_WORKING_DOCTORS,
    []
  );

  // Afternoon session data
  const [afternoonPatients, setAfternoonPatients] = useLocalStorage<Patient[]>(
    STORAGE_KEYS.AFTERNOON_PATIENTS,
    []
  );
  const [afternoonWorkingDoctorIds, setAfternoonWorkingDoctorIds] = useLocalStorage<string[]>(
    STORAGE_KEYS.AFTERNOON_WORKING_DOCTORS,
    []
  );

  // Manual appointments (persisted)
  const [morningManualAppointments, setMorningManualAppointments] = useLocalStorage<ManualAppointment[]>(
    STORAGE_KEYS.MORNING_MANUAL_APPOINTMENTS,
    []
  );
  const [afternoonManualAppointments, setAfternoonManualAppointments] = useLocalStorage<ManualAppointment[]>(
    STORAGE_KEYS.AFTERNOON_MANUAL_APPOINTMENTS,
    []
  );

  // History (persisted)
  const [historyIndex, setHistoryIndex] = useLocalStorage<ScheduleHistoryIndex>(
    STORAGE_KEYS.HISTORY_INDEX,
    {}
  );
  const [historyData, setHistoryData] = useLocalStorage<ScheduleHistoryEntry[]>(
    STORAGE_KEYS.HISTORY_DATA,
    []
  );

  // Auto-cleanup old history entries on mount
  useEffect(() => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);
    const cutoffStr = cutoffDate.toISOString().slice(0, 10);

    // Find dates to remove
    const datesToRemove = Object.keys(historyIndex).filter(date => date < cutoffStr);

    if (datesToRemove.length > 0) {
      // Get IDs to remove
      const idsToRemove = new Set<string>();
      datesToRemove.forEach(date => {
        const entry = historyIndex[date];
        if (entry?.morning) idsToRemove.add(entry.morning);
        if (entry?.afternoon) idsToRemove.add(entry.afternoon);
      });

      // Update index
      const newIndex = { ...historyIndex };
      datesToRemove.forEach(date => delete newIndex[date]);
      setHistoryIndex(newIndex);

      // Update data
      setHistoryData(prev => prev.filter(entry => !idsToRemove.has(entry.id)));
    }
  }, []); // Only run on mount

  // Non-persistent state
  const [morningScheduleResult, setMorningScheduleResult] = useState<ScheduleResult | null>(null);
  const [afternoonScheduleResult, setAfternoonScheduleResult] = useState<ScheduleResult | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('settings');

  // Settings actions
  const updateSettings = useCallback((newSettings: Settings) => {
    setSettings(newSettings);
  }, [setSettings]);

  // Task actions
  const addTask = useCallback((task: Omit<Task, 'id'>) => {
    const newTask: Task = { ...task, id: generateId() };
    setTasks((prev) => [...prev, newTask]);
  }, [setTasks]);

  const updateTask = useCallback((task: Task) => {
    setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
  }, [setTasks]);

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    // Also remove this task from doctors' can_do lists
    setDoctors((prev) =>
      prev.map((d) => ({
        ...d,
        can_do: d.can_do.filter((taskId) => taskId !== id),
      }))
    );
    // Also remove this task from patients' needs lists (both sessions)
    setMorningPatients((prev) =>
      prev.map((p) => ({
        ...p,
        needs: p.needs.filter((taskId) => taskId !== id),
      }))
    );
    setAfternoonPatients((prev) =>
      prev.map((p) => ({
        ...p,
        needs: p.needs.filter((taskId) => taskId !== id),
      }))
    );
    // Also remove from manual appointments (both sessions)
    setMorningManualAppointments((prev) => prev.filter((a) => a.task_id !== id));
    setAfternoonManualAppointments((prev) => prev.filter((a) => a.task_id !== id));
  }, [setTasks, setDoctors, setMorningPatients, setAfternoonPatients, setMorningManualAppointments, setAfternoonManualAppointments]);

  // Doctor actions
  const addDoctor = useCallback((doctor: Omit<Doctor, 'id'>) => {
    const newDoctor: Doctor = { ...doctor, id: generateId() };
    setDoctors((prev) => [...prev, newDoctor]);
  }, [setDoctors]);

  const updateDoctor = useCallback((doctor: Doctor) => {
    setDoctors((prev) => prev.map((d) => (d.id === doctor.id ? doctor : d)));
  }, [setDoctors]);

  const deleteDoctor = useCallback((id: string) => {
    setDoctors((prev) => prev.filter((d) => d.id !== id));
    // Also remove from working doctors (both sessions)
    setMorningWorkingDoctorIds((prev) => prev.filter((dId) => dId !== id));
    setAfternoonWorkingDoctorIds((prev) => prev.filter((dId) => dId !== id));
    // Also remove from manual appointments (both sessions)
    setMorningManualAppointments((prev) => prev.filter((a) => a.doctor_id !== id));
    setAfternoonManualAppointments((prev) => prev.filter((a) => a.doctor_id !== id));
  }, [setDoctors, setMorningWorkingDoctorIds, setAfternoonWorkingDoctorIds, setMorningManualAppointments, setAfternoonManualAppointments]);

  // Helper to get next daily_id across both sessions
  const getNextDailyId = useCallback(() => {
    const allPatients = [...morningPatients, ...afternoonPatients];
    if (allPatients.length === 0) return 1;
    const maxId = Math.max(...allPatients.map((p) => p.daily_id || 0));
    return maxId + 1;
  }, [morningPatients, afternoonPatients]);

  // Patient actions (session-specific)
  const addPatient = useCallback((session: SessionType, patient: Omit<Patient, 'id' | 'daily_id'>) => {
    const daily_id = getNextDailyId();
    const newPatient: Patient = { ...patient, id: generateId(), daily_id };
    if (session === 'morning') {
      setMorningPatients((prev) => [...prev, newPatient]);
    } else {
      setAfternoonPatients((prev) => [...prev, newPatient]);
    }
  }, [setMorningPatients, setAfternoonPatients, getNextDailyId]);

  const updatePatient = useCallback((session: SessionType, patient: Patient) => {
    if (session === 'morning') {
      setMorningPatients((prev) => prev.map((p) => (p.id === patient.id ? patient : p)));
    } else {
      setAfternoonPatients((prev) => prev.map((p) => (p.id === patient.id ? patient : p)));
    }
  }, [setMorningPatients, setAfternoonPatients]);

  const deletePatient = useCallback((session: SessionType, id: string) => {
    if (session === 'morning') {
      setMorningPatients((prev) => prev.filter((p) => p.id !== id));
      // Also remove from manual appointments
      setMorningManualAppointments((prev) => prev.filter((a) => a.patient_id !== id));
    } else {
      setAfternoonPatients((prev) => prev.filter((p) => p.id !== id));
      // Also remove from manual appointments
      setAfternoonManualAppointments((prev) => prev.filter((a) => a.patient_id !== id));
    }
  }, [setMorningPatients, setAfternoonPatients, setMorningManualAppointments, setAfternoonManualAppointments]);

  const clearPatients = useCallback((session: SessionType) => {
    if (session === 'morning') {
      setMorningPatients([]);
      setMorningManualAppointments([]);
    } else {
      setAfternoonPatients([]);
      setAfternoonManualAppointments([]);
    }
  }, [setMorningPatients, setAfternoonPatients, setMorningManualAppointments, setAfternoonManualAppointments]);

  // Daily actions (session-specific)
  const setWorkingDoctors = useCallback((session: SessionType, ids: string[]) => {
    if (session === 'morning') {
      setMorningWorkingDoctorIds(ids);
    } else {
      setAfternoonWorkingDoctorIds(ids);
    }
  }, [setMorningWorkingDoctorIds, setAfternoonWorkingDoctorIds]);

  // Manual appointment actions
  const addManualAppointment = useCallback((session: SessionType, appointment: Omit<ManualAppointment, 'id'>) => {
    const newAppointment: ManualAppointment = { ...appointment, id: generateId() };
    if (session === 'morning') {
      setMorningManualAppointments((prev) => [...prev, newAppointment]);
    } else {
      setAfternoonManualAppointments((prev) => [...prev, newAppointment]);
    }
  }, [setMorningManualAppointments, setAfternoonManualAppointments]);

  const updateManualAppointment = useCallback((session: SessionType, appointment: ManualAppointment) => {
    if (session === 'morning') {
      setMorningManualAppointments((prev) => prev.map((a) => (a.id === appointment.id ? appointment : a)));
    } else {
      setAfternoonManualAppointments((prev) => prev.map((a) => (a.id === appointment.id ? appointment : a)));
    }
  }, [setMorningManualAppointments, setAfternoonManualAppointments]);

  const deleteManualAppointment = useCallback((session: SessionType, id: string) => {
    if (session === 'morning') {
      setMorningManualAppointments((prev) => prev.filter((a) => a.id !== id));
    } else {
      setAfternoonManualAppointments((prev) => prev.filter((a) => a.id !== id));
    }
  }, [setMorningManualAppointments, setAfternoonManualAppointments]);

  const clearManualAppointments = useCallback((session: SessionType) => {
    if (session === 'morning') {
      setMorningManualAppointments([]);
    } else {
      setAfternoonManualAppointments([]);
    }
  }, [setMorningManualAppointments, setAfternoonManualAppointments]);

  // History actions (defined before runScheduler since it depends on saveToHistory)
  const saveToHistory = useCallback((session: SessionType, result: ScheduleResult) => {
    const today = new Date().toISOString().slice(0, 10);
    const workingDoctorIds = session === 'morning' ? morningWorkingDoctorIds : afternoonWorkingDoctorIds;
    const patients = session === 'morning' ? morningPatients : afternoonPatients;
    const workingDoctors = doctors.filter(d => workingDoctorIds.includes(d.id));

    const entryId = generateId();
    const newEntry: ScheduleHistoryEntry = {
      id: entryId,
      date: today,
      session,
      createdAt: new Date().toISOString(),
      scheduleResult: result,
      patients: [...patients],
      tasks: [...tasks],
      doctors: [...workingDoctors],
      workingDoctorIds: [...workingDoctorIds],
    };

    // Check if there's an existing entry to replace
    const existingId = historyIndex[today]?.[session];

    // Update data - remove old entry if exists, add new one
    setHistoryData(prev => {
      const filtered = existingId ? prev.filter(e => e.id !== existingId) : prev;
      return [...filtered, newEntry];
    });

    // Update index
    setHistoryIndex(prev => ({
      ...prev,
      [today]: {
        ...prev[today],
        [session]: entryId,
      },
    }));
  }, [doctors, tasks, morningPatients, afternoonPatients, morningWorkingDoctorIds, afternoonWorkingDoctorIds, historyIndex, setHistoryData, setHistoryIndex]);

  // Schedule actions
  const runScheduler = useCallback((session: SessionType) => {
    const workingDoctorIds = session === 'morning' ? morningWorkingDoctorIds : afternoonWorkingDoctorIds;
    const patients = session === 'morning' ? morningPatients : afternoonPatients;
    const manualAppointments = session === 'morning' ? morningManualAppointments : afternoonManualAppointments;
    const workingDoctors = doctors.filter((d) => workingDoctorIds.includes(d.id));
    const result = generateSchedule(settings, tasks, workingDoctors, patients, manualAppointments, session);

    if (session === 'morning') {
      setMorningScheduleResult(result);
    } else {
      setAfternoonScheduleResult(result);
    }

    // Auto-save to history
    saveToHistory(session, result);

    setActiveTab('results');
  }, [settings, tasks, doctors, morningPatients, afternoonPatients, morningWorkingDoctorIds, afternoonWorkingDoctorIds, morningManualAppointments, afternoonManualAppointments, saveToHistory]);

  const clearSchedule = useCallback((session: SessionType) => {
    if (session === 'morning') {
      setMorningScheduleResult(null);
    } else {
      setAfternoonScheduleResult(null);
    }
  }, []);

  const clearAllSchedules = useCallback(() => {
    setMorningScheduleResult(null);
    setAfternoonScheduleResult(null);
  }, []);

  const getHistoryEntry = useCallback((date: string, session: SessionType): ScheduleHistoryEntry | null => {
    const entryId = historyIndex[date]?.[session];
    if (!entryId) return null;
    return historyData.find(e => e.id === entryId) || null;
  }, [historyIndex, historyData]);

  const deleteHistoryEntry = useCallback((date: string, session: SessionType) => {
    const entryId = historyIndex[date]?.[session];
    if (!entryId) return;

    // Update data
    setHistoryData(prev => prev.filter(e => e.id !== entryId));

    // Update index
    setHistoryIndex(prev => {
      const newIndex = { ...prev };
      if (newIndex[date]) {
        delete newIndex[date][session];
        // Remove date entry if no sessions left
        if (!newIndex[date].morning && !newIndex[date].afternoon) {
          delete newIndex[date];
        }
      }
      return newIndex;
    });
  }, [historyIndex, setHistoryData, setHistoryIndex]);

  // Session data objects
  const morning: SessionData = {
    patients: morningPatients,
    workingDoctorIds: morningWorkingDoctorIds,
    manualAppointments: morningManualAppointments,
    scheduleResult: morningScheduleResult,
  };

  const afternoon: SessionData = {
    patients: afternoonPatients,
    workingDoctorIds: afternoonWorkingDoctorIds,
    manualAppointments: afternoonManualAppointments,
    scheduleResult: afternoonScheduleResult,
  };

  const value: AppContextType = {
    settings,
    tasks,
    doctors,
    activeTab,
    morning,
    afternoon,
    updateSettings,
    addTask,
    updateTask,
    deleteTask,
    addDoctor,
    updateDoctor,
    deleteDoctor,
    addPatient,
    updatePatient,
    deletePatient,
    clearPatients,
    setWorkingDoctors,
    addManualAppointment,
    updateManualAppointment,
    deleteManualAppointment,
    clearManualAppointments,
    runScheduler,
    clearSchedule,
    clearAllSchedules,
    historyIndex,
    getHistoryEntry,
    deleteHistoryEntry,
    setActiveTab,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
