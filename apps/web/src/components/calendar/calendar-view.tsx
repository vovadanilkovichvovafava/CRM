'use client';

import { useEffect, useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventInput, EventClickArg, DateSelectArg, EventDropArg } from '@fullcalendar/core';
import { cn } from '@/lib/utils';

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date | string;
  end?: Date | string;
  allDay?: boolean;
  color?: string;
  extendedProps?: {
    type: 'task' | 'deadline' | 'meeting' | 'activity';
    status?: string;
    priority?: string;
    projectId?: string;
    projectName?: string;
    description?: string;
  };
}

interface CalendarViewProps {
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onDateSelect?: (start: Date, end: Date) => void;
  onEventDrop?: (eventId: string, newStart: Date, newEnd: Date | null) => void;
  className?: string;
  initialView?: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek';
  editable?: boolean;
}

const PRIORITY_COLORS: Record<string, string> = {
  URGENT: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#eab308',
  LOW: '#6b7280',
};

const STATUS_COLORS: Record<string, string> = {
  TODO: '#6b7280',
  IN_PROGRESS: '#3b82f6',
  IN_REVIEW: '#eab308',
  DONE: '#22c55e',
};

export function CalendarView({
  events,
  onEventClick,
  onDateSelect,
  onEventDrop,
  className,
  initialView = 'dayGridMonth',
  editable = true,
}: CalendarViewProps) {
  const calendarRef = useRef<FullCalendar>(null);
  const [currentView, setCurrentView] = useState(initialView);

  // Convert events to FullCalendar format
  const calendarEvents: EventInput[] = events.map((event) => {
    const color = event.color ||
      (event.extendedProps?.priority ? PRIORITY_COLORS[event.extendedProps.priority] : undefined) ||
      (event.extendedProps?.status ? STATUS_COLORS[event.extendedProps.status] : '#6366f1');

    return {
      id: event.id,
      title: event.title,
      start: event.start,
      end: event.end,
      allDay: event.allDay ?? true,
      backgroundColor: color,
      borderColor: color,
      extendedProps: event.extendedProps,
    };
  });

  const handleEventClick = (info: EventClickArg) => {
    if (onEventClick) {
      const event: CalendarEvent = {
        id: info.event.id,
        title: info.event.title,
        start: info.event.start || new Date(),
        end: info.event.end || undefined,
        allDay: info.event.allDay,
        extendedProps: info.event.extendedProps as CalendarEvent['extendedProps'],
      };
      onEventClick(event);
    }
  };

  const handleDateSelect = (info: DateSelectArg) => {
    if (onDateSelect) {
      onDateSelect(info.start, info.end);
    }
  };

  const handleEventDrop = (info: EventDropArg) => {
    if (onEventDrop && info.event.start) {
      onEventDrop(info.event.id, info.event.start, info.event.end);
    }
  };

  return (
    <div className={cn('calendar-container', className)}>
      <style jsx global>{`
        .calendar-container {
          --fc-border-color: rgba(255, 255, 255, 0.1);
          --fc-page-bg-color: transparent;
          --fc-neutral-bg-color: rgba(255, 255, 255, 0.05);
          --fc-neutral-text-color: rgba(255, 255, 255, 0.6);
          --fc-today-bg-color: rgba(99, 102, 241, 0.1);
          --fc-event-bg-color: #6366f1;
          --fc-event-border-color: #6366f1;
          --fc-event-text-color: white;
          --fc-button-bg-color: rgba(255, 255, 255, 0.1);
          --fc-button-border-color: rgba(255, 255, 255, 0.2);
          --fc-button-text-color: white;
          --fc-button-hover-bg-color: rgba(255, 255, 255, 0.2);
          --fc-button-hover-border-color: rgba(255, 255, 255, 0.3);
          --fc-button-active-bg-color: rgba(99, 102, 241, 0.5);
          --fc-button-active-border-color: #6366f1;
          --fc-list-event-hover-bg-color: rgba(255, 255, 255, 0.05);
        }

        .calendar-container .fc {
          font-family: inherit;
        }

        .calendar-container .fc-toolbar-title {
          color: white;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .calendar-container .fc-col-header-cell-cushion,
        .calendar-container .fc-daygrid-day-number,
        .calendar-container .fc-list-day-text,
        .calendar-container .fc-list-day-side-text {
          color: rgba(255, 255, 255, 0.8);
        }

        .calendar-container .fc-day-other .fc-daygrid-day-number {
          color: rgba(255, 255, 255, 0.3);
        }

        .calendar-container .fc-daygrid-day:hover {
          background: rgba(255, 255, 255, 0.03);
        }

        .calendar-container .fc-event {
          cursor: pointer;
          border-radius: 4px;
          padding: 2px 4px;
          font-size: 0.75rem;
        }

        .calendar-container .fc-event:hover {
          filter: brightness(1.1);
        }

        .calendar-container .fc-button {
          border-radius: 6px;
          padding: 6px 12px;
          font-size: 0.875rem;
          font-weight: 500;
          text-transform: none;
        }

        .calendar-container .fc-button-primary:not(:disabled).fc-button-active,
        .calendar-container .fc-button-primary:not(:disabled):active {
          background-color: rgba(99, 102, 241, 0.5);
          border-color: #6366f1;
        }

        .calendar-container .fc-highlight {
          background: rgba(99, 102, 241, 0.2);
        }

        .calendar-container .fc-list-event-title {
          color: white;
        }

        .calendar-container .fc-list-event-time {
          color: rgba(255, 255, 255, 0.6);
        }

        .calendar-container .fc-timegrid-slot-label-cushion {
          color: rgba(255, 255, 255, 0.6);
        }

        .calendar-container .fc-timegrid-now-indicator-line {
          border-color: #ef4444;
        }

        .calendar-container .fc-timegrid-now-indicator-arrow {
          border-color: #ef4444;
          border-top-color: transparent;
          border-bottom-color: transparent;
        }

        .calendar-container .fc-scrollgrid {
          border-radius: 8px;
          overflow: hidden;
        }

        .calendar-container .fc-scroller {
          overflow: auto !important;
        }
      `}</style>

      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
        initialView={initialView}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
        }}
        events={calendarEvents}
        editable={editable}
        selectable={!!onDateSelect}
        selectMirror={true}
        dayMaxEvents={3}
        weekends={true}
        eventClick={handleEventClick}
        select={handleDateSelect}
        eventDrop={handleEventDrop}
        height="auto"
        aspectRatio={1.8}
        eventTimeFormat={{
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }}
        slotLabelFormat={{
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }}
        firstDay={1}
        buttonText={{
          today: 'Today',
          month: 'Month',
          week: 'Week',
          day: 'Day',
          list: 'List',
        }}
        viewDidMount={(info) => setCurrentView(info.view.type as typeof initialView)}
        eventContent={(eventInfo) => (
          <div className="flex items-center gap-1 overflow-hidden px-1">
            {eventInfo.event.extendedProps?.type === 'task' && (
              <span className="flex-shrink-0 text-[10px]">
                {eventInfo.event.extendedProps?.status === 'DONE' ? '✓' : '○'}
              </span>
            )}
            <span className="truncate">{eventInfo.event.title}</span>
          </div>
        )}
      />
    </div>
  );
}

