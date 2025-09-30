import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Load initial state from localStorage
const loadState = () => {
    try {
        const serializedState = localStorage.getItem('interviewAppState');
        if (serializedState === null) {
            return getInitialState();
        }
        const parsedState = JSON.parse(serializedState);

        // Ensure all required fields exist in loaded state
        return {
            ...getInitialState(),
            ...parsedState,
            interview: {
                ...getInitialState().interview,
                ...parsedState.interview,
                // Reset showWelcomeBack on load to prevent immediate popup
                showWelcomeBack: false
            }
        };
    } catch (err) {
        console.error('Error loading state:', err);
        return getInitialState();
    }
};

// Save state to localStorage
const saveState = (state) => {
    try {
        const serializedState = JSON.stringify(state);
        localStorage.setItem('interviewAppState', serializedState);
    } catch (err) {
        console.error('Error saving state:', err);
    }
};

const getInitialState = () => ({
    candidates: [],
    currentCandidate: null,
    interview: {
        currentQuestion: null,
        questions: [],
        answers: [],
        timer: null,
        isPaused: false,
        showWelcomeBack: false,
        interviewProgress: 'not-started',
        lastActivity: null,
        interviewStartTime: null,
        welcomeBackShown: false // Track if welcome back was already shown
    }
});

// Actions
const ACTION_TYPES = {
    ADD_CANDIDATE: 'ADD_CANDIDATE',
    UPDATE_CANDIDATE: 'UPDATE_CANDIDATE',
    SET_CURRENT_CANDIDATE: 'SET_CURRENT_CANDIDATE',
    CLEAR_CURRENT_CANDIDATE: 'CLEAR_CURRENT_CANDIDATE',
    SET_QUESTIONS: 'SET_QUESTIONS',
    SET_CURRENT_QUESTION: 'SET_CURRENT_QUESTION',
    ADD_ANSWER: 'ADD_ANSWER',
    SET_INTERVIEW_PROGRESS: 'SET_INTERVIEW_PROGRESS',
    PAUSE_INTERVIEW: 'PAUSE_INTERVIEW',
    RESUME_INTERVIEW: 'RESUME_INTERVIEW',
    RESET_INTERVIEW: 'RESET_INTERVIEW',
    COMPLETE_RESET: 'COMPLETE_RESET',
    DELETE_CANDIDATE: 'DELETE_CANDIDATE',
    DELETE_ALL_CANDIDATES: 'DELETE_ALL_CANDIDATES',
    SHOW_WELCOME_BACK: 'SHOW_WELCOME_BACK',
    HIDE_WELCOME_BACK: 'HIDE_WELCOME_BACK',
    UPDATE_LAST_ACTIVITY: 'UPDATE_LAST_ACTIVITY',
    SET_INTERVIEW_START_TIME: 'SET_INTERVIEW_START_TIME',
    SET_WELCOME_BACK_SHOWN: 'SET_WELCOME_BACK_SHOWN',
};

