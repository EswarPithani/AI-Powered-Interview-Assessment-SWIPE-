export const generateQuestions = async (skills = [], role = 'Full Stack Developer') => {
    const primarySkills = skills.length > 0 ? skills : ['JavaScript', 'React', 'Node.js', 'HTML/CSS'];

    const questionPool = {
        'easy': [
            {
                id: 1,
                text: "What is the difference between let, const, and var in JavaScript?",
                difficulty: "easy",
                timeLimit: 20,
                type: "technical",
                category: "JavaScript Fundamentals"
            },
            {
                id: 2,
                text: "Explain what React components are and the difference between functional and class components.",
                difficulty: "easy",
                timeLimit: 20,
                type: "technical",
                category: "React Basics"
            },
            {
                id: 3,
                text: "What is the purpose of CSS Flexbox and how does it help in layout design?",
                difficulty: "easy",
                timeLimit: 20,
                type: "technical",
                category: "CSS & Styling"
            },
            {
                id: 4,
                text: "How does HTTP protocol work and what are common HTTP status codes?",
                difficulty: "easy",
                timeLimit: 20,
                type: "technical",
                category: "Web Fundamentals"
            },
            {
                id: 5,
                text: "What is version control and why is Git important in software development?",
                difficulty: "easy",
                timeLimit: 20,
                type: "technical",
                category: "Development Tools"
            }
        ],
        'medium': [
            {
                id: 6,
                text: "Explain the concept of closures in JavaScript with a practical example.",
                difficulty: "medium",
                timeLimit: 60,
                type: "technical",
                category: "JavaScript Advanced"
            },
            {
                id: 7,
                text: "How would you manage state in a large React application? Compare different state management solutions.",
                difficulty: "medium",
                timeLimit: 60,
                type: "technical",
                category: "State Management"
            },
            {
                id: 8,
                text: "Describe REST API principles and how you would design a RESTful endpoint for user management.",
                difficulty: "medium",
                timeLimit: 60,
                type: "technical",
                category: "API Design"
            },
            {
                id: 9,
                text: "What are database indexes and how do they improve query performance?",
                difficulty: "medium",
                timeLimit: 60,
                type: "technical",
                category: "Database"
            },
            {
                id: 10,
                text: "Explain the concept of promises and async/await in JavaScript with error handling examples.",
                difficulty: "medium",
                timeLimit: 60,
                type: "technical",
                category: "Asynchronous Programming"
            }
        ],
        'hard': [
            {
                id: 11,
                text: "Design a scalable architecture for an e-commerce platform handling 10,000 concurrent users. Consider database, caching, and microservices.",
                difficulty: "hard",
                timeLimit: 120,
                type: "architectural",
                category: "System Design"
            },
            {
                id: 12,
                text: "How would you optimize a React application that has slow initial load time and poor performance on mobile devices?",
                difficulty: "hard",
                timeLimit: 120,
                type: "optimization",
                category: "Performance"
            },
            {
                id: 13,
                text: "Explain the concept of eventual consistency in distributed systems and how you would handle data synchronization across multiple services.",
                difficulty: "hard",
                timeLimit: 120,
                type: "conceptual",
                category: "Distributed Systems"
            },
            {
                id: 14,
                text: "Design an authentication system that supports JWT, session management, and OAuth2 with proper security considerations.",
                difficulty: "hard",
                timeLimit: 120,
                type: "security",
                category: "Security & Auth"
            },
            {
                id: 15,
                text: "How would you implement real-time features like live chat or notifications in a web application? Discuss different approaches and trade-offs.",
                difficulty: "hard",
                timeLimit: 120,
                type: "real-time",
                category: "Real-time Systems"
            }
        ]
    };

    const selectedQuestions = [
        ...getRandomQuestions(questionPool.easy, 2),
        ...getRandomQuestions(questionPool.medium, 2),
        ...getRandomQuestions(questionPool.hard, 2)
    ];

    return selectedQuestions.map((q, index) => ({
        ...q,
        id: index + 1, 
        order: index + 1
    }));
};

