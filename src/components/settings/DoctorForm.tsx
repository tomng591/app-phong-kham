import { useState } from 'react';
import { Doctor } from '../../types';
import { useApp } from '../../context/AppContext';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { MultiSelect } from '../ui/MultiSelect';
import { LABELS } from '../../constants/labels';

interface DoctorFormProps {
  initialData?: Doctor;
  onSave: (data: Omit<Doctor, 'id'>) => void;
  onCancel: () => void;
}

export function DoctorForm({ initialData, onSave, onCancel }: DoctorFormProps) {
  const { tasks } = useApp();
  const [name, setName] = useState(initialData?.name || '');
  const [canDo, setCanDo] = useState<string[]>(initialData?.can_do || []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      can_do: canDo,
    });
  };

  const taskOptions = tasks.map((task) => ({
    value: task.id,
    label: task.name,
  }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label={LABELS.doctor.name}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="VD: BS. Nguyễn Văn A"
        required
        autoFocus
      />

      <MultiSelect
        label={LABELS.doctor.canDo}
        options={taskOptions}
        value={canDo}
        onChange={setCanDo}
        placeholder="Chọn công việc..."
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
