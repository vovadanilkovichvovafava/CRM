import { TaskDetailClient } from './task-detail-client';

export function generateStaticParams() {
  return [{ id: '_placeholder' }];
}

export default function TaskDetailPage() {
  return <TaskDetailClient />;
}
