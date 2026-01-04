import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Patient, SessionType } from '../../types';
import { Table } from '../ui/Table';
import { Button } from '../ui/Button';
import { Modal, ConfirmModal } from '../ui/Modal';
import { Badge, getBadgeColor } from '../ui/Badge';
import { PatientForm } from './PatientForm';
import { LABELS } from '../../constants/labels';

interface PatientListProps {
  session: SessionType;
}

export function PatientList({ session }: PatientListProps) {
  const { morning, afternoon, tasks, addPatient, updatePatient, deletePatient, clearPatients } = useApp();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [deletingPatient, setDeletingPatient] = useState<Patient | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const patients = session === 'morning' ? morning.patients : afternoon.patients;

  const handleAdd = () => {
    setEditingPatient(null);
    setIsFormOpen(true);
  };

  const handleEdit = (patient: Patient) => {
    setEditingPatient(patient);
    setIsFormOpen(true);
  };

  const handleSave = (data: Omit<Patient, 'id' | 'daily_id'>) => {
    if (editingPatient) {
      updatePatient(session, { ...data, id: editingPatient.id, daily_id: editingPatient.daily_id });
    } else {
      addPatient(session, data);
    }
    setIsFormOpen(false);
    setEditingPatient(null);
  };

  const handleDelete = () => {
    if (deletingPatient) {
      deletePatient(session, deletingPatient.id);
      setDeletingPatient(null);
    }
  };

  const handleClearAll = () => {
    clearPatients(session);
    setShowClearConfirm(false);
  };

  const getTaskName = (taskId: string) => {
    return tasks.find((t) => t.id === taskId)?.name || taskId;
  };

  const columns = [
    { header: LABELS.patient.id, accessor: 'daily_id' as const, className: 'w-16 text-center' },
    { header: LABELS.patient.name, accessor: 'name' as const },
    {
      header: LABELS.patient.needs,
      accessor: (patient: Patient) => (
        <div className="flex flex-wrap gap-1">
          {patient.needs.length === 0 ? (
            <span className="text-gray-400 text-sm">-</span>
          ) : (
            patient.needs.map((taskId) => {
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
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="mb-4 flex gap-2">
        <Button onClick={handleAdd} size="sm">+ {LABELS.patient.add}</Button>
        {patients.length > 0 && (
          <Button variant="secondary" size="sm" onClick={() => setShowClearConfirm(true)}>
            Xóa tất cả
          </Button>
        )}
      </div>

      <Table
        columns={columns}
        data={patients}
        keyExtractor={(patient) => patient.id}
        emptyMessage={LABELS.messages.noPatients}
        actions={(patient) => (
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" size="sm" onClick={() => handleEdit(patient)}>
              {LABELS.actions.edit}
            </Button>
            <Button variant="danger" size="sm" onClick={() => setDeletingPatient(patient)}>
              {LABELS.actions.delete}
            </Button>
          </div>
        )}
      />

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingPatient ? `${LABELS.actions.edit} ${LABELS.patient.name.toLowerCase()}` : LABELS.patient.add}
      >
        <PatientForm
          initialData={editingPatient || undefined}
          onSave={handleSave}
          onCancel={() => setIsFormOpen(false)}
        />
      </Modal>

      {/* Delete Single Patient Modal */}
      <ConfirmModal
        isOpen={!!deletingPatient}
        onClose={() => setDeletingPatient(null)}
        onConfirm={handleDelete}
        title={LABELS.actions.delete}
        message={LABELS.messages.confirmDelete}
      />

      {/* Clear All Patients Modal */}
      <ConfirmModal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={handleClearAll}
        title="Xóa tất cả bệnh nhân"
        message="Bạn có chắc chắn muốn xóa tất cả bệnh nhân?"
      />
    </div>
  );
}
