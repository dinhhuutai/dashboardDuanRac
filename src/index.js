import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import store, { persistor } from './redux/store';
import { injectStore } from '~/api/http';

import AuthInitializer from "~/components/AuthInitializer";
import PersistLoading from "~/components/PersistLoading";

// Gắn store cho axios instance (đọc token, dispatch logout/refresh) — xem api/http.js
injectStore(store);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <Provider store={store}>
            <PersistGate loading={<PersistLoading />} persistor={persistor}>
                <AuthInitializer>
                    <App />
                </AuthInitializer>
            </PersistGate>
        </Provider>
    </React.StrictMode>,
);