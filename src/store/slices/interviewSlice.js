import { createSlice } from '@reduxjs/toolkit';

const loadState = () => {
    try {
        const serializedState = localStorage.getItem('interviewState');
        if (serializedState === null) {
            return {
                currentQuestion: null,
                questions: [],
                answers: [],
                timer: null,
                isPaused: false,
                showWelcomeBack: false,
                interviewProgress: 'not-started', // 'not-started', 'resume-upload', 'missing-fields', 'in-progress', 'completed'
            };
        }
        return JSON.parse(serializedState);
    } catch (err) {
        return {
            currentQuestion: null,
            questions: [],
            answers: [],
            timer: null,
            isPaused: false,
            showWelcomeBack: false,
            interviewProgress: 'not-started',
        };
    }
};

const saveState = (state) => {
    try {
        const serializedState = JSON.stringify(state);
        localStorage.setItem('interviewState', serializedState);
    } catch (err) {
        console.error('Error saving state:', err);
    }
};

const initialState = loadState();

const interviewSlice = createSlice({
    name: 'interview',
    initialState,
    reducers: {
        setQuestions: (state, action) => {
            state.questions = action.payload;
            saveState(state);
        },
        setCurrentQuestion: (state, action) => {
            state.currentQuestion = action.payload;
            saveState(state);
        },
        addAnswer: (state, action) => {
            state.answers.push(action.payload);
            saveState(state);
        },
        setTimer: (state, action) => {
            state.timer = action.payload;
            saveState(state);
        },
        pauseInterview: (state) => {
            state.isPaused = true;
            state.showWelcomeBack = true;
            saveState(state);
        },
        resumeInterview: (state) => {
            state.isPaused = false;
            state.showWelcomeBack = false;
            saveState(state);
        },
        setInterviewProgress: (state, action) => {
            state.interviewProgress = action.payload;
            saveState(state);
        },
        resetInterview: (state) => {
            const newState = {
                currentQuestion: null,
                questions: [],
                answers: [],
                timer: null,
                isPaused: false,
                showWelcomeBack: false,
                interviewProgress: 'not-started',
            };
            Object.keys(newState).forEach(key => {
                state[key] = newState[key];
            });
            saveState(state);
        },
    },
});

export const {
    setQuestions,
    setCurrentQuestion,
    addAnswer,
    setTimer,
    pauseInterview,
    resumeInterview,
    setInterviewProgress,
    resetInterview,
} = interviewSlice.actions;
export default interviewSlice.reducer;