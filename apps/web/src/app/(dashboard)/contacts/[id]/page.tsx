import { ContactDetailClient } from './contact-detail-client';

// Required for static export with dynamic routes
// Returns empty array - the actual ID will be handled client-side
export function generateStaticParams() {
  // Return a placeholder to generate the page structure
  // Client-side routing will handle the actual contact ID
  return [{ id: '_placeholder' }];
}

export default function ContactDetailPage() {
  return <ContactDetailClient />;
}
