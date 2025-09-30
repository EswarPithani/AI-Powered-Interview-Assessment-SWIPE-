import React, { useState, useEffect } from 'react';
import { Progress } from 'antd';

const Timer = ({ initialTime, onTimeUp }) => {
    const [timeLeft, setTimeLeft] = useState(initialTime);

    useEffect(() => {
        if (timeLeft <= 0) {
            onTimeUp();
            return;
        }

        const timer = setTimeout(() => {
            setTimeLeft(timeLeft - 1);
        }, 1000);

        return () => clearTimeout(timer);
    }, [timeLeft, onTimeUp]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const progressPercent = (timeLeft / initialTime) * 100;

    return (
        <div style={{ textAlign: 'center', margin: '20px 0' }}>
            <Progress
                type="circle"
                percent={progressPercent}
                format={() => formatTime(timeLeft)}
                strokeColor={{
                    '0%': '#108ee9',
                    '100%': '#87d068',
                }}
            />
            <div style={{ marginTop: '10px', fontSize: '16px', fontWeight: 'bold' }}>
                Time Remaining: {formatTime(timeLeft)}
            </div>
        </div>
    );
};

export default Timer;