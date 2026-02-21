import "../src/assets/scss/style.scss";
import "antd/dist/antd.min.css";
import "react-big-calendar/lib/css/react-big-calendar.css";
import React from "react";
import { Route, Routes } from "react-router-dom";
import Login from "./components/PublicPages/Login";
import Register from "./components/PublicPages/Register";
import ProtectedPages from "./components/ProtectedPages";
import NoMatch from "./components/consts/NoMatch";
import { useSelector } from "react-redux";
import { Result } from "antd";
import Preview from "./components/pages/Playlists/Preview";
import ForgotPassword from "./components/PublicPages/ForgotPassword";
import ResetPassword from "./components/PublicPages/ResetPassword";
import OpenLink from "./components/pages/Branches/OpenLink";

function App() {
  const { isAuth, networkError } = useSelector((state) => state.loginSlice);
  return (
    <div className="App">
      {!networkError ? (
        <Routes>
          {isAuth ? (
            <Route path="/*" element={<ProtectedPages />} />
          ) : (
            <Route path="/">
              <Route path="/" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
            </Route>
          )}
          <Route
            path="/playlists/preview/:id/:display_type"
            element={<Preview />}
          />
          <Route path="/branches/open-link/:username" element={<OpenLink />} />
          <Route path="*" element={<NoMatch />} />
        </Routes>
      ) : (
        <Result status="error" title="500" subTitle={networkError} />
      )}
    </div>
  );
}

export default App;
