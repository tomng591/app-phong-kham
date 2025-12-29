import { createContext, useContext, ReactNode, useCallback } from 'react';
import { Settings, Task, Doctor, Patient, ScheduleResult, TabType } from '../types';
import { useLocalStorage, STORAGE_KEYS } from '../hooks/useLocalStorage';
import { generateId } from '../utils/idGenerator';
import { generateSchedule } from '../utils/scheduler';
import { useState } from 'react';

interface AppContextType {
  // Data
  settings: Settings;
  tasks: Task[];
  doctors: Doctor[];
  patients: Patient[];
  workingDoctorIds: string[];
  scheduleResult: ScheduleResult | null;
  activeTab: TabType;

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

  // Patient actions
  addPatient: (patient: Omit<Patient, 'id'>) => void;
  updatePatient: (patient: Patient) => void;
  deletePatient: (id: string) => void;
  clearPatients: () => void;

  // Daily actions
  setWorkingDoctors: (ids: string[]) => void;

  // Schedule actions
  runScheduler: () => void;
  clearSchedule: () => void;

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
  const [patients, setPatients] = useLocalStorage<Patient[]>(
    STORAGE_KEYS.DAILY_PATIENTS,
    []
  );
  const [workingDoctorIds, setWorkingDoctorIds] = useLocalStorage<string[]>(
    STORAGE_KEYS.WORKING_DOCTORS,
    []
  );

  // Non-persistent state
  const [scheduleResult, setScheduleResult] = useState<ScheduleResult | null>(null);
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
    // Also remove this task from patients' needs lists
    setPatients((prev) =>
      prev.map((p) => ({
        ...p,
        needs: p.needs.filter((taskId) => taskId !== id),
      }))
    );
  }, [setTasks, setDoctors, setPatients]);

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
    // Also remove from working doctors
    setWorkingDoctorIds((prev) => prev.filter((dId) => dId !== id));
  }, [setDoctors, setWorkingDoctorIds]);

  // Patient actions
  const addPatient = useCallback((patient: Omit<Patient, 'id'>) => {
    const newPatient: Patient = { ...patient, id: generateId() };
    setPatients((prev) => [...prev, newPatient]);
  }, [setPatients]);

  const updatePatient = useCallback((patient: Patient) => {
    setPatients((prev) => prev.map((p) => (p.id === patient.id ? patient : p)));
  }, [setPatients]);

  const deletePatient = useCallback((id: string) => {
    setPatients((prev) => prev.filter((p) => p.id !== id));
  }, [setPatients]);

  const clearPatients = useCallback(() => {
    setPatients([]);
  }, [setPatients]);

  // Daily actions
  const setWorkingDoctors = useCallback((ids: string[]) => {
    setWorkingDoctorIds(ids);
  }, [setWorkingDoctorIds]);

  // Schedule actions
  const runScheduler = useCallback(() => {
    const workingDoctors = doctors.filter((d) => workingDoctorIds.includes(d.id));
    const result = generateSchedule(settings, tasks, workingDoctors, patients);
    setScheduleResult(result);
    setActiveTab('results');
  }, [settings, tasks, doctors, patients, workingDoctorIds]);

  const clearSchedule = useCallback(() => {
    setScheduleResult(null);
  }, []);

  const value: AppContextType = {
    settings,
    tasks,
    doctors,
    patients,
    workingDoctorIds,
    scheduleResult,
    activeTab,
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
