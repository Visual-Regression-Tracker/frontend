import React from "react";
import { AuthLayout } from "../components/AuthLayout";
import RegisterForm from "../components/RegisterForm";

const RegisterPage = () => (
  <AuthLayout
    title="Create your account"
    subtitle="Start tracking visual changes in a couple of minutes."
  >
    <RegisterForm />
  </AuthLayout>
);

export default RegisterPage;
