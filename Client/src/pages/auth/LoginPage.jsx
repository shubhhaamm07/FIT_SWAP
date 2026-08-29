import AuthLayout from "../../layouts/AuthLayout";
import AuthHeader from "./AuthHeader";
import LoginForm from "./LoginForm";

function LoginPage() {
  return (
    <AuthLayout>
      <div className="auth-editorial-card rounded-[28px] p-6 sm:p-8">
        <AuthHeader />
        <div className="mt-8"><LoginForm /></div>
      </div>
    </AuthLayout>
  );
}

export default LoginPage;
