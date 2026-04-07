import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import store, { persistor } from './redux/store';

import AuthInitializer from "~/components/AuthInitializer";
import PersistLoading from "~/components/PersistLoading";

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