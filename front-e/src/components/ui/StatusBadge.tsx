import { JobStatus } from '@/types';

const statusColors: Record<JobStatus, string> = {
  PENDING: 'bg-gray-200 text-gray-800',
  TRAVELING: 'bg-blue-200 text-blue-800',
  STARTED: 'bg-yellow-200 text-yellow-800',
  ON_HOLD: 'bg-orange-200 text-orange-800',
  COMPLETED: 'bg-green-200 text-green-800',
  CANCEL: 'bg-red-200 text-red-800',
};

export default function StatusBadge({ status }: { status: JobStatus }) {
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[status]}`}>
      {status}
    </span>
  );
}
