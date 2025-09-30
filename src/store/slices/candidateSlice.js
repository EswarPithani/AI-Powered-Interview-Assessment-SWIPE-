import { createSlice } from '@reduxjs/toolkit';

const loadState = () => {
  try {
    const serializedState = localStorage.getItem('candidatesState');
    if (serializedState === null) {
      return {
        candidates: [],
        currentCandidate: null,
      };
    }
    return JSON.parse(serializedState);
  } catch (err) {
    return {
      candidates: [],
      currentCandidate: null,
    };
  }
};

const saveState = (state) => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem('candidatesState', serializedState);
  } catch (err) {
    console.error('Error saving state:', err);
  }
};

const initialState = loadState();

const candidateSlice = createSlice({
  name: 'candidates',
  initialState,
  reducers: {
    addCandidate: (state, action) => {
      state.candidates.push(action.payload);
      saveState(state);
    },
    updateCandidate: (state, action) => {
      const index = state.candidates.findIndex(c => c.id === action.payload.id);
      if (index !== -1) {
        state.candidates[index] = action.payload;
        saveState(state);
      }
    },
    setCurrentCandidate: (state, action) => {
      state.currentCandidate = action.payload;
      saveState(state);
    },
    clearCurrentCandidate: (state) => {
      state.currentCandidate = null;
      saveState(state);
    },
  },
});

export const { addCandidate, updateCandidate, setCurrentCandidate, clearCurrentCandidate } = candidateSlice.actions;
export default candidateSlice.reducer;