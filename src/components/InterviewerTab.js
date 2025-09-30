import React, { useState, useMemo } from 'react';
import { Table, Card, Input, Modal, Tag, Rate, Button, Space, Typography, Empty, Select, Popconfirm, message } from 'antd';
import { SearchOutlined, EyeOutlined, UserOutlined, DeleteOutlined } from '@ant-design/icons';
import { useApp } from '../context/AppContext';

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;

const InterviewerTab = () => {
  const [searchText, setSearchText] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [sortBy, setSortBy] = useState('score');
  const [filterStatus, setFilterStatus] = useState('all');
  const { state, dispatch } = useApp();

  const { candidates } = state;

  // Filter and sort candidates
  const filteredCandidates = useMemo(() => {
    let filtered = candidates.filter(candidate => {
      const matchesSearch =
        candidate.name?.toLowerCase().includes(searchText.toLowerCase()) ||
        candidate.email?.toLowerCase().includes(searchText.toLowerCase());

      const matchesStatus =
        filterStatus === 'all' ||
        candidate.status === filterStatus;

      return matchesSearch && matchesStatus;
    });

    // Sort candidates
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'score':
          return (b.score || 0) - (a.score || 0);
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'date':
          return new Date(b.timestamp) - new Date(a.timestamp);
        default:
          return 0;
      }
    });

    return filtered;
  }, [candidates, searchText, sortBy, filterStatus]);

  // Delete candidate function
  const handleDeleteCandidate = (candidateId) => {
    dispatch({
      type: 'DELETE_CANDIDATE',
      payload: candidateId
    });
    message.success('Candidate deleted successfully');
  };

  // Delete all candidates function
  const handleDeleteAllCandidates = () => {
    dispatch({
      type: 'DELETE_ALL_CANDIDATES'
    });
    message.success('All candidates deleted successfully');
  };

  const showCandidateDetails = (candidate) => {
    setSelectedCandidate(candidate);
    setIsModalVisible(true);
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setSelectedCandidate(null);
  };

  const getDifficultyColor = (difficulty) => {
    if (!difficulty) return 'blue';

    switch (difficulty.toLowerCase()) {
      case 'easy': return 'green';
      case 'medium': return 'orange';
      case 'hard': return 'red';
      default: return 'blue';
    }
  };

  const getDifficultyText = (difficulty) => {
    if (!difficulty) return 'UNKNOWN';
    return difficulty.toUpperCase();
  };

  const columns = [
    {
      title: 'Candidate',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => (a.name || '').localeCompare(b.name || ''),
      render: (name, record) => (
        <Space>
          <UserOutlined style={{ color: '#1890ff' }} />
          <div>
            <div style={{ fontWeight: 'bold' }}>{name || 'Unknown'}</div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.email}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone) => phone || 'Not provided',
    },
    {
      title: 'Score',
      dataIndex: 'score',
      key: 'score',
      sorter: (a, b) => (a.score || 0) - (b.score || 0),
      render: (score) => score ? (
        <Space>
          <Rate disabled value={score / 2} style={{ fontSize: '14px' }} />
          <Text strong>{score}/10</Text>
        </Space>
      ) : 'Not completed',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'completed' ? 'green' : status === 'in-progress' ? 'orange' : 'blue'}>
          {status === 'completed' ? 'Completed' : status === 'in-progress' ? 'In Progress' : 'Pending'}
        </Tag>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp) => new Date(timestamp).toLocaleDateString(),
      sorter: (a, b) => new Date(a.timestamp) - new Date(b.timestamp),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => showCandidateDetails(record)}
            style={{ padding: 0 }}
          >
            View
          </Button>
          <Popconfirm
            title="Delete Candidate"
            description="Are you sure you want to delete this candidate? This action cannot be undone."
            onConfirm={() => handleDeleteCandidate(record.id)}
            okText="Yes"
            cancelText="No"
            okType="danger"
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              style={{ padding: 0 }}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '20px' }}>
      <Title level={2}>Interviewer Dashboard</Title>

      <Card>
        {/* Search and Filter Controls */}
        <Space size="large" style={{ marginBottom: '20px', width: '100%', justifyContent: 'space-between' }}>
          <Search
            placeholder="Search candidates by name or email"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: '300px' }}
          />

          <Space>
            <Select
              value={sortBy}
              onChange={setSortBy}
              style={{ width: '120px' }}
            >
              <Option value="score">Sort by Score</Option>
              <Option value="name">Sort by Name</Option>
              <Option value="date">Sort by Date</Option>
            </Select>

            <Select
              value={filterStatus}
              onChange={setFilterStatus}
              style={{ width: '140px' }}
            >
              <Option value="all">All Status</Option>
              <Option value="completed">Completed</Option>
              <Option value="in-progress">In Progress</Option>
              <Option value="pending">Pending</Option>
            </Select>

            {candidates.length > 0 && (
              <Popconfirm
                title="Delete All Candidates"
                description="Are you sure you want to delete ALL candidates? This action cannot be undone."
                onConfirm={handleDeleteAllCandidates}
                okText="Yes"
                cancelText="No"
                okType="danger"
              >
                <Button danger icon={<DeleteOutlined />}>
                  Delete All
                </Button>
              </Popconfirm>
            )}
          </Space>
        </Space>

        {/* Candidates Table */}
        <Table
          columns={columns}
          dataSource={filteredCandidates.map(candidate => ({ ...candidate, key: candidate.id }))}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} candidates`
          }}
          locale={{
            emptyText: (
              <Empty
                description="No candidates found"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <Text type="secondary">
                  {candidates.length === 0
                    ? "No interviews have been conducted yet. Candidates will appear here after they start interviews."
                    : "No candidates match your search criteria."
                  }
                </Text>
              </Empty>
            )
          }}
        />
      </Card>

      {/* Candidate Details Modal */}
      <Modal
        title={
          <Space>
            <UserOutlined />
            Candidate Interview Details
          </Space>
        }
        open={isModalVisible}
        onCancel={handleModalClose}
        footer={[
          <Popconfirm
            key="delete"
            title="Delete Candidate"
            description="Are you sure you want to delete this candidate?"
            onConfirm={() => {
              handleDeleteCandidate(selectedCandidate.id);
              handleModalClose();
            }}
            okText="Yes"
            cancelText="No"
            okType="danger"
          >
            <Button danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>,
          <Button key="close" onClick={handleModalClose}>
            Close
          </Button>
        ]}
        width={900}
        style={{ top: 20 }}
      >
        {selectedCandidate && (
          <div>
            {/* Profile Information */}
            <Card title="Profile Information" style={{ marginBottom: '20px' }}>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <Text strong>Name: </Text>
                    <Text>{selectedCandidate.name}</Text>
                  </div>
                  <div>
                    <Text strong>Email: </Text>
                    <Text>{selectedCandidate.email}</Text>
                  </div>
                  <div>
                    <Text strong>Phone: </Text>
                    <Text>{selectedCandidate.phone || 'Not provided'}</Text>
                  </div>
                </div>

                {selectedCandidate.score && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <Text strong>Final Score: </Text>
                      <Text style={{ fontSize: '18px', fontWeight: 'bold', color: '#1890ff' }}>
                        {selectedCandidate.score}/10
                      </Text>
                    </div>
                    <Rate disabled value={selectedCandidate.score / 2} />
                    <div>
                      <Text strong>Status: </Text>
                      <Tag color={selectedCandidate.status === 'completed' ? 'green' : 'orange'}>
                        {selectedCandidate.status === 'completed' ? 'Completed' : 'In Progress'}
                      </Tag>
                    </div>
                  </div>
                )}
              </Space>
            </Card>

            {/* AI Summary */}
            {selectedCandidate.summary && (
              <Card title="AI Assessment Summary" style={{ marginBottom: '20px' }}>
                <Text>{selectedCandidate.summary}</Text>

                {selectedCandidate.strengths && selectedCandidate.strengths.length > 0 && (
                  <div style={{ marginTop: '15px' }}>
                    <Text strong>Strengths: </Text>
                    <Space size="small" style={{ marginLeft: '10px' }}>
                      {selectedCandidate.strengths.map((strength, index) => (
                        <Tag key={index} color="green">{strength}</Tag>
                      ))}
                    </Space>
                  </div>
                )}

                {selectedCandidate.improvements && selectedCandidate.improvements.length > 0 && (
                  <div style={{ marginTop: '10px' }}>
                    <Text strong>Areas for Improvement: </Text>
                    <Space size="small" style={{ marginLeft: '10px' }}>
                      {selectedCandidate.improvements.map((improvement, index) => (
                        <Tag key={index} color="orange">{improvement}</Tag>
                      ))}
                    </Space>
                  </div>
                )}
              </Card>
            )}

            {/* Interview Results */}
            {selectedCandidate.interviewData && (
              <Card title="Detailed Interview Results">
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  {/* Interview Metadata */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#666' }}>
                    <Text>Started: {new Date(selectedCandidate.interviewData.startedAt).toLocaleString()}</Text>
                    <Text>Completed: {new Date(selectedCandidate.interviewData.completedAt).toLocaleString()}</Text>
                    <Text>
                      Duration: {Math.round(selectedCandidate.interviewData.duration / 1000 / 60)} minutes
                    </Text>
                  </div>

                  {/* Questions & Answers */}
                  <div>
                    <Title level={4}>Questions & Answers</Title>
                    {selectedCandidate.interviewData.answers?.map((answer, index) => (
                      <Card
                        key={answer.id}
                        size="small"
                        style={{ marginBottom: '15px', borderLeft: `4px solid #1890ff` }}
                      >
                        <div style={{ marginBottom: '10px' }}>
                          <Space>
                            <Text strong>Q{index + 1}:</Text>
                            <Tag color={getDifficultyColor(answer.difficulty)}>
                              {getDifficultyText(answer.difficulty)}
                            </Tag>
                            <Tag>{answer.category || 'Unknown Category'}</Tag>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              Time: {answer.timeTaken}s / {answer.timeLimit}s
                            </Text>
                          </Space>
                        </div>

                        <Text strong>Question: </Text>
                        <Text>{answer.question}</Text>

                        <div style={{ margin: '8px 0' }}>
                          <Text strong>Answer: </Text>
                          <Text style={{ fontStyle: answer.answer ? 'normal' : 'italic' }}>
                            {answer.answer || 'No answer provided'}
                          </Text>
                        </div>

                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '8px',
                          background: '#fafafa',
                          borderRadius: '4px'
                        }}>
                          <Space>
                            <Text strong>Score:</Text>
                            <Rate disabled value={answer.score / 2} style={{ fontSize: '14px' }} />
                            <Text strong style={{ color: '#1890ff' }}>{answer.score}/10</Text>
                          </Space>

                          {answer.feedback && (
                            <Text type="secondary" style={{ fontSize: '12px', maxWidth: '300px' }}>
                              {answer.feedback}
                            </Text>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </Space>
              </Card>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default InterviewerTab;