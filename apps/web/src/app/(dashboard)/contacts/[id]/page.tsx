import { ContactDetailClient } from './contact-detail-client';

export function generateStaticParams() {
  return [{ id: '_placeholder' }];
}

export default function ContactDetailPage() {
  return <ContactDetailClient />;
}
