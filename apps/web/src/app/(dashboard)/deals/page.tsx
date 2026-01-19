'use client';

import { Plus, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const stages = [
  { id: 'lead', name: 'Lead', color: '#6B7280', deals: [] },
  { id: 'qualified', name: 'Qualified', color: '#3B82F6', deals: [] },
  { id: 'proposal', name: 'Proposal', color: '#F59E0B', deals: [] },
  { id: 'negotiation', name: 'Negotiation', color: '#8B5CF6', deals: [] },
  { id: 'closed_won', name: 'Closed Won', color: '#10B981', deals: [] },
];

export default function DealsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Deals</h1>
          <p className="text-muted-foreground">Track your sales pipeline</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Deal
        </Button>
      </div>

      {/* Pipeline Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => (
          <div key={stage.id} className="flex-shrink-0 w-72">
            <div className="mb-3 flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: stage.color }}
              />
              <span className="font-medium">{stage.name}</span>
              <Badge variant="secondary" className="ml-auto">0</Badge>
            </div>

            <div className="min-h-[200px] rounded-lg border-2 border-dashed border-muted p-2">
              <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
                <div>
                  <DollarSign className="mx-auto h-8 w-8 mb-2" />
                  <p>No deals</p>
                  <p className="text-xs">Drag here or click + to add</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
