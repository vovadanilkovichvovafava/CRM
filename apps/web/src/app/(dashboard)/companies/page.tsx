'use client';

import { Plus, Search, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

export default function CompaniesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Companies</h1>
          <p className="text-muted-foreground">Manage your company accounts</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Company
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search companies..." className="pl-9" />
      </div>

      <Card>
        <CardContent className="flex h-64 items-center justify-center">
          <div className="text-center">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No companies yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Get started by adding your first company
            </p>
            <Button className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Add Company
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