// Mini calendar for sidebar or widgets
interface MiniCalendarProps {
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
  events?: CalendarEvent[];
  className?: string;
}

export function MiniCalendar({
  selectedDate,
  onDateSelect,
  events = [],
  className,
}: MiniCalendarProps) {
  const calendarRef = useRef<FullCalendar>(null);

  const calendarEvents: EventInput[] = events.map((event) => ({
    id: event.id,
    start: event.start,
    display: 'background',
    backgroundColor: 'rgba(99, 102, 241, 0.3)',
  }));

  const handleDateClick = (info: { date: Date }) => {
    if (onDateSelect) {
      onDateSelect(info.date);
    }
  };

  return (
    <div className={cn('mini-calendar', className)}>
      <style jsx global>{`
        .mini-calendar {
          --fc-border-color: rgba(255, 255, 255, 0.1);
          --fc-page-bg-color: transparent;
          --fc-today-bg-color: rgba(99, 102, 241, 0.2);
        }

        .mini-calendar .fc-toolbar-title {
          color: white;
          font-size: 0.875rem;
          font-weight: 600;
        }

        .mini-calendar .fc-col-header-cell-cushion {
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.625rem;
          text-transform: uppercase;
        }

        .mini-calendar .fc-daygrid-day-number {
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.75rem;
          padding: 4px;
        }

        .mini-calendar .fc-day-other .fc-daygrid-day-number {
          color: rgba(255, 255, 255, 0.2);
        }

        .mini-calendar .fc-daygrid-day {
          cursor: pointer;
        }

        .mini-calendar .fc-daygrid-day:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .mini-calendar .fc-button {
          padding: 2px 6px;
          font-size: 0.75rem;
        }

        .mini-calendar .fc-daygrid-day-frame {
          min-height: 32px;
        }
      `}</style>

      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev',
          center: 'title',
          right: 'next',
        }}
        events={calendarEvents}
        dateClick={handleDateClick}
        height="auto"
        fixedWeekCount={false}
        showNonCurrentDates={true}
        firstDay={1}
        dayCellClassNames={(info) => {
          if (selectedDate && info.date.toDateString() === selectedDate.toDateString()) {
            return ['bg-indigo-500/30', 'rounded'];
          }
          return [];
        }}
      />
    </div>
  );
}
