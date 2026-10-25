import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  appointments: [],
  loading: false,
  error: null
};

const appointmentSlice = createSlice({
  name: 'appointments',
  initialState,
  reducers: {
    setAppointments: (state, action) => {
      state.appointments = action.payload;
    },
    addAppointment: (state, action) => {
      state.appointments.push(action.payload);
    },
    updateAppointment: (state, action) => {
      const index = state.appointments.findIndex(a => a.id === action.payload.id);
      if (index !== -1) {
        state.appointments[index] = action.payload;
      }
    },
    removeAppointment: (state, action) => {
      state.appointments = state.appointments.filter(a => a.id !== action.payload);
    }
  }
});

export const { setAppointments, addAppointment, updateAppointment, removeAppointment } = appointmentSlice.actions;
export default appointmentSlice.reducer;