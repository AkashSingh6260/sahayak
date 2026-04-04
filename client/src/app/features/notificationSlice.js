import { createSlice } from "@reduxjs/toolkit";

const notificationSlice = createSlice({
  name: "notifications",
  initialState: [],
  reducers: {
    setNotifications: (_, action) => action.payload,
    removeNotification: (state, action) =>
      state.filter(n => n._id !== action.payload),
  },
});

export const { setNotifications, removeNotification } = notificationSlice.actions;
export default notificationSlice.reducer;
