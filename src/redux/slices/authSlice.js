import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import http from "~/api/http";
import { BASE_URL } from "~/config";

// Lấy lại quyền của user hiện tại (sau khi admin đổi quyền)
export const reloadPermissions = createAsyncThunk(
  "auth/reloadPermissions",
  async (_, { getState, rejectWithValue }) => {
    try {
      const res = await http.get(`${BASE_URL}/api/me/permissions`);
      if (res.data?.success) return res.data.data; // { modules, featuresByModule }
      return rejectWithValue(res.data?.message || "Cannot load permissions");
    } catch (e) {
      return rejectWithValue(e?.response?.data?.message || e.message);
    }
  }
);

// Lấy role trong module Quản lý công việc
export const fetchTaskManagerRole = createAsyncThunk(
  "auth/fetchTaskManagerRole",
  async (_, { rejectWithValue }) => {
    try {
      const res = await http.get(
        `${BASE_URL}/api/task-management/me/role`
      );
      if (res.data?.success) {
        // data: null hoặc { roleId, code, name, userRoleId }
        return res.data.data;
      }
      return rejectWithValue(
        res.data?.message || "Cannot load task manager role"
      );
    } catch (e) {
      return rejectWithValue(e?.response?.data?.message || e.message);
    }
  }
);


export default createSlice({
    name: 'auth',
    initialState: {
        login: {
            currentUser: null,
            accessToken: null,
            isFetching: false,
            error: false,

            // ⬇️ Quyền sẽ ở đây
            permissions: {
                // mảng module có role
                modules: [], // [{moduleId, name, role}]
                // map moduleId -> array features
                featuresByModule: {} // { [moduleId]: [{featureId, code, name, defaultAllowed, overridden, effectiveAllowed}] }
            },

            roleTaskManager: null,
        }
    },
    reducers: {
        loginStart: (state) => {
            state.login.isFetching = true; 
        },
        loginSuccess: (state, action) => {
            state.login.isFetching = false;
            state.login.currentUser = action.payload.user;
            state.login.accessToken = action.payload.accessToken;
            state.login.error = false;
            // ⬇️ nếu API login trả luôn permissions, set vào luôn
            if (action.payload.permissions) {
                state.login.permissions = action.payload.permissions;
            }

            // nếu login API sau này trả luôn roleTaskManager thì set vào
            if (action.payload.roleTaskManager) {
                state.login.roleTaskManager = action.payload.roleTaskManager;
            } else {
                state.login.roleTaskManager = null;
            }
        },
        changePasswordFirstLogin: (state) => {
          state.login.currentUser.hasChangedPassword = true;
        },
        firstLoginGift: (state) => {
          state.login.currentUser.firstLoginGiftClaimed = true;
        },
        loginFailed: (state) => {
            state.login.isFetching = false;
            state.login.error = true;
            state.login.currentUser = null;
            state.login.permissions = { modules: [], featuresByModule: {} };
        },
        checkUser: (state, action) => {
            state.login.currentUser = action.payload;
        },
        checkUserError: (state) => {
            state.login.accessToken = null;
            state.login.currentUser = null;
        },
        refreshToken: (state, action) => {
            state.login.accessToken = action.payload;
        },
        logoutStart: (state) => {
            state.login.isFetching = true; 
        },
        logoutSuccess: (state) => {
            state.login.isFetching = false;
            state.login.currentUser = null;
            state.login.accessToken = null;
            state.login.error = false;
            state.login.permissions = { modules: [], featuresByModule: {} };
        }
    },
    extraReducers: (builder) => {
        builder
        .addCase(reloadPermissions.fulfilled, (state, action) => {
            state.login.permissions = action.payload || { modules: [], featuresByModule: {} };
        })
        .addCase(fetchTaskManagerRole.fulfilled, (state, action) => {
            // action.payload: null hoặc { roleId, code, name, userRoleId }
            state.login.roleTaskManager = action.payload;
        })
        .addCase(fetchTaskManagerRole.rejected, (state) => {
            // lỗi thì coi như không có role
            state.login.roleTaskManager = null;
        });
    }
})