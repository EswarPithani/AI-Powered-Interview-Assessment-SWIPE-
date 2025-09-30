// components/WelcomeBackModal.js
import React from 'react';
import { Modal, Button, Card, Typography, Space, Progress, Tag, message } from 'antd';
import { PlayCircleOutlined, ClockCircleOutlined, UserOutlined, CloseOutlined } from '@ant-design/icons';
import { useApp } from '../context/AppContext';

const { Title, Text } = Typography;

const WelcomeBackModal = () => {
  const { state, actions } = useApp();
  const { showWelcomeBack, currentQuestion, answers, questions } = state.interview;
  const { currentCandidate } = state;

  // Calculate progress
  const progress = answers.length;
  const totalQuestions = questions.length;
  const progressPercent = totalQuestions > 0 ? (progress / totalQuestions) * 100 : 0;

  // Get current question info
  const currentIndex = currentQuestion ? questions.findIndex(q => q.id === currentQuestion.id) : -1;

  const handleResume = () => {
    console.log('Resuming interview...');
    actions.hideWelcomeBack();
    actions.resumeInterview();
    message.success('Interview resumed! Continuing from where you left off.');
  };

  const handleRestart = () => {
    if (window.confirm('Are you sure you want to restart the interview? Your current progress will be lost.')) {
      console.log('Restarting interview...');
      actions.hideWelcomeBack();
      actions.resetInterview();
      actions.setInterviewProgress('ready-to-start');
      actions.setWelcomeBackShown(true);
      message.info('Interview restarted. You can begin a new interview.');
    }
  };

  const handleClose = () => {
    console.log('Closing welcome back modal...');
    actions.hideWelcomeBack();
    actions.setWelcomeBackShown(true);
    message.info('You can resume your interview later from the Interviewee tab.');
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'green';
      case 'medium': return 'orange';
      case 'hard': return 'red';
      default: return 'blue';
    }
  };

  // Don't render if modal shouldn't be shown
  if (!showWelcomeBack || !currentCandidate) {
    return null;
  }

  return (
    <Modal
      title={
        <Space>
          <UserOutlined />
          Welcome Back, {currentCandidate.name}!
        </Space>
      }
      open={showWelcomeBack}
      onCancel={handleClose}
      footer={[
        <Button key="close" onClick={handleClose} icon={<CloseOutlined />}>
          Close
        </Button>,
        <Button key="restart" onClick={handleRestart} danger>
          Start Over
        </Button>,
        <Button key="resume" type="primary" onClick={handleResume} icon={<PlayCircleOutlined />}>
          Resume Interview
        </Button>,
      ]}
      width={600}
      closable={true}
      maskClosable={false}
      destroyOnClose={true}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card>
          <Text>
            We found your incomplete interview from your previous session.
            You can resume where you left off or start over.
          </Text>
        </Card>

        {/* Interview Progress */}
        <Card title="Interview Progress" size="small">
          <Space direction="vertical" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text strong>Completion</Text>
              <Text>{progress} of {totalQuestions} questions completed</Text>
            </div>
            <Progress percent={progressPercent} showInfo={false} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text type="secondary">Started</Text>
              <Text type="secondary">
                {currentCandidate.timestamp ? new Date(currentCandidate.timestamp).toLocaleString() : 'Recently'}
              </Text>
            </div>
          </Space>
        </Card>

        {/* Current Status */}
        <Card title="Current Status" size="small">
          <Space direction="vertical" style={{ width: '100%' }}>
            {currentQuestion && (
              <div>
                <Text strong>Current Question: </Text>
                <Text>Question {currentIndex + 1} of {totalQuestions}</Text>
                <div style={{ marginTop: '8px' }}>
                  <Tag color={getDifficultyColor(currentQuestion.difficulty)}>
                    {currentQuestion.difficulty.toUpperCase()}
                  </Tag>
                  <Tag>{currentQuestion.category}</Tag>
                  <Text type="secondary">
                    <ClockCircleOutlined /> Time: {currentQuestion.timeLimit}s
                  </Text>
                </div>
              </div>
            )}

            {progress > 0 && (
              <div style={{ marginTop: '12px' }}>
                <Text strong>Completed Questions: </Text>
                <div style={{ marginTop: '8px' }}>
                  {answers.map((answer, index) => (
                    <Tag
                      key={answer.id}
                      color="blue"
                      style={{ marginBottom: '4px' }}
                    >
                      Q{index + 1}: {answer.score}/10
                    </Tag>
                  ))}
                </div>
              </div>
            )}

            {progress === 0 && (
              <Text type="secondary">You haven't started answering questions yet.</Text>
            )}
          </Space>
        </Card>

        {/* Next Steps */}
        <Card title="What would you like to do?" size="small">
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Text strong>Resume Interview: </Text>
              <Text>Continue from question {currentIndex + 1} with {currentQuestion?.timeLimit || 0} seconds remaining.</Text>
            </div>
            <div>
              <Text strong>Start Over: </Text>
              <Text>Begin a completely new interview (current progress will be lost).</Text>
            </div>
            <div>
              <Text strong>Close: </Text>
              <Text>Close this dialog and continue later.</Text>
            </div>
          </Space>
        </Card>
      </Space>
    </Modal>
  );
};

export default WelcomeBackModal;