// src/redux/slices/userModulesSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import http from "~/api/http";

const TTL_MS = 5 * 60 * 1000;

export const fetchUserModules = createAsyncThunk(
  "userModules/fetch",
  async (userID) => {
    const key = `userModules:${userID}`;
    const cached = sessionStorage.getItem(key);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.fetchedAt < TTL_MS) {
        return { userID, modules: parsed.modules, fromCache: true };
      }
    }
    const r = await http.get(`/api/users/${userID}/modules-roles`);
    const modules = Array.isArray(r?.data?.data) ? r.data.data
                  : Array.isArray(r?.data)      ? r.data
                  : [];
    sessionStorage.setItem(key, JSON.stringify({ fetchedAt: Date.now(), modules }));
    return { userID, modules, fromCache: false };
  }
);

const userModulesSlice = createSlice({
  name: "userModules",
  initialState: {
    byUserId: {},      // <— quan trọng: có mặc định
    loading: false,
    error: null,
  },
  reducers: {
    clearUserModules(state) {
      state.byUserId = {};
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchUserModules.pending, (s) => { s.loading = true; s.error = null; });
    b.addCase(fetchUserModules.fulfilled, (s, a) => {
      const { userID, modules } = a.payload;
      s.byUserId[userID] = { modules, fetchedAt: Date.now() };
      s.loading = false;
    });
    b.addCase(fetchUserModules.rejected, (s, a) => {
      s.loading = false;
      s.error = a.error?.message || "Fetch modules failed";
    });
  },
});

export const { clearUserModules } = userModulesSlice.actions;
export default userModulesSlice.reducer;
