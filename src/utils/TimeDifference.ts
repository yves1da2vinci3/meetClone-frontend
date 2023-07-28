import React, { useState, useEffect } from 'react';

const TimeDifference: React.FC<{ createdTime: string }> = ({ createdTime }) => {
  const [timeDifference, setTimeDifference] = useState('');

  useEffect(() => {
    const updateTimeDifference = () => {
      const currentTime = new Date();
      const createTime = new Date(createdTime);
      const timeElapsed = currentTime.getTime() - createTime.getTime();

      // Calculate the time difference in seconds, minutes, hours, and days
      const seconds = Math.floor(timeElapsed / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      let timeDiffText = '';
      if (days > 0) {
        timeDiffText = `${days} days ago`;
      } else if (hours > 0) {
        timeDiffText = `${hours} hours ago`;
      } else if (minutes > 0) {
        timeDiffText = `${minutes} minutes ago`;
      } else {
        timeDiffText = 'Just now';
      }

      setTimeDifference(timeDiffText);
    };

    updateTimeDifference();

    // Update the time difference every minute (you can adjust the interval as needed)
    const interval = setInterval(updateTimeDifference, 60000);

    return () => clearInterval(interval);
  }, [createdTime]);

  return timeDifference
};

export default TimeDifference;
