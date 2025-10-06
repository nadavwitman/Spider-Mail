import React, { createContext, useContext, useRef, useEffect, useState } from 'react';

// Create a React context for mail scheduling
const MailSchedulerContext = createContext();

// Provider component to manage scheduled mail sending
export function MailSchedulerProvider({ children }) {
  // useRef to hold scheduled mails array without triggering re-renders
  // Each item: { time: timestamp, callback: function to send mail }
  const scheduledMails = useRef([]);

  // State to store scheduled send time input (string)
  const [scheduledSend, setScheduledSend] = useState('');

  // State to store the send function reference
  const [sendFn, setSendFn] = useState(() => () => {}); 

  // Effect: checks every second if any scheduled mails are due to be sent
  useEffect(() => {
    const checkAndSend = () => {
      const now = Date.now();
      // Separate mails ready to send from future mails
      const ready = scheduledMails.current.filter(item => item.time <= now);
      scheduledMails.current = scheduledMails.current.filter(item => item.time > now);
      // Execute callback for each ready mail
      ready.forEach(item => item.callback());
    };

    const interval = setInterval(checkAndSend, 1000); // check every 1s
    return () => clearInterval(interval); // cleanup on unmount
  }, []);

  // Function to schedule a mail at a specific time with a callback
  const scheduleMail = (time, callback) => {
    if (!time || typeof callback !== 'function') return;
    scheduledMails.current.push({ time: new Date(time).getTime(), callback });
  };

  // Provide state and functions to children components
  return (
    <MailSchedulerContext.Provider value={{ scheduledSend, setScheduledSend, sendFn, setSendFn, scheduleMail }}>
      {children}
    </MailSchedulerContext.Provider>
  );
}

// Custom hook to access mail scheduler context
export function useMailScheduler() {
  return useContext(MailSchedulerContext);
}