const appReducer = (state, action) => {
    let newState;

    switch (action.type) {
        case ACTION_TYPES.DELETE_CANDIDATE:
            newState = {
                ...state,
                candidates: state.candidates.filter(candidate => candidate.id !== action.payload)
            };
            break;

        case ACTION_TYPES.DELETE_ALL_CANDIDATES:
            newState = {
                ...state,
                candidates: []
            };
            break;

        case ACTION_TYPES.ADD_CANDIDATE:
            newState = {
                ...state,
                candidates: [...state.candidates, action.payload]
            };
            break;

        case ACTION_TYPES.UPDATE_CANDIDATE:
            newState = {
                ...state,
                candidates: state.candidates.map(c =>
                    c.id === action.payload.id ? action.payload : c
                )
            };
            break;

        case ACTION_TYPES.SET_CURRENT_CANDIDATE:
            newState = {
                ...state,
                currentCandidate: action.payload,
                // Reset welcome back tracking when setting new candidate
                interview: {
                    ...state.interview,
                    welcomeBackShown: false
                }
            };
            break;

        case ACTION_TYPES.CLEAR_CURRENT_CANDIDATE:
            newState = {
                ...state,
                currentCandidate: null
            };
            break;

        case ACTION_TYPES.SET_QUESTIONS:
            newState = {
                ...state,
                interview: {
                    ...state.interview,
                    questions: action.payload
                }
            };
            break;

        case ACTION_TYPES.SET_CURRENT_QUESTION:
            newState = {
                ...state,
                interview: {
                    ...state.interview,
                    currentQuestion: action.payload
                }
            };
            break;

        case ACTION_TYPES.ADD_ANSWER:
            newState = {
                ...state,
                interview: {
                    ...state.interview,
                    answers: [...state.interview.answers, action.payload]
                }
            };
            break;

        case ACTION_TYPES.SET_INTERVIEW_PROGRESS:
            newState = {
                ...state,
                interview: {
                    ...state.interview,
                    interviewProgress: action.payload,
                    // Reset welcome back shown when starting new progress
                    welcomeBackShown: action.payload === 'in-progress' ? false : state.interview.welcomeBackShown
                }
            };
            break;

        case ACTION_TYPES.PAUSE_INTERVIEW:
            newState = {
                ...state,
                interview: {
                    ...state.interview,
                    isPaused: true,
                    showWelcomeBack: true
                }
            };
            break;

        case ACTION_TYPES.RESUME_INTERVIEW:
            newState = {
                ...state,
                interview: {
                    ...state.interview,
                    isPaused: false,
                    showWelcomeBack: false, // Ensure this is set to false
                    interviewProgress: 'in-progress',
                    welcomeBackShown: true // Mark as shown after resume
                }
            };
            break;

        case ACTION_TYPES.RESET_INTERVIEW:
            newState = {
                ...state,
                interview: getInitialState().interview
            };
            break;

        case ACTION_TYPES.COMPLETE_RESET:
            newState = getInitialState();
            break;

        case ACTION_TYPES.SHOW_WELCOME_BACK:
            newState = {
                ...state,
                interview: {
                    ...state.interview,
                    showWelcomeBack: true,
                    isPaused: true,
                    welcomeBackShown: true // Mark as shown
                }
            };
            break;

        case ACTION_TYPES.HIDE_WELCOME_BACK:
            newState = {
                ...state,
                interview: {
                    ...state.interview,
                    showWelcomeBack: false,
                    isPaused: false,
                    welcomeBackShown: true // Mark as shown
                }
            };
            break;

        case ACTION_TYPES.UPDATE_LAST_ACTIVITY:
            newState = {
                ...state,
                interview: {
                    ...state.interview,
                    lastActivity: new Date().toISOString()
                }
            };
            break;

        case ACTION_TYPES.SET_INTERVIEW_START_TIME:
            newState = {
                ...state,
                interview: {
                    ...state.interview,
                    interviewStartTime: action.payload
                }
            };
            break;

        case ACTION_TYPES.SET_WELCOME_BACK_SHOWN:
            newState = {
                ...state,
                interview: {
                    ...state.interview,
                    welcomeBackShown: action.payload
                }
            };
            break;

        default:
            return state;
    }

    saveState(newState);
    return newState;
};

