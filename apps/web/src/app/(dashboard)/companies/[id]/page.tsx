import { CompanyDetailClient } from './company-detail-client';

export function generateStaticParams() {
  return [{ id: '_placeholder' }];
}

export default function CompanyDetailPage() {
  return <CompanyDetailClient />;
}
