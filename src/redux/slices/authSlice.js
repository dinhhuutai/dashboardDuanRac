import { createSlice } from "@reduxjs/toolkit";

export default createSlice({
    name: 'auth',
    initialState: {
        login: {
            currentUser: null,
            accessToken: null,
            isFetching: false,
            error: false,
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
        },
        loginFailed: (state) => {
            state.login.isFetching = false;
            state.login.error = true;
            state.login.currentUser = null;
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
        }
    }
})