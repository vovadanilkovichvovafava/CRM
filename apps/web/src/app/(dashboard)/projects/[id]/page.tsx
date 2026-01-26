import { ProjectDetailClient } from './project-detail-client';

export function generateStaticParams() {
  return [{ id: '_placeholder' }];
}

export default function ProjectDetailPage() {
  return <ProjectDetailClient />;
}
