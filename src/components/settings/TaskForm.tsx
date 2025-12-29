import { useState } from 'react';
import { Task } from '../../types';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { LABELS } from '../../constants/labels';

interface TaskFormProps {
  initialData?: Task;
  onSave: (data: Omit<Task, 'id'>) => void;
  onCancel: () => void;
}

export function TaskForm({ initialData, onSave, onCancel }: TaskFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [doctorDuration, setDoctorDuration] = useState(
    initialData?.doctor_duration?.toString() || '30'
  );
  const [patientDuration, setPatientDuration] = useState(
    initialData?.patient_duration?.toString() || '30'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      doctor_duration: parseInt(doctorDuration) || 30,
      patient_duration: parseInt(patientDuration) || 30,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label={LABELS.task.name}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="VD: Khám tổng quát"
        required
        autoFocus
      />

      <Input
        type="number"
        label={LABELS.task.doctorDuration}
        value={doctorDuration}
        onChange={(e) => setDoctorDuration(e.target.value)}
        min={1}
        required
      />

      <Input
        type="number"
        label={LABELS.task.patientDuration}
        value={patientDuration}
        onChange={(e) => setPatientDuration(e.target.value)}
        min={1}
        required
      />

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          {LABELS.actions.cancel}
        </Button>
        <Button type="submit">{LABELS.actions.save}</Button>
      </div>
    </form>
  );
}
