'use client';

import { useState } from 'react';
import { Plus, Search, Filter, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useRecords } from '@/hooks/use-records';
import { getInitials, formatRelativeTime } from '@/lib/utils';

export default function ContactsPage() {
  const [search, setSearch] = useState('');

  // In real app, we'd get objectId from useObjectByName('contacts')
  const { data, isLoading } = useRecords({
    // objectId: contactsObjectId,
    search: search || undefined,
  });

  // Demo data for initial display
  const demoContacts = [
    { id: '1', name: 'John Smith', email: 'john@company.com', company: 'Acme Corp', phone: '+1 555-1234', createdAt: new Date().toISOString() },
    { id: '2', name: 'Sarah Johnson', email: 'sarah@tech.io', company: 'Tech Solutions', phone: '+1 555-5678', createdAt: new Date(Date.now() - 86400000).toISOString() },
    { id: '3', name: 'Michael Brown', email: 'michael@startup.com', company: 'StartupXYZ', phone: '+1 555-9012', createdAt: new Date(Date.now() - 172800000).toISOString() },
  ];

  const contacts = data?.data || demoContacts;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contacts</h1>
          <p className="text-muted-foreground">Manage your contacts and leads</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Contact
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {/* Contacts Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Company</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Phone</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Added</th>
                  <th className="w-12"></th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((contact: any) => (
                  <tr key={contact.id} className="border-b hover:bg-muted/30 cursor-pointer">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {getInitials(contact.name || contact.data?.name || 'U')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{contact.name || contact.data?.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {contact.email || contact.data?.email}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {contact.company || contact.data?.company || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {contact.phone || contact.data?.phone || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {formatRelativeTime(contact.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
