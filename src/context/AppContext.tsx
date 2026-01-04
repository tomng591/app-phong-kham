import { createContext, useContext, ReactNode, useCallback } from 'react';
import { Settings, Task, Doctor, Patient, ScheduleResult, TabType, SessionType } from '../types';
import { useLocalStorage, STORAGE_KEYS } from '../hooks/useLocalStorage';
import { generateId } from '../utils/idGenerator';
import { generateSchedule } from '../utils/scheduler';
import { useState } from 'react';

interface SessionData {
  patients: Patient[];
  workingDoctorIds: string[];
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

  // Schedule actions
  runScheduler: (session: SessionType) => void;
  clearSchedule: (session: SessionType) => void;
  clearAllSchedules: () => void;

  // Navigation
  setActiveTab: (tab: TabType) => void;
}

const AppContext = createContext<AppContextType | null>(null);

const DEFAULT_SETTINGS: Settings = {
  break_between_tasks: 5,
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
  }, [setTasks, setDoctors, setMorningPatients, setAfternoonPatients]);

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
  }, [setDoctors, setMorningWorkingDoctorIds, setAfternoonWorkingDoctorIds]);

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
    } else {
      setAfternoonPatients((prev) => prev.filter((p) => p.id !== id));
    }
  }, [setMorningPatients, setAfternoonPatients]);

  const clearPatients = useCallback((session: SessionType) => {
    if (session === 'morning') {
      setMorningPatients([]);
    } else {
      setAfternoonPatients([]);
    }
  }, [setMorningPatients, setAfternoonPatients]);

  // Daily actions (session-specific)
  const setWorkingDoctors = useCallback((session: SessionType, ids: string[]) => {
    if (session === 'morning') {
      setMorningWorkingDoctorIds(ids);
    } else {
      setAfternoonWorkingDoctorIds(ids);
    }
  }, [setMorningWorkingDoctorIds, setAfternoonWorkingDoctorIds]);

  // Schedule actions
  const runScheduler = useCallback((session: SessionType) => {
    const workingDoctorIds = session === 'morning' ? morningWorkingDoctorIds : afternoonWorkingDoctorIds;
    const patients = session === 'morning' ? morningPatients : afternoonPatients;
    const workingDoctors = doctors.filter((d) => workingDoctorIds.includes(d.id));
    const result = generateSchedule(settings, tasks, workingDoctors, patients);

    if (session === 'morning') {
      setMorningScheduleResult(result);
    } else {
      setAfternoonScheduleResult(result);
    }
    setActiveTab('results');
  }, [settings, tasks, doctors, morningPatients, afternoonPatients, morningWorkingDoctorIds, afternoonWorkingDoctorIds]);

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

  // Session data objects
  const morning: SessionData = {
    patients: morningPatients,
    workingDoctorIds: morningWorkingDoctorIds,
    scheduleResult: morningScheduleResult,
  };

  const afternoon: SessionData = {
    patients: afternoonPatients,
    workingDoctorIds: afternoonWorkingDoctorIds,
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
    runScheduler,
    clearSchedule,
    clearAllSchedules,
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
