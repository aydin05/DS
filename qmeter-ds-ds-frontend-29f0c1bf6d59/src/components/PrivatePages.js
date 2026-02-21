import React from "react";
import { useSelector } from "react-redux";
import ProtectedPages from "./ProtectedPages";
import { Navigate } from "react-router-dom";

const PrivatePages = (props) => {
  const { isAuth } = useSelector((state) => state.loginSlice);
  return isAuth ? <ProtectedPages /> : <Navigate to={"/login"} />;
};

export default PrivatePages;
