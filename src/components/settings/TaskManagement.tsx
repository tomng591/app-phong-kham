import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Task } from '../../types';
import { Table } from '../ui/Table';
import { Button } from '../ui/Button';
import { Modal, ConfirmModal } from '../ui/Modal';
import { TaskForm } from './TaskForm';
import { LABELS } from '../../constants/labels';

export function TaskManagement() {
  const { tasks, addTask, updateTask, deleteTask } = useApp();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);

  const handleAdd = () => {
    setEditingTask(null);
    setIsFormOpen(true);
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  const handleSave = (data: Omit<Task, 'id'>) => {
    if (editingTask) {
      updateTask({ ...data, id: editingTask.id });
    } else {
      addTask(data);
    }
    setIsFormOpen(false);
    setEditingTask(null);
  };

  const handleDelete = () => {
    if (deletingTask) {
      deleteTask(deletingTask.id);
      setDeletingTask(null);
    }
  };

  const columns = [
    { header: LABELS.task.name, accessor: 'name' as const },
    { header: LABELS.task.doctorDuration, accessor: 'doctor_duration' as const },
    { header: LABELS.task.patientDuration, accessor: 'patient_duration' as const },
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="mb-4">
        <Button onClick={handleAdd}>+ {LABELS.task.add}</Button>
      </div>

      <Table
        columns={columns}
        data={tasks}
        keyExtractor={(task) => task.id}
        emptyMessage={LABELS.messages.noTasks}
        actions={(task) => (
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" size="sm" onClick={() => handleEdit(task)}>
              {LABELS.actions.edit}
            </Button>
            <Button variant="danger" size="sm" onClick={() => setDeletingTask(task)}>
              {LABELS.actions.delete}
            </Button>
          </div>
        )}
      />

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingTask ? `${LABELS.actions.edit} ${LABELS.task.name.toLowerCase()}` : LABELS.task.add}
      >
        <TaskForm
          initialData={editingTask || undefined}
          onSave={handleSave}
          onCancel={() => setIsFormOpen(false)}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingTask}
        onClose={() => setDeletingTask(null)}
        onConfirm={handleDelete}
        title={LABELS.actions.delete}
        message={LABELS.messages.confirmDelete}
      />
    </div>
  );
}
