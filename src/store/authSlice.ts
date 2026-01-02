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
  id?: number; // Added optional id
  email: string;
  firstName?: string;
  lastName?: string;
  company: Company | null;
  roles?: Role[];
  role?: string; // Fallback for single role
  avatarUrl?: string; // Added for avatar support
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  permissions: string[];
}

// Load initial state from localStorage if available
const loadState = (): AuthState => {
  try {
    const serializedState = localStorage.getItem('authState');
    if (serializedState === null) {
      return {
        user: null,
        isAuthenticated: false,
        permissions: []
      };
    }
    const state = JSON.parse(serializedState);
    // Ensure permissions exists if loading old state
    if (!state.permissions) {
      state.permissions = [];
    }
    return state;
  } catch (err) {
    return {
      user: null,
      isAuthenticated: false,
      permissions: []
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
    setPermissions(state, action: PayloadAction<string[]>) {
      state.permissions = action.payload;
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
      state.permissions = [];
      // Clear from localStorage
      localStorage.removeItem('authState');
    }
  }
});

export const { setUser, setPermissions, updateCompany, clearUser } = authSlice.actions;
export default authSlice.reducer;