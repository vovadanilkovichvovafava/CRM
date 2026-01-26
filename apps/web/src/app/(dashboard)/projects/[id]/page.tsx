import { ProjectDetailClient } from './project-detail-client';

// Required for static export with dynamic routes
export function generateStaticParams() {
  return [{ id: '_placeholder' }];
}

export default function ProjectDetailPage() {
  return <ProjectDetailClient />;
}
