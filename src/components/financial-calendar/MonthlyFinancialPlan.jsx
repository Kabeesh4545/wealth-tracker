import React, { useMemo } from 'react';
import { Calendar as CalendarIcon, Info, DollarSign, Award, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function MonthlyFinancialPlan({ budgetData, selectedMonth }) {
  if (!budgetData) return null;

  // Extract year and month
  const { year, month } = useMemo(() => {
    const parts = (selectedMonth || "").split('-');
    if (parts.length === 2) {
      return { year: parseInt(parts[0]), month: parseInt(parts[1]) };
    }
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  }, [selectedMonth]);

  // Generate calendar days
  const daysInMonth = useMemo(() => new Date(year, month, 0).getDate(), [year, month]);
  const startDayOfWeek = useMemo(() => new Date(year, month - 1, 1).getDay(), [year, month]);

  const monthName = useMemo(() => {
    return new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'long' });
  }, [year, month]);

  // Generate list of days
  const days = useMemo(() => {
    const arr = [];
    // Padding for days of previous month
    for (let i = 0; i < startDayOfWeek; i++) {
      arr.push({ date: null, isCurrentMonth: false });
    }
    // Days of current month
    for (let d = 1; d <= daysInMonth; d++) {
      arr.push({ date: d, isCurrentMonth: true });
    }
    return arr;
  }, [daysInMonth, startDayOfWeek]);

  // Map events to specific days
  const eventsByDay = useMemo(() => {
    const map = {};
    const actions = budgetData.actions || [];
    
    // Default schedules
    // Rent: Day 1
    const rentAction = actions.find(a => a.text.toLowerCase().includes('rent'));
    if (rentAction) {
      map[1] = map[1] || [];
      map[1].push({ label: "Pay Rent", amount: rentAction.amount, type: "expense", priority: "HIGH" });
    }

    // Maintenance: Day 5
    const maintAction = actions.find(a => a.text.toLowerCase().includes('maintenance'));
    if (maintAction) {
      map[5] = map[5] || [];
      map[5].push({ label: "Pay Maintenance", amount: maintAction.amount, type: "expense", priority: "HIGH" });
    }

    // EMIs: Day 10
    const emiAction = actions.find(a => a.text.toLowerCase().includes('emi'));
    if (emiAction) {
      map[10] = map[10] || [];
      map[10].push({ label: "Pay EMI Liabilities", amount: emiAction.amount, type: "debt", priority: "HIGH" });
    }

    // Savings & Investments transfers: Day 12
    const efAction = actions.find(a => a.text.toLowerCase().includes('emergency'));
    if (efAction) {
      map[12] = map[12] || [];
      map[12].push({ label: "Emergency Save", amount: efAction.amount, type: "save", priority: "HIGH" });
    }

    const goalAction = actions.find(a => a.text.toLowerCase().includes('goal'));
    if (goalAction) {
      map[12] = map[12] || [];
      map[12].push({ label: "Save toward Goals", amount: goalAction.amount, type: "save", priority: "HIGH" });
    }

    const invAction = actions.find(a => a.text.toLowerCase().includes('investment'));
    if (invAction) {
      map[12] = map[12] || [];
      map[12].push({ label: "Invest Target", amount: invAction.amount, type: "invest", priority: "HIGH" });
    }

    // Mid-month check: Day 15
    map[15] = map[15] || [];
    map[15].push({ label: "Mid-month Budget Review", amount: null, type: "review", priority: "MEDIUM" });

    // Month-end check: Last day
    map[daysInMonth] = map[daysInMonth] || [];
    map[daysInMonth].push({ label: "Month-end Review", amount: null, type: "review", priority: "MEDIUM" });

    return map;
  }, [budgetData, daysInMonth]);

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <CalendarIcon size={18} className="text-teal-600" />
          Financial Calendar & Schedule — {monthName} {year}
        </h3>
        <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full uppercase">
          Planning View
        </span>
      </div>

      {/* Salary configuration notice */}
      <div className="mb-6 bg-slate-50 border border-slate-100/80 rounded-2xl p-4 flex gap-3 text-xs font-semibold text-slate-500">
        <Info size={16} className="text-teal-600 shrink-0 mt-0.5" />
        <div>
          <span className="text-slate-800 block mb-1">Income received — date not configured</span>
          <p className="text-slate-400 font-medium">
            Your monthly planning income of <span className="text-teal-600">₹{Number(budgetData.planning_income).toLocaleString('en-IN')}</span> has been credited to your planning limit. Complete payroll profile settings to anchor salary day on the calendar.
          </p>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {weekdays.map(day => (
          <div key={day} className="text-center text-[10px] font-bold text-slate-400 uppercase py-1">
            {day}
          </div>
        ))}
        {days.map((item, idx) => {
          const hasEvents = item.date && eventsByDay[item.date];
          return (
            <div
              key={idx}
              className={`min-h-[72px] border border-slate-50 rounded-xl p-1.5 transition-all flex flex-col justify-between ${
                !item.isCurrentMonth
                  ? 'bg-slate-50/30 border-transparent'
                  : 'bg-white hover:border-slate-200'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className={`text-[10px] font-bold ${item.isCurrentMonth ? 'text-slate-500' : 'text-slate-300'}`}>
                  {item.date}
                </span>
                {hasEvents && (
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                )}
              </div>
              <div className="space-y-1 mt-1">
                {item.date && eventsByDay[item.date] && eventsByDay[item.date].map((ev, eIdx) => {
                  let badgeColor = "bg-teal-50 text-teal-600";
                  if (ev.type === "expense") badgeColor = "bg-rose-50 text-rose-600";
                  if (ev.type === "debt") badgeColor = "bg-amber-50 text-amber-600";
                  if (ev.type === "review") badgeColor = "bg-slate-100 text-slate-600";
                  
                  return (
                    <div
                      key={eIdx}
                      className={`text-[8px] font-extrabold px-1 py-0.5 rounded-md truncate ${badgeColor}`}
                      title={`${ev.label} ${ev.amount ? '₹' + ev.amount.toLocaleString('en-IN') : ''}`}
                    >
                      {ev.label}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
