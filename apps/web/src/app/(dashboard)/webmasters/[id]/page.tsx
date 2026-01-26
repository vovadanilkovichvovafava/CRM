import { WebmasterDetailClient } from './webmaster-detail-client';

// Required for static export with dynamic routes
export function generateStaticParams() {
  return [{ id: '_placeholder' }];
}

export default function WebmasterDetailPage() {
  return <WebmasterDetailClient />;
}
