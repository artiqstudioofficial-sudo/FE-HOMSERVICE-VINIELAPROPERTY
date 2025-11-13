import React, { useState, useEffect, useRef, useMemo } from 'react';

interface CalendarProps {
    selectedDate: Date | null;
    onDateSelect: (date: Date) => void;
    fullyBookedDates: Set<string>;
}

const Calendar: React.FC<CalendarProps> = ({ selectedDate, onDateSelect, fullyBookedDates }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    
    const initialFocusDate = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dateToFocus = selectedDate || today;
        dateToFocus.setHours(0, 0, 0, 0);
        return dateToFocus;
    }, [selectedDate]);
    
    const [focusedDate, setFocusedDate] = useState(initialFocusDate);
    
    const dateButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
    const calendarHeadingId = 'calendar-heading';
    
    const changeMonthAndPreserveDay = (current: Date, monthDelta: number): Date => {
        const newDate = new Date(current);
        const originalDay = newDate.getDate();
        newDate.setMonth(newDate.getMonth() + monthDelta, 1);
        const daysInNewMonth = new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0).getDate();
        newDate.setDate(Math.min(originalDay, daysInNewMonth));
        return newDate;
    };

    useEffect(() => {
        if (focusedDate.getMonth() !== currentDate.getMonth() || focusedDate.getFullYear() !== currentDate.getFullYear()) {
            setCurrentDate(new Date(focusedDate.getFullYear(), focusedDate.getMonth(), 1));
        }
    }, [focusedDate, currentDate]);
    
    useEffect(() => {
        const key = focusedDate.toISOString().split('T')[0];
        const button = dateButtonRefs.current.get(key);
        if (button) {
            button.focus();
        }
    }, [focusedDate]);

    const daysOfWeek = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const fullDaysOfWeek = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        e.preventDefault();
        let newFocusedDate = new Date(focusedDate);

        switch (e.key) {
            case 'ArrowRight':
                newFocusedDate.setDate(newFocusedDate.getDate() + 1);
                break;
            case 'ArrowLeft':
                newFocusedDate.setDate(newFocusedDate.getDate() - 1);
                break;
            case 'ArrowUp':
                newFocusedDate.setDate(newFocusedDate.getDate() - 7);
                break;
            case 'ArrowDown':
                newFocusedDate.setDate(newFocusedDate.getDate() + 7);
                break;
            case 'PageUp':
                newFocusedDate = changeMonthAndPreserveDay(focusedDate, e.shiftKey ? -12 : -1);
                break;
            case 'PageDown':
                newFocusedDate = changeMonthAndPreserveDay(focusedDate, e.shiftKey ? 12 : 1);
                break;
            case 'Home':
                newFocusedDate.setDate(newFocusedDate.getDate() - newFocusedDate.getDay());
                break;
            case 'End':
                newFocusedDate.setDate(newFocusedDate.getDate() + (6 - newFocusedDate.getDay()));
                break;
            case 'Enter':
            case ' ':
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const dayKey = focusedDate.toISOString().split('T')[0];
                if (focusedDate >= today && !fullyBookedDates.has(dayKey)) {
                  onDateSelect(focusedDate);
                }
                return;
            default:
                return;
        }
        setFocusedDate(newFocusedDate);
    };

    const prevMonth = () => {
        setFocusedDate(current => changeMonthAndPreserveDay(current, -1));
    };

    const nextMonth = () => {
        setFocusedDate(current => changeMonthAndPreserveDay(current, 1));
    };

    const handleDateClick = (date: Date) => {
        setFocusedDate(date);
        onDateSelect(date);
    };

    const calendarGrid = useMemo(() => {
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        const startDate = startOfMonth.getDay();
        const daysInMonth = endOfMonth.getDate();
        const weeks: (Date | null)[][] = [];
        let week: (Date | null)[] = [];

        for (let i = 0; i < startDate; i++) week.push(null);

        for (let day = 1; day <= daysInMonth; day++) {
            if (week.length === 7) {
                weeks.push(week);
                week = [];
            }
            week.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
        }
        
        while (week.length < 7) week.push(null);
        weeks.push(week);
        return weeks;
    }, [currentDate]);

    return (
        <div className="bg-white dark:bg-slate-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
                <button type="button" onClick={prevMonth} aria-label="Bulan sebelumnya" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors">
                    <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                </button>
                <h3 id={calendarHeadingId} aria-live="polite" className="font-bold text-lg font-poppins text-gray-800 dark:text-white">
                    {currentDate.toLocaleString('id-ID', { month: 'long', year: 'numeric' })}
                </h3>
                <button type="button" onClick={nextMonth} aria-label="Bulan berikutnya" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors">
                     <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                </button>
            </div>
            <div role="grid" aria-labelledby={calendarHeadingId} onKeyDown={handleKeyDown}>
                <div role="row" className="grid grid-cols-7 gap-1">
                    {daysOfWeek.map((day, index) => <div key={day} role="columnheader" aria-label={fullDaysOfWeek[index]} className="text-center font-semibold text-sm text-gray-500 dark:text-gray-400 py-2">{day}</div>)}
                </div>
                {calendarGrid.map((week, weekIndex) => (
                    <div role="row" key={weekIndex} className="grid grid-cols-7 gap-1">
                    {week.map((dayDate, dayIndex) => {
                        if (!dayDate) return <div key={`empty-${weekIndex}-${dayIndex}`} className="p-1 h-10 w-10"></div>;

                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const dayKey = dayDate.toISOString().split('T')[0];
                        const isToday = dayDate.getTime() === today.getTime();
                        const isSelected = selectedDate && dayDate.getTime() === new Date(selectedDate.setHours(0,0,0,0)).getTime();
                        const isPast = dayDate < today;
                        const isFullyBooked = fullyBookedDates.has(dayKey);
                        const isDisabled = isPast; // For clickability, we don't disable booked dates, just style them
                        const isFocused = dayDate.getTime() === focusedDate.getTime();
                        
                        const buttonClasses = [
                            'w-10 h-10 rounded-full transition-colors duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-slate-700'
                        ];

                        if (isSelected) {
                            buttonClasses.push('bg-primary text-white font-bold shadow-md');
                        } else if (isFullyBooked) {
                            buttonClasses.push('bg-red-200 text-red-700 dark:bg-red-800/50 dark:text-red-300 line-through');
                            if(!isPast) buttonClasses.push('hover:bg-red-300 dark:hover:bg-red-800/70');
                        } else if (isDisabled) {
                             buttonClasses.push('text-gray-300 dark:text-gray-500 cursor-not-allowed');
                        } else { // Available
                            if (isToday) {
                                buttonClasses.push('bg-primary-light text-primary font-bold');
                            }
                            buttonClasses.push('hover:bg-gray-200 dark:hover:bg-slate-600');
                        }

                        return (
                            <div key={dayKey} role="gridcell" aria-selected={isSelected} className="text-center p-1 flex justify-center items-center">
                                <button
                                    ref={(el) => {
                                        if (el) dateButtonRefs.current.set(dayKey, el);
                                        else dateButtonRefs.current.delete(dayKey);
                                    }}
                                    type="button"
                                    onClick={() => !isPast && handleDateClick(dayDate)}
                                    disabled={isPast}
                                    tabIndex={isFocused ? 0 : -1}
                                    aria-label={dayDate.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) + (isFullyBooked ? ' (Penuh)' : '')}
                                    aria-current={isToday ? "date" : undefined}
                                    aria-disabled={isPast}
                                    className={buttonClasses.join(' ')}
                                >
                                    {dayDate.getDate()}
                                </button>
                            </div>
                        );
                    })}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Calendar;
