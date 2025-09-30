import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Input, Button, List, message, Card, Progress, Typography, Space, Tag, Modal } from 'antd';
import { SendOutlined, ClockCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useApp } from '../context/AppContext';
import { evaluateAnswer, generateSummary, generateQuestions } from '../utils/aiService';

const { Title, Text } = Typography;

// Timer Component
const Timer = ({ initialTime, onTimeUp, isActive, isSubmitting }) => {
    const [timeLeft, setTimeLeft] = useState(initialTime);

    useEffect(() => {
        setTimeLeft(initialTime); // Reset timer when question changes
    }, [initialTime]);

    useEffect(() => {
        if (!isActive || isSubmitting) return;

        if (timeLeft <= 0) {
            onTimeUp();
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, onTimeUp, isActive, isSubmitting]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const progressPercent = (timeLeft / initialTime) * 100;
    const isWarning = timeLeft < 10;

    return (
        <div style={{ textAlign: 'center', margin: '20px 0' }}>
            <Progress
                type="circle"
                percent={progressPercent}
                format={() => formatTime(timeLeft)}
                strokeColor={isWarning ? '#ff4d4f' : '#1890ff'}
                width={80}
            />
            <div style={{
                marginTop: '10px',
                fontSize: '16px',
                fontWeight: 'bold',
                color: isWarning ? '#ff4d4f' : '#333'
            }}>
                <ClockCircleOutlined /> Time: {formatTime(timeLeft)}
            </div>
        </div>
    );
};

const ChatInterface = () => {
    const [currentAnswer, setCurrentAnswer] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [timeStarted, setTimeStarted] = useState(null);
    const [isTimerActive, setIsTimerActive] = useState(false);
    const [currentQuestionStartTime, setCurrentQuestionStartTime] = useState(null);
    const messagesEndRef = useRef(null);
    const { state, actions } = useApp();

    const { questions, currentQuestion, answers, interviewProgress } = state.interview;
    const { currentCandidate } = state;

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [answers, currentQuestion]);

    // Reset interview when current candidate changes or component mounts
    useEffect(() => {
        if (currentCandidate) {
            resetInterview();
            startInterview();
        }
    }, [currentCandidate]);

    // Reset interview function - completely clears everything
    const resetInterview = () => {
        console.log('Resetting interview...');
        actions.resetInterview();
        setCurrentAnswer('');
        setTimeStarted(null);
        setCurrentQuestionStartTime(null);
        setIsTimerActive(false);
        setIsSubmitting(false);
    };

    // Start interview with generated questions
    const startInterview = useCallback(async () => {
        if (!currentCandidate) {
            message.error('No candidate data found. Please upload resume first.');
            return;
        }

        try {
            console.log('Starting new interview...');
            const generatedQuestions = await generateQuestions('full stack');
            console.log('Generated questions:', generatedQuestions);
            
            actions.setQuestions(generatedQuestions);
            actions.setCurrentQuestion(generatedQuestions[0]);
            actions.setInterviewProgress('in-progress');
            
            setTimeStarted(Date.now());
            setCurrentQuestionStartTime(Date.now());
            setIsTimerActive(true);
            
            message.success('Interview started! First question loaded.');
        } catch (error) {
            console.error('Error starting interview:', error);
            message.error('Failed to start interview. Please try again.');
        }
    }, [actions, currentCandidate]);

    const handleTimeUp = async () => {
        if (currentQuestion && !isSubmitting) {
            console.log('Time up! Auto-submitting...');
            setIsTimerActive(false);
            await submitAnswer(''); // Submit empty answer when time's up
        }
    };

    const submitAnswer = async (answerText = currentAnswer) => {
        if (!currentQuestion || isSubmitting) return;

        setIsSubmitting(true);
        setIsTimerActive(false);
        
        try {
            const finalAnswer = answerText.trim();
            const timeTaken = currentQuestionStartTime ? (Date.now() - currentQuestionStartTime) / 1000 : currentQuestion.timeLimit;

            console.log('Submitting answer:', { 
                question: currentQuestion.text, 
                answer: finalAnswer, 
                timeTaken 
            });

            // Safe evaluation with error handling
            let evaluation;
            try {
                evaluation = await evaluateAnswer(currentQuestion, finalAnswer, timeTaken);
            } catch (error) {
                console.error('Error in evaluation:', error);
                // Fallback evaluation
                evaluation = {
                    score: finalAnswer.length > 0 ? 6 : 3,
                    feedback: finalAnswer.length > 0 
                        ? "Answer submitted successfully." 
                        : "Time expired - no answer provided.",
                    questionId: currentQuestion.id,
                    timeTaken: timeTaken,
                    evaluatedAt: new Date().toISOString()
                };
            }

            const answerData = {
                id: Date.now().toString(),
                questionId: currentQuestion.id,
                question: currentQuestion.text,
                answer: finalAnswer,
                difficulty: currentQuestion.difficulty,
                category: currentQuestion.category || 'General',
                timeLimit: currentQuestion.timeLimit,
                timeTaken: timeTaken,
                timestamp: new Date().toISOString(),
                ...evaluation
            };

            actions.addAnswer(answerData);

            // Move to next question or finish interview
            const currentIndex = questions.findIndex(q => q.id === currentQuestion.id);
            console.log('Current question index:', currentIndex, 'Total questions:', questions.length);
            
            if (currentIndex < questions.length - 1) {
                const nextQuestion = questions[currentIndex + 1];
                console.log('Moving to next question:', nextQuestion.text);
                
                actions.setCurrentQuestion(nextQuestion);
                setCurrentAnswer('');
                setCurrentQuestionStartTime(Date.now());
                setIsTimerActive(true);
                setIsSubmitting(false);
                
                message.info(`Next question: ${nextQuestion.difficulty} level`);
            } else {
                console.log('All questions completed, finishing interview...');
                await finishInterview();
            }
        } catch (error) {
            console.error('Error submitting answer:', error);
            message.error('Failed to submit answer. Please try again.');
            setIsSubmitting(false);
        }
    };

    const finishInterview = async () => {
        try {
            console.log('Finishing interview with answers:', answers);
            
            // Safe summary generation with error handling
            let summary;
            try {
                summary = await generateSummary(currentCandidate, answers, questions);
            } catch (error) {
                console.error('Error generating summary:', error);
                // Fallback summary
                const avgScore = answers.length > 0 
                    ? (answers.reduce((sum, ans) => sum + ans.score, 0) / answers.length).toFixed(1)
                    : 0;
                summary = {
                    finalScore: parseFloat(avgScore),
                    summary: `Candidate ${currentCandidate.name} completed the interview with an average score of ${avgScore}/10.`,
                    performanceLevel: avgScore >= 7 ? 'Strong' : 'Competent',
                    strengths: ['Problem-solving', 'Communication'],
                    improvements: ['Technical depth'],
                    totalQuestions: answers.length,
                    completionDate: new Date().toISOString()
                };
            }

            const completedCandidate = {
                ...currentCandidate,
                id: currentCandidate.id || `candidate-${Date.now()}`,
                status: 'completed',
                score: summary.finalScore,
                summary: summary.summary,
                strengths: summary.strengths,
                improvements: summary.improvements,
                timestamp: new Date().toISOString(),
                interviewData: {
                    questions: questions,
                    answers: answers,
                    summary: summary,
                    startedAt: new Date(timeStarted).toISOString(),
                    completedAt: new Date().toISOString(),
                    duration: Date.now() - timeStarted
                }
            };

            console.log('Saving completed candidate:', completedCandidate);
            
            actions.addCandidate(completedCandidate);
            actions.setInterviewProgress('completed');
            setIsTimerActive(false);

            message.success('Interview completed! Your results have been saved.');
        } catch (error) {
            console.error('Error finishing interview:', error);
            message.error('Error completing interview. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (currentAnswer.trim() && !isSubmitting) {
            setIsTimerActive(false);
            submitAnswer();
        }
    };

    const getDifficultyColor = (difficulty) => {
        switch (difficulty) {
            case 'easy': return 'green';
            case 'medium': return 'orange';
            case 'hard': return 'red';
            default: return 'blue';
        }
    };

    // Filter and organize chat messages properly
    const chatMessages = answers.flatMap((answer, index) => [
        {
            id: `question-${answer.id}`,
            type: 'question',
            content: answer.question,
            difficulty: answer.difficulty,
            timestamp: answer.timestamp,
            questionNumber: index + 1
        },
        {
            id: `answer-${answer.id}`,
            type: 'answer',
            content: answer.answer,
            score: answer.score,
            feedback: answer.feedback,
            timestamp: answer.timestamp,
            questionNumber: index + 1,
            timeTaken: answer.timeTaken
        }
    ]).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    // Calculate progress
    const progress = answers.length;
    const totalQuestions = questions.length;
    const progressPercent = totalQuestions > 0 ? (progress / totalQuestions) * 100 : 0;

    // Calculate current score
    const currentScore = answers.length > 0
        ? (answers.reduce((sum, ans) => sum + ans.score, 0) / answers.length).toFixed(1)
        : 0;

    if (interviewProgress === 'completed') {
        const finalScore = answers.length > 0 
            ? (answers.reduce((sum, ans) => sum + ans.score, 0) / answers.length).toFixed(1)
            : 0;
        const timeSpent = timeStarted ? ((Date.now() - timeStarted) / 1000 / 60).toFixed(1) : 0;

        return (
            <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
                <Card
                    title={
                        <Space>
                            <CheckCircleOutlined style={{ color: '#52c41a' }} />
                            Interview Completed Successfully!
                        </Space>
                    }
                    style={{ textAlign: 'center' }}
                >
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                        <div>
                            <Title level={2} style={{ color: '#1890ff', marginBottom: '10px' }}>
                                Congratulations, {currentCandidate?.name || 'Candidate'}!
                            </Title>
                            <Text style={{ fontSize: '16px', color: '#666' }}>
                                You have successfully completed the AI-powered interview.
                            </Text>
                        </div>

                        <Space size="large" style={{ justifyContent: 'center', width: '100%' }}>
                            <Card size="small" style={{ background: '#f6ffed', border: '1px solid #b7eb8f' }}>
                                <Title level={3} style={{ color: '#389e0d', margin: 0 }}>
                                    {finalScore}/10
                                </Title>
                                <Text style={{ color: '#389e0d' }}>Final Score</Text>
                            </Card>

                            <Card size="small" style={{ background: '#e6f7ff', border: '1px solid #91d5ff' }}>
                                <Title level={3} style={{ color: '#1890ff', margin: 0 }}>
                                    {timeSpent}m
                                </Title>
                                <Text style={{ color: '#1890ff' }}>Time Spent</Text>
                            </Card>

                            <Card size="small" style={{ background: '#fff7e6', border: '1px solid #ffd591' }}>
                                <Title level={3} style={{ color: '#fa8c16', margin: 0 }}>
                                    {answers.length}
                                </Title>
                                <Text style={{ color: '#fa8c16' }}>Questions</Text>
                            </Card>
                        </Space>

                        {currentCandidate?.summary && (
                            <Card title="AI Summary" style={{ textAlign: 'left' }}>
                                <Text>{currentCandidate.summary}</Text>

                                <div style={{ marginTop: '20px' }}>
                                    <Text strong>Strengths: </Text>
                                    <Space size="small" style={{ marginLeft: '10px' }}>
                                        {currentCandidate.strengths?.map((strength, index) => (
                                            <Tag key={index} color="green">{strength}</Tag>
                                        ))}
                                    </Space>
                                </div>

                                <div style={{ marginTop: '10px' }}>
                                    <Text strong>Areas for Improvement: </Text>
                                    <Space size="small" style={{ marginLeft: '10px' }}>
                                        {currentCandidate.improvements?.map((improvement, index) => (
                                            <Tag key={index} color="orange">{improvement}</Tag>
                                        ))}
                                    </Space>
                                </div>
                            </Card>
                        )}

                        <Space>
                            <Button
                                type="primary"
                                size="large"
                                onClick={() => {
                                    actions.completeReset();
                                    resetInterview();
                                }}
                            >
                                Start New Interview
                            </Button>
                            <Button
                                size="large"
                                onClick={() => {
                                    // This will navigate to the interviewer tab
                                    const interviewerTab = document.querySelector('[data-node-key="interviewer"]');
                                    if (interviewerTab) interviewerTab.click();
                                }}
                            >
                                View Results in Dashboard
                            </Button>
                        </Space>
                    </Space>
                </Card>
            </div>
        );
    }

    if (!currentCandidate) {
        return (
            <div style={{ padding: '40px', textAlign: 'center' }}>
                <Title level={3}>Please Upload Your Resume First</Title>
                <Text>Go to the resume upload section to start your interview.</Text>
            </div>
        );
    }

    if (!currentQuestion || questions.length === 0) {
        return (
            <div style={{ padding: '40px', textAlign: 'center' }}>
                <Title level={3}>Preparing your interview...</Title>
                <Text>Loading questions and setting up the interview environment.</Text>
                <Button 
                    type="primary" 
                    onClick={startInterview}
                    style={{ marginTop: '20px' }}
                >
                    Start Interview
                </Button>
            </div>
        );
    }

    const currentIndex = questions.findIndex(q => q.id === currentQuestion.id);

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            {/* Progress Header */}
            <Card style={{ marginBottom: '20px' }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text strong>Interview Progress</Text>
                        <Text>Question {currentIndex + 1} of {totalQuestions}</Text>
                    </div>
                    <Progress percent={progressPercent} showInfo={false} />
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Text type="secondary">Completed: {progress}/{totalQuestions}</Text>
                        <Text type="secondary">Current Score: {currentScore}/10</Text>
                    </div>
                </Space>
            </Card>

            {/* Current Question */}
            <Card
                title={
                    <Space>
                        <span>Question {currentIndex + 1}</span>
                        <Tag color={getDifficultyColor(currentQuestion.difficulty)}>
                            {currentQuestion.difficulty.toUpperCase()}
                        </Tag>
                        <Tag>{currentQuestion.category || 'General'}</Tag>
                    </Space>
                }
                style={{ marginBottom: '20px' }}
                extra={<Text type="secondary">Time Limit: {currentQuestion.timeLimit}s</Text>}
            >
                <Title level={4} style={{ margin: 0 }}>{currentQuestion.text}</Title>
            </Card>

            {/* Timer */}
            <Timer
                initialTime={currentQuestion.timeLimit}
                onTimeUp={handleTimeUp}
                isActive={isTimerActive}
                isSubmitting={isSubmitting}
            />

            {/* Chat History */}
            {answers.length > 0 && (
                <Card title="Interview History" style={{ marginBottom: '20px' }}>
                    <List
                        dataSource={chatMessages}
                        renderItem={(item) => (
                            <List.Item key={item.id}>
                                <Card
                                    size="small"
                                    style={{
                                        width: '100%',
                                        textAlign: item.type === 'question' ? 'left' : 'right',
                                        backgroundColor: item.type === 'question' ? '#fafafa' : '#f6ffed',
                                        border: item.type === 'question' ? '1px solid #d9d9d9' : '1px solid #b7eb8f'
                                    }}
                                >
                                    <div>
                                        {item.type === 'question' && (
                                            <div style={{ marginBottom: '5px' }}>
                                                <Tag color="blue">Q{item.questionNumber}</Tag>
                                                <Tag color={getDifficultyColor(item.difficulty)}>
                                                    {item.difficulty}
                                                </Tag>
                                            </div>
                                        )}
                                        <div style={{ fontWeight: item.type === 'question' ? 'bold' : 'normal' }}>
                                            {item.content}
                                        </div>
                                        {item.type === 'answer' && (
                                            <div style={{ marginTop: '8px' }}>
                                                <Space size="small">
                                                    <Text type="secondary" style={{ fontSize: '12px' }}>
                                                        Score: <strong>{item.score}/10</strong>
                                                    </Text>
                                                    <Text type="secondary" style={{ fontSize: '12px' }}>
                                                        Time: {item.timeTaken}s
                                                    </Text>
                                                </Space>
                                                {item.feedback && (
                                                    <div style={{ fontSize: '12px', color: '#666', fontStyle: 'italic', marginTop: '4px' }}>
                                                        {item.feedback}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            </List.Item>
                        )}
                        style={{ maxHeight: '400px', overflow: 'auto' }}
                    />
                </Card>
            )}

            {/* Answer Input */}
            <form onSubmit={handleSubmit}>
                <Card title="Your Answer">
                    <Input.TextArea
                        value={currentAnswer}
                        onChange={(e) => setCurrentAnswer(e.target.value)}
                        placeholder="Type your answer here... Be as detailed as possible."
                        rows={6}
                        style={{ marginBottom: '10px' }}
                        disabled={isSubmitting || !isTimerActive}
                    />
                    <Button
                        type="primary"
                        htmlType="submit"
                        icon={<SendOutlined />}
                        loading={isSubmitting}
                        disabled={!currentAnswer.trim() || isSubmitting || !isTimerActive}
                        size="large"
                        style={{ width: '100%' }}
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit Answer'}
                    </Button>
                </Card>
            </form>

            <div ref={messagesEndRef} />
        </div>
    );
};

export default ChatInterface;