export const evaluateAnswer = async (question, answer, timeTaken) => {
 
    const baseScore = {
        'easy': 5,
        'medium': 6,
        'hard': 7
    }[question.difficulty] || 5;

    const contentScore = evaluateContentQuality(question, answer);
    const structureScore = evaluateAnswerStructure(answer);
    const keywordScore = checkRelevantKeywords(question, answer);
    const timeScore = calculateTimeScore(question.timeLimit, timeTaken);
    const completenessScore = evaluateAnswerCompleteness(answer);

    const finalScore = Math.round(
        (contentScore * 0.4) +
        (structureScore * 0.2) +
        (keywordScore * 0.2) +
        (timeScore * 0.1) +
        (completenessScore * 0.1)
    );

    const feedback = generateDetailedFeedback(question, answer, finalScore, timeTaken);

    return {
        score: Math.min(10, Math.max(1, finalScore)),
        feedback,
        questionId: question.id,
        timeTaken,
        evaluatedAt: new Date().toISOString(),
        analysis: {
            contentScore,
            structureScore,
            keywordScore,
            timeScore,
            completenessScore
        }
    };
};

export const generateSummary = async (candidate, answers, questions) => {
    const totalScore = answers.reduce((sum, ans) => sum + ans.score, 0);
    const averageScore = (totalScore / answers.length).toFixed(1);

    const difficultyScores = {
        easy: { total: 0, count: 0 },
        medium: { total: 0, count: 0 },
        hard: { total: 0, count: 0 }
    };

    answers.forEach((answer, index) => {
        const question = questions.find(q => q.id === answer.questionId);
        if (question && difficultyScores[question.difficulty]) {
            difficultyScores[question.difficulty].total += answer.score;
            difficultyScores[question.difficulty].count++;
        }
    });

    const categoryScores = {};
    answers.forEach((answer, index) => {
        const question = questions.find(q => q.id === answer.questionId);
        if (question && question.category) {
            const category = question.category;
            if (!categoryScores[category]) {
                categoryScores[category] = { total: 0, count: 0 };
            }
            categoryScores[category].total += answer.score;
            categoryScores[category].count++;
        }
    });

    const strengths = Object.entries(categoryScores)
        .filter(([category, data]) => (data.total / data.count) >= 7)
        .map(([category]) => category);

    const improvements = Object.entries(categoryScores)
        .filter(([category, data]) => (data.total / data.count) <= 5)
        .map(([category]) => category);

    let summary = "";
    let performanceLevel = "";

    if (averageScore >= 8.5) {
        performanceLevel = "Exceptional";
        summary = `${candidate.name} demonstrated outstanding technical proficiency with exceptional performance across all difficulty levels. Shows deep understanding of ${strengths.slice(0, 2).join(' and ')} and excellent problem-solving capabilities. A top-tier candidate ready for senior-level challenges.`;
    } else if (averageScore >= 7.0) {
        performanceLevel = "Strong";
        summary = `${candidate.name} shows solid technical foundation with strong performance in ${strengths.length > 0 ? strengths.join(', ') : 'core concepts'}. Demonstrates good problem-solving approach and would be a valuable team member with some guidance in ${improvements.length > 0 ? improvements.join(', ') : 'advanced topics'}.`;
    } else if (averageScore >= 5.5) {
        performanceLevel = "Competent";
        summary = `${candidate.name} has adequate technical knowledge for junior-level positions. Shows understanding of basic concepts but needs improvement in ${improvements.length > 0 ? improvements.join(', ') : 'key areas'}. Would benefit from mentorship and practical experience.`;
    } else {
        performanceLevel = "Needs Development";
        summary = `${candidate.name} requires significant improvement in technical skills. Focus on strengthening fundamentals in ${improvements.length > 0 ? improvements.join(', ') : 'core programming concepts'} through additional training and hands-on projects.`;
    }

    return {
        finalScore: parseFloat(averageScore),
        summary,
        performanceLevel,
        strengths: strengths.length > 0 ? strengths : ['Problem-solving', 'Communication'],
        improvements: improvements.length > 0 ? improvements : ['Technical depth', 'Advanced concepts'],
        totalQuestions: answers.length,
        completionDate: new Date().toISOString(),
        detailedScores: {
            byDifficulty: difficultyScores,
            byCategory: categoryScores
        }
    };
};

const getRandomQuestions = (questions, count) => {
    const shuffled = [...questions].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
};

const evaluateContentQuality = (question, answer) => {
    const answerLength = answer.trim().length;
    let score = 0;

    if (answerLength < 20) score = 3;
    else if (answerLength < 50) score = 5;
    else if (answerLength < 100) score = 7;
    else score = 9;

    if (answer.includes('```') || answer.includes('function') || answer.includes('const ') || answer.includes('class ')) {
        score += 1;
    }

    return Math.min(10, score);
};

