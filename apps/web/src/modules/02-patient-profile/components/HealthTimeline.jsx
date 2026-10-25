import React from 'react';

const HealthTimeline = ({ events }) => {
  return (
    <div className="health-timeline">
      {events.map((event, index) => (
        <div key={index} className="timeline-event">
          <div className="event-date">{event.date}</div>
          <div className="event-details">
            <h4>{event.title}</h4>
            <p>{event.description}</p>
            <span className="event-type">{event.type}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default HealthTimeline;