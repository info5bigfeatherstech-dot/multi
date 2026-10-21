import * as React from 'react';
import { ArrowUp, ArrowDown, ChevronDown, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface CalendarProps {
  className?: string;
  selected?: Date | string | null;
  onSelect?: (date: Date | null) => void;
  minDate?: Date;
  maxDate?: Date;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const Calendar: React.FC<CalendarProps> = ({
  className,
  selected,
  onSelect,
  minDate,
  maxDate,
}) => {
  const selectedDate = React.useMemo(() => {
    if (!selected) return null;
    const d = typeof selected === 'string' ? new Date(selected) : selected;
    return isNaN(d.getTime()) ? null : d;
  }, [selected]);

  const [currentMonth, setCurrentMonth] = React.useState<Date>(() => {
    return selectedDate ? new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1) : new Date();
  });

  const [showMonthYearPicker, setShowMonthYearPicker] = React.useState(false);

  // Sync current month view when selected date changes externally
  React.useEffect(() => {
    if (selectedDate) {
      setCurrentMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
    }
  }, [selectedDate]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  // Generate days in month
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const days: Array<{
    date: Date;
    dayNumber: number;
    isCurrentMonth: boolean;
    isToday: boolean;
    isSelected: boolean;
    isDisabled: boolean;
  }> = [];

  const today = new Date();
  const isSameDay = (d1: Date, d2: Date | null) => {
    if (!d2) return false;
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  // Previous month trailing days
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, daysInPrevMonth - i);
    days.push({
      date: d,
      dayNumber: daysInPrevMonth - i,
      isCurrentMonth: false,
      isToday: isSameDay(d, today),
      isSelected: isSameDay(d, selectedDate),
      isDisabled: Boolean((minDate && d < minDate) || (maxDate && d > maxDate)),
    });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(year, month, i);
    days.push({
      date: d,
      dayNumber: i,
      isCurrentMonth: true,
      isToday: isSameDay(d, today),
      isSelected: isSameDay(d, selectedDate),
      isDisabled: Boolean((minDate && d < minDate) || (maxDate && d > maxDate)),
    });
  }

  // Next month leading days to complete full 5 or 6 weeks
  const remainingCells = (7 - (days.length % 7)) % 7;
  for (let i = 1; i <= remainingCells; i++) {
    const d = new Date(year, month + 1, i);
    days.push({
      date: d,
      dayNumber: i,
      isCurrentMonth: false,
      isToday: isSameDay(d, today),
      isSelected: isSameDay(d, selectedDate),
      isDisabled: Boolean((minDate && d < minDate) || (maxDate && d > maxDate)),
    });
  }

  const handleDateClick = (date: Date, isDisabled: boolean) => {
    if (isDisabled) return;
    onSelect?.(date);
  };

  // Generate year options (current - 10 to current + 15)
  const yearsList = React.useMemo(() => {
    const curYear = new Date().getFullYear();
    const list = [];
    for (let y = curYear - 5; y <= curYear + 15; y++) {
      list.push(y);
    }
    return list;
  }, []);

  return (
    <div className={cn('p-3.5 bg-white rounded-lg border border-slate-200/90 shadow-xl w-[260px] sm:w-[270px] select-none font-sans', className)}>
      {/* Month & Year Header with screenshot styling */}
      <div className="flex items-center justify-between pb-3 pt-0.5 px-0.5">
        <button
          type="button"
          onClick={() => setShowMonthYearPicker((v) => !v)}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-900 hover:text-black py-1 px-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <span>{MONTH_NAMES[month]} {year}</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-700" />
        </button>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrevMonth}
            title="Previous month"
            className="p-1 rounded text-slate-700 hover:text-black hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            title="Next month"
            className="p-1 rounded text-slate-700 hover:text-black hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Month/Year selector dropdown if opened */}
      {showMonthYearPicker && (
        <div className="mb-3 p-2 bg-slate-50 rounded-lg border border-slate-200 text-xs grid grid-cols-2 gap-2 animate-fadeIn">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Month</label>
            <select
              value={month}
              onChange={(e) => {
                setCurrentMonth(new Date(year, Number(e.target.value), 1));
                setShowMonthYearPicker(false);
              }}
              className="w-full bg-white border border-slate-200 rounded p-1 text-slate-800 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-black"
            >
              {MONTH_NAMES.map((name, i) => (
                <option key={name} value={i}>{name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Year</label>
            <select
              value={year}
              onChange={(e) => {
                setCurrentMonth(new Date(Number(e.target.value), month, 1));
                setShowMonthYearPicker(false);
              }}
              className="w-full bg-white border border-slate-200 rounded p-1 text-slate-800 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-black"
            >
              {yearsList.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Weekdays header */}
      <div className="grid grid-cols-7 text-center mb-1">
        {WEEKDAY_NAMES.map((name) => (
          <div key={name} className="text-xs font-normal text-slate-900 py-1">
            {name}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {days.map((d, idx) => (
          <button
            key={idx}
            type="button"
            disabled={d.isDisabled}
            onClick={() => handleDateClick(d.date, d.isDisabled)}
            className={cn(
              'h-7 w-7 text-xs flex items-center justify-center transition-colors cursor-pointer mx-auto my-0.5',
              d.isSelected
                ? 'border-2 border-black bg-[#0070F3] text-white font-bold rounded-none shadow-sm'
                : d.isToday
                ? 'text-[#0070F3] font-bold hover:bg-slate-100 rounded-sm'
                : d.isCurrentMonth
                ? 'text-slate-900 font-normal hover:bg-slate-100 rounded-sm'
                : 'text-slate-400 hover:bg-slate-50 rounded-sm',
              d.isDisabled && 'opacity-25 cursor-not-allowed hover:bg-transparent'
            )}
          >
            {d.dayNumber}
          </button>
        ))}
      </div>

      {/* Quick Actions (Clear / Today) */}
      <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-100 px-1 text-xs">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            onSelect?.(null);
          }}
          className="text-[#0070F3] hover:underline text-xs font-medium cursor-pointer"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            const now = new Date();
            onSelect?.(now);
            setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
          }}
          className="text-[#0070F3] hover:underline text-xs font-medium cursor-pointer"
        >
          Today
        </button>
      </div>
    </div>
  );
};

export interface DatePickerProps {
  value?: string;
  onChange?: (dateString: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = 'Select date',
  className,
  required,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const parsedDate = React.useMemo(() => {
    if (!value) return null;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }, [value]);

  // Click outside listener
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelectDate = (date: Date | null) => {
    if (!date) {
      onChange?.('');
    } else {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      onChange?.(`${year}-${month}-${day}`);
    }
    setIsOpen(false);
  };

  const formattedDisplay = React.useMemo(() => {
    if (!parsedDate) return '';
    // Format as MM/DD/YYYY to match user's screenshot
    const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
    const day = String(parsedDate.getDate()).padStart(2, '0');
    const year = parsedDate.getFullYear();
    return `${month}/${day}/${year}`;
  }, [parsedDate]);

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger Button Input matching screenshot */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          'w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 flex items-center justify-between text-left text-xs focus:outline-none focus:ring-2 focus:ring-black cursor-pointer transition-colors hover:border-slate-400',
          !formattedDisplay && 'text-slate-400',
          className
        )}
      >
        <span>{formattedDisplay || placeholder}</span>
        <CalendarIcon className="w-4 h-4 text-slate-500 shrink-0 ml-2" />
      </button>

      {/* Hidden input for form validation */}
      {required && (
        <input
          type="text"
          required
          value={value || ''}
          onChange={() => {}}
          className="sr-only"
          tabIndex={-1}
        />
      )}

      {/* Shadcn Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 z-50 animate-fadeIn shadow-xl">
          <Calendar
            selected={parsedDate}
            onSelect={handleSelectDate}
          />
        </div>
      )}
    </div>
  );
};
