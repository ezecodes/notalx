import React, { ReactNode, useContext, FC, useEffect } from "react";
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
  const { otpExpiry, isOtpExpiryLoading } = useContext(GlobalContext)!;
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOtpExpiryLoading && (!otpExpiry || !otpExpiry.is_valid_auth)) {
      navigate(redirectTo);
    }
  }, [otpExpiry]);

  if (!otpExpiry || !otpExpiry.is_valid_auth) {
    return null;
  }

  return <>{children}</>;
};

export default AuthWrapper;
