// src/app/authSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { api } from '../services/api';

interface AuthState {
  isAuthenticated: boolean;
  user: {
    id: number;
    username?: string;
    full_name: string;
    role: string;
    permissions: Record<string, boolean>;
  } | null;
}

// Load token from localStorage
const token = localStorage.getItem('access_token');

const initialState: AuthState = {
  isAuthenticated: !!token, // if token exists, assume authenticated initially
  user: null, // we'll fetch user info later (or decode from token)
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<AuthState['user']>) => {
      state.isAuthenticated = true;
      state.user = action.payload;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      localStorage.removeItem('access_token');
    },
    // Optional: rehydrate from localStorage if needed
    rehydrate: (state) => {
      const token = localStorage.getItem('access_token');
      if (token) {
        state.isAuthenticated = true;
        // Optionally decode token to get user info (if you store it in the token)
        // Or fetch user info via API
      } else {
        state.isAuthenticated = false;
        state.user = null;
      }
    },
  },
  extraReducers: (builder) => {
    builder.addMatcher(api.endpoints.login.matchFulfilled, (state, action) => {
      state.isAuthenticated = true;
      state.user = action.payload.user;
    });
  },
});

export const { setUser, logout, rehydrate } = authSlice.actions;
export default authSlice.reducer;