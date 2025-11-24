import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Calendar } from 'lucide-react';
import './DatePicker.css';

export default function ModernDatePicker({ 
  selected, 
  onChange, 
  placeholder = 'Tarih seçiniz...',
  minDate,
  disabled = false,
  className = ''
}) {
  return (
    <div className={`relative ${className}`}>
      <DatePicker
        selected={selected}
        onChange={onChange}
        dateFormat="dd/MM/yyyy"
        placeholderText={placeholder}
        minDate={minDate}
        disabled={disabled}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        calendarClassName="modern-calendar"
        showPopperArrow={false}
        popperPlacement="bottom-start"
      />
      <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
    </div>
  );
}
