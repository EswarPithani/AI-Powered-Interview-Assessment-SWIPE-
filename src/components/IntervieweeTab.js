import React from 'react';
import { useApp } from '../context/AppContext';
import ResumeUpload from './ResumeUpload';
import ChatInterface from './ChatInterface';

const IntervieweeTab = () => {
  const { state } = useApp();
  const { interviewProgress } = state.interview;
  const { currentCandidate } = state;

  console.log('IntervieweeTab - State:', { interviewProgress, currentCandidate });

  const renderContent = () => {
    if (!currentCandidate) {
      console.log('Rendering ResumeUpload - no current candidate');
      return <ResumeUpload />;
    }

    if (!currentCandidate || interviewProgress === 'not-started' || interviewProgress === 'completed') {
      console.log('Showing ResumeUpload - no candidate or interview not started/completed');
      return <ResumeUpload />;
    }

    console.log('Rendering based on interviewProgress:', interviewProgress);

    switch (interviewProgress) {
      case 'missing-fields':
        return <ResumeUpload />;
      case 'ready-to-start':
      case 'in-progress':
        return <ChatInterface />;
      case 'completed':
        return <ChatInterface />;
      default:
        return <ResumeUpload />;
    }
  };

  return (
    <div style={{ padding: '20px', minHeight: '500px' }}>
      <h1 style={{ color: '#1890ff', marginBottom: '20px' }}>Interviewee Dashboard</h1>
      <div style={{
        border: '1px solid #d9d9d9',
        borderRadius: '6px',
        padding: '20px',
        background: '#fafafa',
        minHeight: '400px'
      }}>
        {renderContent()}
      </div>
    </div>
  );
};

export default IntervieweeTab;