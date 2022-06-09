import React from "react";
import ReactDOM from "react-dom/client";
import { ThemeSwitcherProvider } from "react-css-theme-switcher";
import Login from "./app";

const root = ReactDOM.createRoot(document.getElementById("root"));
const themes = {
  light: `${process.env.PUBLIC_URL}/light-theme.css`,
  dark: `${process.env.PUBLIC_URL}/dark-theme.css`,
};

root.render(
  <ThemeSwitcherProvider
    themeMap={themes}
    defaultTheme="light"
    insertionPoint="styles-insertion-point"
  >
    <Login />
  </ThemeSwitcherProvider>
);
