import { ReactNode, useContext, FC, useEffect } from "react";
import { GlobalContext } from "../_hooks/hook";
import { useRouter } from "next/router";

interface AuthWrapperProps {
  children: ReactNode;
  redirectTo?: string;
}

const AuthWrapper: FC<AuthWrapperProps> = ({
  children,
  redirectTo = "/login",
}) => {
  const { otpExpiry, isOtpExpiryLoading } = useContext(GlobalContext)!;
  const router = useRouter();

  useEffect(() => {
    if (!isOtpExpiryLoading && (!otpExpiry || !otpExpiry.is_valid_auth)) {
      router.push(redirectTo);
    }
  }, [otpExpiry]);

  if (!otpExpiry || !otpExpiry.is_valid_auth) {
    return null;
  }

  return <>{children}</>;
};

export default AuthWrapper;
