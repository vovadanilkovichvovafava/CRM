import { TaskDetailClient } from './task-detail-client';

// Required for static export with dynamic routes
export function generateStaticParams() {
  return [{ id: '_placeholder' }];
}

export default function TaskDetailPage() {
  return <TaskDetailClient />;
}
