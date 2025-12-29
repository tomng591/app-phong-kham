import { useState } from 'react';
import { Patient } from '../../types';
import { useApp } from '../../context/AppContext';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { MultiSelect } from '../ui/MultiSelect';
import { LABELS } from '../../constants/labels';

interface PatientFormProps {
  initialData?: Patient;
  onSave: (data: Omit<Patient, 'id'>) => void;
  onCancel: () => void;
}

export function PatientForm({ initialData, onSave, onCancel }: PatientFormProps) {
  const { tasks } = useApp();
  const [name, setName] = useState(initialData?.name || '');
  const [needs, setNeeds] = useState<string[]>(initialData?.needs || []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      needs: needs,
    });
  };

  const taskOptions = tasks.map((task) => ({
    value: task.id,
    label: task.name,
  }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label={LABELS.patient.name}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="VD: Nguyễn Văn A"
        required
        autoFocus
      />

      <MultiSelect
        label={LABELS.patient.needs}
        options={taskOptions}
        value={needs}
        onChange={setNeeds}
        placeholder="Chọn công việc cần làm..."
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
