import type { ReactNode } from "react";
import { Card, CardContent, Typography } from "@mui/material";
import { AuthLayout } from "../components/AuthLayout";
import RegisterForm from "../components/RegisterForm";
import { useRegistrationEnabled } from "../_helpers/useRegistrationEnabled";

const RegistrationOff = () => (
  <Card>
    <CardContent sx={{ p: 3 }}>
      <Typography>
        Registration is turned off. Ask an administrator for an account.
      </Typography>
    </CardContent>
  </Card>
);

const RegisterPage = () => {
  const registrationEnabled = useRegistrationEnabled();

  let content: ReactNode = null;
  if (registrationEnabled === true) {
    content = <RegisterForm />;
  } else if (registrationEnabled === false) {
    content = <RegistrationOff />;
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start tracking visual changes in a couple of minutes."
    >
      {content}
    </AuthLayout>
  );
};

export default RegisterPage;
