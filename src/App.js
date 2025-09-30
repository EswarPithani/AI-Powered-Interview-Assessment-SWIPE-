// App.js
import React, { useState, useEffect, useRef } from 'react';
import { Tabs, Layout, message } from 'antd';
import { AppProvider, useApp } from './context/AppContext';
import IntervieweeTab from './components/IntervieweeTab';
import InterviewerTab from './components/InterviewerTab';
import WelcomeBackModal from './components/WelcomeBackModal';
import 'antd/dist/reset.css';
import './App.css';

const { Header, Content } = Layout;

const AppContent = () => {
  const [activeTab, setActiveTab] = useState('1');
  const { state, actions } = useApp();
  const { showWelcomeBack, interviewProgress } = state.interview;
  const { currentCandidate } = state;
  
  // Use ref to track if we've already checked for interrupted interview
  const hasCheckedForInterruptedInterview = useRef(false);

  useEffect(() => {
    console.log('App loaded - Current state:', state);

    // Only check for interrupted interview ONCE when the app first loads
    if (!hasCheckedForInterruptedInterview.current) {
      checkForInterruptedInterview();
      hasCheckedForInterruptedInterview.current = true;
    }

    // Show welcome message if interview is in progress (but don't show modal again)
    if (currentCandidate && interviewProgress === 'in-progress' && !showWelcomeBack) {
      message.info('Welcome back! Your interview progress has been restored.');
    }
  }, []); // Empty dependency array - only run once on mount

  // Check for interrupted interview - ONLY RUNS ONCE
  const checkForInterruptedInterview = () => {
    const { interviewProgress, questions, answers, showWelcomeBack, welcomeBackShown } = state.interview;

    console.log('Checking for interrupted interview:', {
      hasCandidate: !!currentCandidate,
      interviewProgress,
      hasQuestions: questions.length > 0,
      incomplete: answers.length < questions.length,
      alreadyShowing: showWelcomeBack,
      alreadyShown: welcomeBackShown
    });

    // Show welcome back if interview was in progress and not completed
    if (currentCandidate &&
      interviewProgress === 'in-progress' &&
      questions.length > 0 &&
      answers.length < questions.length &&
      !showWelcomeBack &&
      !welcomeBackShown) {

      console.log('Conditions met - showing welcome back modal');
      
      // Small delay to ensure everything is loaded
      setTimeout(() => {
        actions.showWelcomeBack();
      }, 1500);
    } else {
      console.log('Welcome back conditions not met');
    }
  };

  const handleTabChange = (key) => {
    console.log('Tab changed to:', key);
    setActiveTab(key);
  };

  const tabItems = [
    {
      key: '1',
      label: 'Interviewee',
      children: <IntervieweeTab />,
      disabled: !currentCandidate && activeTab !== '1'
    },
    {
      key: '2',
      label: 'Interviewer',
      children: <InterviewerTab />,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{
        color: 'white',
        textAlign: 'center',
        background: '#001529',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <h1 style={{ color: 'white', margin: 0, fontSize: '24px' }}>
          AI-Powered Interview Assistant
        </h1>
      </Header>

      <Content style={{ padding: '20px', background: '#f0f2f5', minHeight: 'calc(100vh - 64px)' }}>
        <div style={{ background: 'white', borderRadius: '8px', padding: '20px' }}>
          <Tabs
            activeKey={activeTab}
            onChange={handleTabChange}
            type="card"
            items={tabItems}
          />
        </div>

        <WelcomeBackModal />
      </Content>
    </Layout>
  );
};

const App = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;