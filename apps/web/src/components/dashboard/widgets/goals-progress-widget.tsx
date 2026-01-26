'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Target, Pencil, Check, X } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Goal {
  id: string;
  name: string;
  nameRu: string;
  current: number;
  target: number;
  unit: string;
  unitRu: string;
  color: string;
}

const STORAGE_KEY = 'crm-goals';

function loadGoals(): Record<string, number> {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveGoals(goals: Record<string, number>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
}

function GoalProgress({
  goal,
  isRussian,
  onEditTarget,
}: {
  goal: Goal;
  isRussian: boolean;
  onEditTarget: (id: string, target: number) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(goal.target.toString());

  const percentage = goal.target > 0 ? Math.min((goal.current / goal.target) * 100, 100) : 0;
  const isAchieved = goal.current >= goal.target && goal.target > 0;

  const handleSave = () => {
    const newTarget = parseInt(editValue, 10);
    if (!isNaN(newTarget) && newTarget > 0) {
      onEditTarget(goal.id, newTarget);
    }
    setIsEditing(false);
  };

  return (
    <div className="py-3 border-b border-gray-100 last:border-0">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: goal.color }}
          />
          <span className="text-sm font-medium text-gray-700">
            {isRussian ? goal.nameRu : goal.name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-20 h-6 text-sm border rounded px-2"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                  if (e.key === 'Escape') setIsEditing(false);
                }}
              />
              <button
                onClick={handleSave}
                className="p-1 text-green-600 hover:bg-green-50 rounded"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1 text-gray-400 hover:bg-gray-100 rounded"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <>
              <span className="text-sm">
                <span className={cn(
                  'font-semibold',
                  isAchieved ? 'text-green-600' : 'text-gray-900'
                )}>
                  {goal.current.toLocaleString()}
                </span>
                <span className="text-gray-400"> / </span>
                <span className="text-gray-500">
                  {goal.target > 0 ? goal.target.toLocaleString() : '--'}
                </span>
                <span className="text-gray-400 text-xs ml-1">
                  {isRussian ? goal.unitRu : goal.unit}
                </span>
              </span>
              <button
                onClick={() => {
                  setEditValue(goal.target > 0 ? goal.target.toString() : '100');
                  setIsEditing(true);
                }}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
              >
                <Pencil className="h-3 w-3" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            isAchieved ? 'bg-green-500' : ''
          )}
          style={{
            width: `${percentage}%`,
            backgroundColor: isAchieved ? undefined : goal.color,
          }}
        />
      </div>

      {/* Percentage */}
      <div className="flex justify-end mt-1">
        <span className={cn(
          'text-xs font-medium',
          isAchieved ? 'text-green-600' : 'text-gray-500'
        )}>
          {goal.target > 0 ? `${Math.round(percentage)}%` : '--'}
        </span>
      </div>
    </div>
  );
}

export function GoalsProgressWidget() {
  const { i18n } = useTranslation();
  const isRussian = i18n.language === 'ru';
  const [targets, setTargets] = useState<Record<string, number>>(loadGoals);

  const { data: stats } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => api.dashboard.getStats(),
    staleTime: 30000,
  });

  const { data: analytics } = useQuery({
    queryKey: ['dashboard', 'analytics'],
    queryFn: () => api.dashboard.getAnalytics(),
    staleTime: 60000,
  });

  const handleEditTarget = (id: string, target: number) => {
    const newTargets = { ...targets, [id]: target };
    setTargets(newTargets);
    saveGoals(newTargets);
  };

  const goals: Goal[] = [
    {
      id: 'contacts',
      name: 'New Contacts',
      nameRu: 'Новые контакты',
      current: stats?.contacts?.total || 0,
      target: targets['contacts'] || 100,
      unit: 'contacts',
      unitRu: 'контактов',
      color: '#3b82f6',
    },
    {
      id: 'deals',
      name: 'Closed Deals',
      nameRu: 'Закрытые сделки',
      current: stats?.deals?.total || 0,
      target: targets['deals'] || 50,
      unit: 'deals',
      unitRu: 'сделок',
      color: '#f59e0b',
    },
    {
      id: 'revenue',
      name: 'Revenue',
      nameRu: 'Выручка',
      current: analytics?.totalDealsValue || 0,
      target: targets['revenue'] || 100000,
      unit: '$',
      unitRu: '$',
      color: '#10b981',
    },
    {
      id: 'tasks',
      name: 'Tasks Completed',
      nameRu: 'Задач выполнено',
      current: stats?.tasks?.completed || 0,
      target: targets['tasks'] || 100,
      unit: 'tasks',
      unitRu: 'задач',
      color: '#8b5cf6',
    },
  ];

  const achievedCount = goals.filter(g => g.current >= g.target && g.target > 0).length;

  return (
    <div className="sf-card h-full p-4 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-[#0070d2]" />
          <h2 className="text-base font-semibold text-gray-900">
            {isRussian ? 'Цели' : 'Goals'}
          </h2>
        </div>
        <span className={cn(
          'text-sm font-medium px-2 py-0.5 rounded-full',
          achievedCount === goals.length ? 'bg-green-100 text-green-700' :
          achievedCount > 0 ? 'bg-blue-100 text-blue-700' :
          'bg-gray-100 text-gray-600'
        )}>
          {achievedCount}/{goals.length}
        </span>
      </div>

      {/* Goals List */}
      <div className="flex-1 overflow-auto">
        {goals.map((goal) => (
          <GoalProgress
            key={goal.id}
            goal={goal}
            isRussian={isRussian}
            onEditTarget={handleEditTarget}
          />
        ))}
      </div>

      {/* Achievement message */}
      {achievedCount === goals.length && (
        <div className="mt-3 pt-3 border-t border-gray-100 text-center">
          <p className="text-sm text-green-600 font-medium">
            {isRussian ? '🎉 Все цели достигнуты!' : '🎉 All goals achieved!'}
          </p>
        </div>
      )}
    </div>
  );
}
