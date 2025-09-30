import React, { useState } from 'react';
import { Upload, Button, message, Form, Input, Card, Space, Alert, Modal, Avatar, Typography } from 'antd';
import { UploadOutlined, UserOutlined, MailOutlined, PhoneOutlined, MessageOutlined } from '@ant-design/icons';
import { parseResume } from '../utils/resumeParser';
import { useApp } from '../context/AppContext';
import { ResumeChatbot, createChatbot } from '../services/chatbotService';

const { Title, Text } = Typography;
const { TextArea } = Input;

const ResumeUpload = () => {
    const [form] = Form.useForm();
    const { actions } = useApp();
    const [loading, setLoading] = useState(false);
    const [extractedInfo, setExtractedInfo] = useState(null);
    const [showChatbot, setShowChatbot] = useState(false);
    const [chatbot, setChatbot] = useState(null);
    const [conversation, setConversation] = useState([]);
    const [userInput, setUserInput] = useState('');

    const handleFileUpload = async (file) => {
        if (!file) return false;

        const allowedTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];

        if (!allowedTypes.includes(file.type)) {
            message.error('Please upload a PDF or DOCX file');
            return false;
        }

        if (file.size > 5 * 1024 * 1024) {
            message.error('File size must be less than 5MB');
            return false;
        }

        setLoading(true);
        try {
            const info = await parseResume(file);
            setExtractedInfo(info);
            
            // Pre-fill form with extracted data
            form.setFieldsValue({
                name: info.name || '',
                email: info.email || '',
                phone: info.phone || ''
            });

            // Check if we need chatbot for missing fields
            checkAndShowChatbot(info);

            message.success('Resume parsed successfully!');

        } catch (error) {
            console.error('Resume parsing error:', error);
            message.error('Failed to parse resume. Please enter information manually.');
        } finally {
            setLoading(false);
        }
        return false;
    };

    // Check for missing fields and show chatbot if needed
    const checkAndShowChatbot = (currentData = null) => {
        const formValues = form.getFieldsValue();
        const dataToCheck = currentData || formValues;
        
        const missingFields = [];
        if (!dataToCheck.name || dataToCheck.name.trim() === '') missingFields.push('name');
        if (!dataToCheck.email || dataToCheck.email.trim() === '') missingFields.push('email');
        if (!dataToCheck.phone || dataToCheck.phone.trim() === '') missingFields.push('phone');

        if (missingFields.length > 0) {
            const newChatbot = new ResumeChatbot(true);
            const initialData = {
                name: dataToCheck.name || '',
                email: dataToCheck.email || '',
                phone: dataToCheck.phone || '',
                skills: extractedInfo?.skills || []
            };
            const welcomeMessage = newChatbot.initialize(initialData);
            
            setChatbot(newChatbot);
            setConversation([{
                type: 'bot',
                message: welcomeMessage,
                timestamp: new Date().toISOString()
            }]);
            setShowChatbot(true);
        }
    };

    const handleChatbotSubmit = async () => {
        if (!userInput.trim() || !chatbot) return;

        // Add user message to conversation
        const userMessage = {
            type: 'user',
            message: userInput,
            timestamp: new Date().toISOString()
        };

        setConversation(prev => [...prev, userMessage]);
        setUserInput('');

        try {
            // Process message with chatbot
            const response = await chatbot.processMessage(userInput);
            
            // Add bot response to conversation
            const botMessage = {
                type: 'bot',
                message: response.message,
                timestamp: new Date().toISOString()
            };

            setConversation(prev => [...prev, botMessage]);

            // If conversation is complete, update form and close chatbot
            if (response.isComplete) {
                const candidateData = chatbot.getCandidateData();
                
                // Update form with collected data
                form.setFieldsValue({
                    name: candidateData.name,
                    email: candidateData.email,
                    phone: candidateData.phone || ''
                });

                // Update extracted info
                setExtractedInfo(prev => ({
                    ...prev,
                    ...candidateData
                }));

                setTimeout(() => {
                    setShowChatbot(false);
                    message.success('All information collected!');
                }, 1000);
            }

        } catch (error) {
            console.error('Chatbot error:', error);
            message.error('Error processing message. Please try again.');
        }
    };

    const handleFormSubmit = (values) => {
        // Check if all required fields are filled
        const missingFields = [];
        if (!values.name || values.name.trim() === '') missingFields.push('name');
        if (!values.email || values.email.trim() === '') missingFields.push('email');
        if (!values.phone || values.phone.trim() === '') missingFields.push('phone');

        if (missingFields.length > 0) {
            // Show chatbot for missing fields
            checkAndShowChatbot(values);
            message.warning(`Please complete all required fields: ${missingFields.join(', ')}`);
            return;
        }

        const candidateData = {
            id: `candidate-${Date.now()}`,
            ...values,
            skills: extractedInfo?.skills || [],
            resumeData: extractedInfo?.rawText,
            status: 'pending',
            timestamp: new Date().toISOString()
        };

        actions.setCurrentCandidate(candidateData);
        actions.setInterviewProgress('ready-to-start');
        message.success('Profile completed! Ready to start interview.');
    };

    // Handle form field changes to detect when fields become empty
    const handleFormChange = (changedFields, allFields) => {
        // If a field becomes empty, we might want to show chatbot
        const emptyFields = Object.keys(changedFields).filter(fieldName => {
            const field = changedFields[fieldName];
            return !field.value || field.value.trim() === '';
        });

        if (emptyFields.length > 0) {
            // You can optionally show chatbot when fields become empty
            // For now, we'll just track it but not automatically show chatbot
            console.log('Empty fields detected:', emptyFields);
        }
    };

    // Manual chatbot trigger for testing
    const triggerChatbotManually = () => {
        checkAndShowChatbot();
    };

    const uploadProps = {
        beforeUpload: handleFileUpload,
        accept: '.pdf,.docx',
        showUploadList: false,
    };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <Card
                title="Start Your Interview"
                style={{ boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}
                extra={
                    <Button 
                        type="link" 
                        onClick={triggerChatbotManually}
                        icon={<MessageOutlined />}
                    >
                        Need Help?
                    </Button>
                }
            >
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    <div>
                        <h3 style={{ color: '#1890ff', marginBottom: '10px' }}>Step 1: Upload Your Resume</h3>
                        <Upload {...uploadProps}>
                            <Button
                                icon={<UploadOutlined />}
                                loading={loading}
                                size="large"
                                style={{ width: '100%', height: '50px' }}
                            >
                                {loading ? 'Parsing Resume...' : 'Upload Resume (PDF/DOCX)'}
                            </Button>
                        </Upload>
                        <p style={{ color: '#666', fontSize: '12px', marginTop: '8px' }}>
                            Supported formats: PDF, DOCX. Maximum file size: 5MB
                        </p>
                    </div>

                    {extractedInfo?.note && !showChatbot && (
                        <Alert
                            message="Parsing Result"
                            description={extractedInfo.note}
                            type="info"
                            showIcon
                        />
                    )}

                    <div>
                        <h3 style={{ color: '#1890ff', marginBottom: '10px' }}>
                            Step 2: Verify Your Information
                            <Text type="secondary" style={{ fontSize: '14px', marginLeft: '10px' }}>
                                (All fields are required)
                            </Text>
                        </h3>
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={handleFormSubmit}
                            onFieldsChange={handleFormChange}
                        >
                            <Form.Item
                                label="Full Name"
                                name="name"
                                rules={[{ required: true, message: 'Please enter your name' }]}
                            >
                                <Input
                                    prefix={<UserOutlined />}
                                    placeholder="Enter your full name"
                                    size="large"
                                    allowClear
                                />
                            </Form.Item>

                            <Form.Item
                                label="Email"
                                name="email"
                                rules={[
                                    { required: true, message: 'Please enter your email' },
                                    { type: 'email', message: 'Please enter a valid email' }
                                ]}
                            >
                                <Input
                                    prefix={<MailOutlined />}
                                    placeholder="Enter your email"
                                    size="large"
                                    allowClear
                                />
                            </Form.Item>

                            <Form.Item
                                label="Phone"
                                name="phone"
                                rules={[{ required: true, message: 'Please enter your phone number' }]}
                            >
                                <Input
                                    prefix={<PhoneOutlined />}
                                    placeholder="Enter your phone number"
                                    size="large"
                                    allowClear
                                />
                            </Form.Item>

                            <Form.Item>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    size="large"
                                    style={{
                                        width: '100%',
                                        height: '50px',
                                        fontSize: '16px',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    Start Interview
                                </Button>
                            </Form.Item>
                        </Form>
                    </div>

                    {/* Help Text */}
                    <Alert
                        message="Having trouble?"
                        description="If you're missing information or need help, click the 'Need Help?' button above to get assistance from our chatbot."
                        type="info"
                        showIcon
                    />
                </Space>
            </Card>

            {/* Chatbot Modal */}
            <Modal
                title={
                    <Space>
                        <MessageOutlined />
                        Complete Your Profile
                    </Space>
                }
                open={showChatbot}
                onCancel={() => setShowChatbot(false)}
                footer={null}
                width={600}
                maskClosable={false}
            >
                <div style={{ marginBottom: '16px' }}>
                    <Text type="secondary">
                        I need some additional information to proceed with your interview.
                    </Text>
                </div>

                {/* Chat Conversation */}
                <div
                    style={{
                        height: '200px',
                        border: '1px solid #d9d9d9',
                        borderRadius: '6px',
                        padding: '16px',
                        overflowY: 'auto',
                        marginBottom: '16px',
                        backgroundColor: '#fafafa'
                    }}
                >
                    {conversation.map((msg, index) => (
                        <div
                            key={index}
                            style={{
                                display: 'flex',
                                justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start',
                                marginBottom: '12px'
                            }}
                        >
                            <div
                                style={{
                                    maxWidth: '80%',
                                    padding: '8px 12px',
                                    borderRadius: '12px',
                                    backgroundColor: msg.type === 'user' ? '#1890ff' : '#fff',
                                    color: msg.type === 'user' ? '#fff' : '#000',
                                    border: msg.type === 'bot' ? '1px solid #d9d9d9' : 'none'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                                    <Avatar 
                                        size="small" 
                                        icon={msg.type === 'user' ? <UserOutlined /> : <MessageOutlined />}
                                        style={{ 
                                            backgroundColor: msg.type === 'user' ? '#fff' : '#1890ff',
                                            color: msg.type === 'user' ? '#1890ff' : '#fff',
                                            marginRight: '8px'
                                        }}
                                    />
                                    <Text strong style={{ color: msg.type === 'user' ? '#fff' : '#000', fontSize: '12px' }}>
                                        {msg.type === 'user' ? 'You' : 'Assistant'}
                                    </Text>
                                </div>
                                {msg.message}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Input Area */}
                <Space.Compact style={{ width: '100%' }}>
                    <TextArea
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        placeholder="Type your response here..."
                        rows={2}
                        onPressEnter={(e) => {
                            if (e.shiftKey) return;
                            e.preventDefault();
                            handleChatbotSubmit();
                        }}
                    />
                    <Button 
                        type="primary" 
                        onClick={handleChatbotSubmit}
                        disabled={!userInput.trim()}
                    >
                        Send
                    </Button>
                </Space.Compact>
            </Modal>
        </div>
    );
};

export default ResumeUpload;