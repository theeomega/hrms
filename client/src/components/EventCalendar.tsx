import React, { useState } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { cn } from '@/lib/utils';

const EventCalendar = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [month, setMonth] = useState<Date>(new Date());

  const selectedDay = date ? date.getDate() : new Date().getDate();
  const selectedDayName = date ? date.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase() : new Date().toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();

  return (
    <div className="flex rounded-lg border bg-card text-card-foreground shadow-sm w-full">
      {/* Red Side Panel - Hidden on screens smaller than 1790px */}
      <div className="hidden min-[1790px]:flex flex-col w-[300px] bg-red-600 text-white p-6 rounded-l-lg">
        <div className="flex-grow">
          <div className="text-center">
            <div className="text-8xl font-bold">{selectedDay}</div>
            <div className="text-2xl font-light tracking-wider">{selectedDayName}</div>
          </div>
          {/* Short rotating quotes to boost morale */}
          {
            (() => {
              const quotes = [
                { text: "Show up. Be consistent. Small steps compound into big results.", author: "— Keep Going" },
                { text: "Punctuality is a sign of professionalism; your presence matters.", author: "— Team" },
                { text: "Consistency builds trust. Your steady effort makes a difference.", author: "— HR" },
              ];
              const [quoteIndex, setQuoteIndex] = React.useState(() => Math.floor(Math.random() * quotes.length));

              return (
                <div className="mt-8">
                  <blockquote className="text-sm italic text-red-100">“{quotes[quoteIndex].text}”</blockquote>
                  <p className="text-xs mt-2 text-red-200 font-semibold">{quotes[quoteIndex].author}</p>
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => setQuoteIndex((i) => (i + 1) % quotes.length)}
                      className="text-sm text-red-200 hover:underline"
                    >
                      Next quote
                    </button>
                  </div>
                </div>
              );
            })()
          }
        </div>
      </div>

      {/* Main Calendar Area */}
      <div className="flex-1 flex flex-col">
        {/* Red Navigation Bar - Only visible when side panel is hidden */}
        <div className="bg-red-600 text-white p-4 rounded-t-lg flex items-center justify-between min-[1790px]:hidden">
          <button
            type="button"
            className="h-6 w-6 flex items-center justify-center hover:text-gray-300 rounded transition-colors"
            onClick={() => {
              const newDate = new Date(month);
              newDate.setMonth(newDate.getMonth() - 1);
              setMonth(newDate);
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <div className="text-base font-normal">
            {month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </div>
          <button
            type="button"
            className="h-6 w-6 flex items-center justify-center hover:text-gray-300 rounded transition-colors"
            onClick={() => {
              const newDate = new Date(month);
              newDate.setMonth(newDate.getMonth() + 1);
              setMonth(newDate);
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>

        <div className="p-2 sm:p-4 md:p-6 flex justify-center">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          month={month}
          onMonthChange={setMonth}
          className="p-0 mx-auto min-[1790px]:mx-0"
          classNames={{
            months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
            month: "space-y-4",
            caption: "flex justify-center pt-1 relative items-center hidden min-[1790px]:flex",
            nav: "space-x-1 flex items-center hidden min-[1790px]:flex",
            nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute",
            nav_button_previous: "left-1",
            nav_button_next: "right-1",
            caption_label: "text-sm font-medium",
            head_cell: "text-muted-foreground rounded-md w-full font-normal text-sm",
            cell: "h-9 w-9 sm:h-10 sm:w-10 md:h-12 md:w-12 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-transparent [&:has([aria-selected].day-outside)]:bg-transparent",
            day: "h-9 w-9 sm:h-10 sm:w-10 md:h-12 md:w-12 p-0 font-normal aria-selected:opacity-100",
            day_selected: "bg-red-600 text-white rounded-full hover:bg-red-700 focus:bg-red-700",
            day_today: "bg-accent text-accent-foreground rounded-full",
            day_outside: "text-muted-foreground opacity-50",
            day_disabled: "text-muted-foreground opacity-50",
          }}
        />
        </div>
      </div>
    </div>
  );
};

export default EventCalendar;
