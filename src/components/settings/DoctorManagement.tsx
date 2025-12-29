import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Doctor } from '../../types';
import { Table } from '../ui/Table';
import { Button } from '../ui/Button';
import { Modal, ConfirmModal } from '../ui/Modal';
import { Badge, getBadgeColor } from '../ui/Badge';
import { DoctorForm } from './DoctorForm';
import { LABELS } from '../../constants/labels';

export function DoctorManagement() {
  const { doctors, tasks, addDoctor, updateDoctor, deleteDoctor } = useApp();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [deletingDoctor, setDeletingDoctor] = useState<Doctor | null>(null);

  const handleAdd = () => {
    setEditingDoctor(null);
    setIsFormOpen(true);
  };

  const handleEdit = (doctor: Doctor) => {
    setEditingDoctor(doctor);
    setIsFormOpen(true);
  };

  const handleSave = (data: Omit<Doctor, 'id'>) => {
    if (editingDoctor) {
      updateDoctor({ ...data, id: editingDoctor.id });
    } else {
      addDoctor(data);
    }
    setIsFormOpen(false);
    setEditingDoctor(null);
  };

  const handleDelete = () => {
    if (deletingDoctor) {
      deleteDoctor(deletingDoctor.id);
      setDeletingDoctor(null);
    }
  };

  const getTaskName = (taskId: string) => {
    return tasks.find((t) => t.id === taskId)?.name || taskId;
  };

  const columns = [
    { header: LABELS.doctor.name, accessor: 'name' as const },
    {
      header: LABELS.doctor.canDo,
      accessor: (doctor: Doctor) => (
        <div className="flex flex-wrap gap-1">
          {doctor.can_do.length === 0 ? (
            <span className="text-gray-400 text-sm">-</span>
          ) : (
            doctor.can_do.map((taskId) => {
              const taskIndex = tasks.findIndex((t) => t.id === taskId);
              return (
                <Badge key={taskId} color={getBadgeColor(taskIndex)}>
                  {getTaskName(taskId)}
                </Badge>
              );
            })
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="mb-4">
        <Button onClick={handleAdd}>+ {LABELS.doctor.add}</Button>
      </div>

      <Table
        columns={columns}
        data={doctors}
        keyExtractor={(doctor) => doctor.id}
        emptyMessage={LABELS.messages.noDoctors}
        actions={(doctor) => (
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" size="sm" onClick={() => handleEdit(doctor)}>
              {LABELS.actions.edit}
            </Button>
            <Button variant="danger" size="sm" onClick={() => setDeletingDoctor(doctor)}>
              {LABELS.actions.delete}
            </Button>
          </div>
        )}
      />

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingDoctor ? `${LABELS.actions.edit} ${LABELS.doctor.name.toLowerCase()}` : LABELS.doctor.add}
      >
        <DoctorForm
          initialData={editingDoctor || undefined}
          onSave={handleSave}
          onCancel={() => setIsFormOpen(false)}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingDoctor}
        onClose={() => setDeletingDoctor(null)}
        onConfirm={handleDelete}
        title={LABELS.actions.delete}
        message={LABELS.messages.confirmDelete}
      />
    </div>
  );
}
