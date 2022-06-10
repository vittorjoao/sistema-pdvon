import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeSwitcherProvider } from 'react-css-theme-switcher';
import { Provider } from 'react-supabase';
import { createClient } from '@supabase/supabase-js';
import { BrowserRouter } from 'react-router-dom';
import AuthProvider from './hooks/useAuth';
import Routes from './routes/routes';

const root = ReactDOM.createRoot(document.getElementById('root'));

const themes = {
  light: `${process.env.PUBLIC_URL}/light-theme.css`,
  dark: `${process.env.PUBLIC_URL}/dark-theme.css`,
};

const client = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_KEY,
);

root.render(
  <ThemeSwitcherProvider
    themeMap={themes}
    defaultTheme="light"
    insertionPoint="styles-insertion-point"
  >
    <Provider value={client}>
      <AuthProvider>
        <BrowserRouter>
          <Routes />
        </BrowserRouter>
      </AuthProvider>
    </Provider>
  </ThemeSwitcherProvider>,
);
