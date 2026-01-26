import { WebmasterDetailClient } from './webmaster-detail-client';

export function generateStaticParams() {
  return [{ id: '_placeholder' }];
}

export default function WebmasterDetailPage() {
  return <WebmasterDetailClient />;
}
