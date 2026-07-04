import AuthLayout from "../../layouts/AuthLayout";
import AuthHeader from "./AuthHeader";
import RegisterForm from "./RegisterForm";

function RegisterPage() {
  return (
    <AuthLayout>
      <div
        className="
          w-full
          max-w-[460px]

          rounded-[32px]

          bg-black/35
          backdrop-blur-2xl

          border
          border-white/10

          p-8

          shadow-[0_20px_60px_rgba(0,0,0,0.45)]
        "
      >
        <AuthHeader
          title="Create Account"
          subtitle="Join India's Gym Membership Marketplace"
        />

        <div className="mt-8">
          <RegisterForm />
        </div>
      </div>
    </AuthLayout>
  );
}

export default RegisterPage;
