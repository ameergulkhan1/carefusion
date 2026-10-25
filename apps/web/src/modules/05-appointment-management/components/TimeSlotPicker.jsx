import React from 'react';

const TimeSlotPicker = ({ availableSlots, selectedSlot, onSelect }) => {
  const mockSlots = ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM'];

  return (
    <div className="time-slot-picker">
      <h3>Available Time Slots</h3>
      <div className="slots-grid">
        {mockSlots.map((slot, index) => (
          <button
            key={index}
            className={`slot-btn ${selectedSlot === slot ? 'selected' : ''}`}
            onClick={() => onSelect(slot)}
          >
            {slot}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TimeSlotPicker;