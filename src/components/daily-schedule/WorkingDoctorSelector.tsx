import { SessionType } from '../../types';
import { useApp } from '../../context/AppContext';
import { Checkbox } from '../ui/Checkbox';
import { LABELS } from '../../constants/labels';

interface WorkingDoctorSelectorProps {
  session: SessionType;
}

export function WorkingDoctorSelector({ session }: WorkingDoctorSelectorProps) {
  const { doctors, morning, afternoon, setWorkingDoctors } = useApp();

  const workingDoctorIds = session === 'morning' ? morning.workingDoctorIds : afternoon.workingDoctorIds;

  const handleToggle = (doctorId: string) => {
    if (workingDoctorIds.includes(doctorId)) {
      setWorkingDoctors(session, workingDoctorIds.filter((id) => id !== doctorId));
    } else {
      setWorkingDoctors(session, [...workingDoctorIds, doctorId]);
    }
  };

  const handleSelectAll = () => {
    if (workingDoctorIds.length === doctors.length) {
      setWorkingDoctors(session, []);
    } else {
      setWorkingDoctors(session, doctors.map((d) => d.id));
    }
  };

  if (doctors.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 text-center text-gray-500">
        {LABELS.messages.noDoctors}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="mb-3 pb-3 border-b border-gray-200">
        <Checkbox
          label={`Chọn tất cả (${workingDoctorIds.length}/${doctors.length})`}
          checked={workingDoctorIds.length === doctors.length}
          onChange={handleSelectAll}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {doctors.map((doctor) => (
          <Checkbox
            key={doctor.id}
            label={doctor.name}
            checked={workingDoctorIds.includes(doctor.id)}
            onChange={() => handleToggle(doctor.id)}
          />
        ))}
      </div>
    </div>
  );
}
