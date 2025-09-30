import { configureStore } from '@reduxjs/toolkit';
import candidateReducer from './slices/candidateSlice';
import interviewReducer from './slices/interviewSlice';

export const store = configureStore({
    reducer: {
        candidates: candidateReducer,
        interview: interviewReducer,
    },
});

export default store;