const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const [state, dispatch] = useReducer(appReducer, loadState());

    // Auto-detect interrupted interviews on app load - FIXED VERSION
    useEffect(() => {
        const checkForInterruptedInterview = () => {
            const {
                interviewProgress,
                questions,
                answers,
                showWelcomeBack,
                welcomeBackShown
            } = state.interview;
            const { currentCandidate } = state;

            // Conditions for showing welcome back modal:
            // 1. There's a current candidate
            // 2. Interview was in progress
            // 3. There are questions loaded
            // 4. Not all questions are answered
            // 5. Welcome back modal isn't already showing
            // 6. Welcome back hasn't been shown already for this session
            if (currentCandidate &&
                interviewProgress === 'in-progress' &&
                questions.length > 0 &&
                answers.length < questions.length &&
                !showWelcomeBack &&
                !welcomeBackShown) {

                console.log('Showing welcome back modal for interrupted interview');

                // Small delay to ensure everything is loaded
                setTimeout(() => {
                    dispatch({ type: ACTION_TYPES.SHOW_WELCOME_BACK });
                }, 1000);
            } else {
                console.log('Welcome back conditions not met:', {
                    hasCandidate: !!currentCandidate,
                    interviewProgress,
                    hasQuestions: questions.length > 0,
                    incomplete: answers.length < questions.length,
                    alreadyShowing: showWelcomeBack,
                    alreadyShown: welcomeBackShown
                });
            }
        };

        // Only check on initial app load, not on every state change
        checkForInterruptedInterview();
    }, []); // Empty dependency array - only run once on mount

    const actions = {
        addCandidate: (candidate) => dispatch({ type: ACTION_TYPES.ADD_CANDIDATE, payload: candidate }),
        updateCandidate: (candidate) => dispatch({ type: ACTION_TYPES.UPDATE_CANDIDATE, payload: candidate }),
        setCurrentCandidate: (candidate) => dispatch({ type: ACTION_TYPES.SET_CURRENT_CANDIDATE, payload: candidate }),
        clearCurrentCandidate: () => dispatch({ type: ACTION_TYPES.CLEAR_CURRENT_CANDIDATE }),
        setQuestions: (questions) => dispatch({ type: ACTION_TYPES.SET_QUESTIONS, payload: questions }),
        setCurrentQuestion: (question) => dispatch({ type: ACTION_TYPES.SET_CURRENT_QUESTION, payload: question }),
        addAnswer: (answer) => dispatch({ type: ACTION_TYPES.ADD_ANSWER, payload: answer }),
        setInterviewProgress: (progress) => dispatch({ type: ACTION_TYPES.SET_INTERVIEW_PROGRESS, payload: progress }),
        pauseInterview: () => dispatch({ type: ACTION_TYPES.PAUSE_INTERVIEW }),
        resumeInterview: () => dispatch({ type: ACTION_TYPES.RESUME_INTERVIEW }),
        resetInterview: () => dispatch({ type: ACTION_TYPES.RESET_INTERVIEW }),
        completeReset: () => dispatch({ type: ACTION_TYPES.COMPLETE_RESET }),
        deleteCandidate: (candidateId) => dispatch({ type: ACTION_TYPES.DELETE_CANDIDATE, payload: candidateId }),
        deleteAllCandidates: () => dispatch({ type: ACTION_TYPES.DELETE_ALL_CANDIDATES }),
        showWelcomeBack: () => dispatch({ type: ACTION_TYPES.SHOW_WELCOME_BACK }),
        hideWelcomeBack: () => dispatch({ type: ACTION_TYPES.HIDE_WELCOME_BACK }),
        updateLastActivity: () => dispatch({ type: ACTION_TYPES.UPDATE_LAST_ACTIVITY }),
        setInterviewStartTime: (timestamp) => dispatch({ type: ACTION_TYPES.SET_INTERVIEW_START_TIME, payload: timestamp }),
        setWelcomeBackShown: (shown) => dispatch({ type: ACTION_TYPES.SET_WELCOME_BACK_SHOWN, payload: shown }),

        // Helper action to check if welcome back should be shown
        checkAndShowWelcomeBack: () => {
            const { interviewProgress, questions, answers, welcomeBackShown } = state.interview;
            const { currentCandidate } = state;

            if (currentCandidate &&
                interviewProgress === 'in-progress' &&
                questions.length > 0 &&
                answers.length < questions.length &&
                !welcomeBackShown) {
                dispatch({ type: ACTION_TYPES.SHOW_WELCOME_BACK });
                return true;
            }
            return false;
        },

        // Helper to start a new interview session
        startNewInterview: (candidate, questions) => {
            dispatch({ type: ACTION_TYPES.SET_CURRENT_CANDIDATE, payload: candidate });
            dispatch({ type: ACTION_TYPES.SET_QUESTIONS, payload: questions });
            dispatch({ type: ACTION_TYPES.SET_CURRENT_QUESTION, payload: questions[0] });
            dispatch({ type: ACTION_TYPES.SET_INTERVIEW_PROGRESS, payload: 'in-progress' });
            dispatch({ type: ACTION_TYPES.SET_INTERVIEW_START_TIME, payload: new Date().toISOString() });
            dispatch({ type: ACTION_TYPES.HIDE_WELCOME_BACK });
            dispatch({ type: ACTION_TYPES.SET_WELCOME_BACK_SHOWN, payload: false });
        },

        // Helper to manually trigger welcome back (for testing)
        manuallyTriggerWelcomeBack: () => {
            dispatch({ type: ACTION_TYPES.SHOW_WELCOME_BACK });
        },

        // Helper to get interview progress info
        getInterviewProgress: () => {
            const { questions, answers, currentQuestion } = state.interview;
            const progress = answers.length;
            const totalQuestions = questions.length;
            const progressPercent = totalQuestions > 0 ? (progress / totalQuestions) * 100 : 0;
            const currentIndex = currentQuestion ? questions.findIndex(q => q.id === currentQuestion.id) : -1;

            return {
                progress,
                totalQuestions,
                progressPercent,
                currentIndex: currentIndex >= 0 ? currentIndex : progress,
                isCompleted: progress >= totalQuestions,
                timeSpent: state.interview.interviewStartTime ?
                    Math.round((new Date() - new Date(state.interview.interviewStartTime)) / 1000 / 60) : 0
            };
        }
    };

    return (
        <AppContext.Provider value={{ state, dispatch, actions }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
};

// Export utility functions for external use
export const interviewUtils = {
    // Check if an interview was interrupted
    wasInterviewInterrupted: (state) => {
        const { interviewProgress, questions, answers, welcomeBackShown } = state.interview;
        const { currentCandidate } = state;

        return currentCandidate &&
            interviewProgress === 'in-progress' &&
            questions.length > 0 &&
            answers.length < questions.length &&
            !welcomeBackShown;
    },

    // Calculate interview statistics
    getInterviewStats: (state) => {
        const { questions, answers, interviewStartTime } = state.interview;
        const progress = answers.length;
        const totalQuestions = questions.length;

        // Calculate average score
        const averageScore = answers.length > 0
            ? (answers.reduce((sum, ans) => sum + ans.score, 0) / answers.length).toFixed(1)
            : 0;

        // Calculate time spent
        const timeSpent = interviewStartTime ?
            Math.round((new Date() - new Date(interviewStartTime)) / 1000 / 60) : 0;

        return {
            progress,
            totalQuestions,
            averageScore: parseFloat(averageScore),
            timeSpent,
            completionPercentage: totalQuestions > 0 ? (progress / totalQuestions) * 100 : 0,
            isComplete: progress >= totalQuestions
        };
    },

    // Get current question context
    getCurrentQuestionContext: (state) => {
        const { currentQuestion, questions } = state.interview;
        if (!currentQuestion || questions.length === 0) return null;

        const currentIndex = questions.findIndex(q => q.id === currentQuestion.id);
        return {
            currentQuestion,
            currentIndex: currentIndex >= 0 ? currentIndex : 0,
            totalQuestions: questions.length,
            questionNumber: currentIndex >= 0 ? currentIndex + 1 : 1,
            isLastQuestion: currentIndex >= 0 ? currentIndex === questions.length - 1 : false
        };
    }
};