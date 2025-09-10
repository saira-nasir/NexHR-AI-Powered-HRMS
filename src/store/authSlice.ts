import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface Company {
  id: string;
  name: string;
  industry: string;
  email: string;
  phone: string;
}

interface Role {
  id: string;
  name: string;
  description?: string;
}

interface User {
  email: string;
  firstName?: string;
  lastName?: string;
  company: Company | null;
  roles?: Role[];
  role?: string; // Fallback for single role
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

// Load initial state from localStorage if available
const loadState = (): AuthState => {
  try {
    const serializedState = localStorage.getItem('authState');
    if (serializedState === null) {
      return {
        user: null,
        isAuthenticated: false
      };
    }
    return JSON.parse(serializedState);
  } catch (err) {
    return {
      user: null,
      isAuthenticated: false
    };
  }
};

const initialState: AuthState = loadState();

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<User>) {
      state.user = action.payload;
      state.isAuthenticated = true;
      // Save to localStorage
      localStorage.setItem('authState', JSON.stringify(state));
    },
    updateCompany(state, action: PayloadAction<Company>) {
      if (state.user) {
        state.user.company = action.payload;
        // Save to localStorage
        localStorage.setItem('authState', JSON.stringify(state));
      }
    },
    clearUser(state) {
      state.user = null;
      state.isAuthenticated = false;
      // Clear from localStorage
      localStorage.removeItem('authState');
    }
  }
});

export const { setUser, updateCompany, clearUser } = authSlice.actions;
export default authSlice.reducer;