const evaluateAnswerStructure = (answer) => {
    const sentences = answer.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const hasStructure = sentences.length >= 2;
    const hasBulletPoints = answer.includes('- ') || answer.includes('* ') || answer.includes('1. ');

    if (hasBulletPoints && hasStructure) return 9;
    if (hasStructure) return 7;
    return 5;
};

const evaluateAnswerCompleteness = (answer) => {
    const trimmed = answer.trim();
    if (trimmed.length === 0) return 1;
    if (trimmed.length < 10) return 3;
    if (trimmed.length < 30) return 5;
    if (trimmed.length < 80) return 7;
    return 9;
};

const checkRelevantKeywords = (question, answer) => {
    const questionCategory = question?.category || '';
    const questionText = question?.text || '';

    const keywordMap = {
        'JavaScript Fundamentals': ['let', 'const', 'var', 'scope', 'hoisting', 'es6', 'arrow function'],
        'React Basics': ['component', 'virtual dom', 'jsx', 'state', 'props', 'hooks', 'functional', 'class'],
        'State Management': ['redux', 'context', 'state', 'store', 'reducer', 'flux', 'mobx', 'zustand'],
        'Performance': ['optimization', 'performance', 'bundle', 'lazy', 'memo', 'profiler', 'lighthouse'],
        'System Design': ['scalable', 'microservices', 'load balancer', 'cache', 'database', 'api gateway'],
        'Security & Auth': ['jwt', 'oauth', 'authentication', 'authorization', 'session', 'token', 'https'],
        'CSS & Styling': ['flexbox', 'grid', 'responsive', 'media query', 'animation', 'transform'],
        'Web Fundamentals': ['http', 'https', 'status code', 'request', 'response', 'headers'],
        'Development Tools': ['git', 'version control', 'commit', 'branch', 'merge', 'pull request'],
        'API Design': ['rest', 'endpoint', 'crud', 'json', 'authentication', 'versioning'],
        'Database': ['index', 'query', 'normalization', 'transaction', 'acid', 'nosql'],
        'Asynchronous Programming': ['promise', 'async', 'await', 'callback', 'event loop', 'microtask']
    };

    const answerLower = answer.toLowerCase();
    let score = 5; 

    if (questionCategory && keywordMap[questionCategory]) {
        keywordMap[questionCategory].forEach(keyword => {
            if (answerLower.includes(keyword.toLowerCase())) {
                score += 0.5;
            }
        });
    }

    const generalKeywords = ['javascript', 'react', 'node', 'html', 'css', 'database', 'api', 'function', 'variable'];
    generalKeywords.forEach(keyword => {
        if (answerLower.includes(keyword)) {
            score += 0.2;
        }
    });

    return Math.min(10, score);
};

const calculateTimeScore = (timeLimit, timeTaken) => {
    const timePercentage = (timeTaken / timeLimit) * 100;

    if (timePercentage < 33) return 9; 
    if (timePercentage < 66) return 7; 
    if (timePercentage < 90) return 5; 
    if (timePercentage <= 100) return 3; 
    return 1; 
};

const generateDetailedFeedback = (question, answer, score, timeTaken) => {
    const timeFeedback = timeTaken > question.timeLimit
        ? `Time management: Exceeded time limit by ${timeTaken - question.timeLimit}s.`
        : `Time management: Completed with ${question.timeLimit - timeTaken}s remaining.`;

    if (score >= 9) {
        return `Excellent answer! Comprehensive, well-structured, and demonstrates deep understanding. ${timeFeedback}`;
    } else if (score >= 7) {
        return `Good answer covering key concepts. Could benefit from more examples or deeper explanation. ${timeFeedback}`;
    } else if (score >= 5) {
        return `Adequate answer but lacks depth. Consider expanding on the main points with practical examples. ${timeFeedback}`;
    } else {
        return `Answer needs significant improvement. Focus on understanding core concepts and providing more detailed explanations. ${timeFeedback}`;
    }
};

export const extractSkillsFromResume = async (resumeText) => {
    const commonSkills = [
        'JavaScript', 'TypeScript', 'React', 'Angular', 'Vue', 'Node.js', 'Python', 'Java',
        'HTML', 'CSS', 'SASS', 'LESS', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis',
        'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'Git', 'REST', 'GraphQL',
        'Express', 'Next.js', 'NestJS', 'Spring Boot', 'Django', 'Flask'
    ];

    const extracted = commonSkills.filter(skill =>
        resumeText.toLowerCase().includes(skill.toLowerCase())
    );

    return extracted.length > 0 ? extracted : ['JavaScript', 'React', 'Node.js', 'HTML/CSS'];
};