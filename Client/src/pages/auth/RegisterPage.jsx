import AuthLayout from "../../layouts/AuthLayout";
import AuthHeader from "./AuthHeader";
import RegisterForm from "./RegisterForm";

function RegisterPage() {
  return (
    <AuthLayout>
      <div className="auth-editorial-card auth-register-card rounded-[28px] p-6 sm:p-8">
        <AuthHeader title="Make fitness work around you." subtitle="Create a FitSwap account to buy, sell, and manage memberships with clarity." />
        <div className="mt-7"><RegisterForm /></div>
      </div>
    </AuthLayout>
  );
}

export default RegisterPage;
