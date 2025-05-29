import { createSlice } from '@reduxjs/toolkit';

export default createSlice({
  name: 'weight',
  initialState: {
    weight: 0,
  },
  reducers: {
    setWeight: (state, action) => {
      state.weight = action.payload;
    },
  },
});
