import React, { ReactNode, useContext, FC } from "react";
import { useNavigate } from "react-router-dom";
import { GlobalContext } from "./hook";

interface AuthWrapperProps {
  children: ReactNode;
  redirectTo?: string;
}

const AuthWrapper: FC<AuthWrapperProps> = ({
  children,
  redirectTo = "/login",
}) => {
  const { otpExpiry } = useContext(GlobalContext)!;
  const navigate = useNavigate();

  if (!otpExpiry || !otpExpiry.is_valid_auth) {
    navigate(redirectTo);
    return null;
  }

  return <>{children}</>;
};

export default AuthWrapper;
