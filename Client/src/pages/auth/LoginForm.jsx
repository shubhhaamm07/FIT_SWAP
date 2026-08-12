import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { loginUser } from "../../api/auth.api";

function LoginForm() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required.";
    }

    if (!formData.password.trim()) {
      newErrors.password = "Password is required.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (submitting || !validateForm()) return;

    try {
      setSubmitting(true);
      const response = await loginUser(formData);

      // console.log(response);

      login(response.user, response.token);

      alert("Login Successful!");

      navigate(response.user.role === "ADMIN" ? "/admin/dashboard" : response.user.role === "GYM_OWNER" ? "/owner/dashboard" : "/dashboard");
    } catch (error) {
      alert(error.response?.data?.message || "Invalid email or password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form space-y-5">
      <Input
        label="Email Address"
        name="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        placeholder="Enter your email"
        icon={<Mail size={18} />}
        error={errors.email}
      />

      <Input
        label="Password"
        name="password"
        type={showPassword ? "text" : "password"}
        value={formData.password}
        onChange={handleChange}
        placeholder="Enter your password"
        icon={<Lock size={18} />}
        rightIcon={showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        onRightIconClick={() => setShowPassword(!showPassword)}
        error={errors.password}
      />

      <div className="flex justify-end">
        <Link
          to="/forgot-password"
          className="auth-text-link text-sm transition-colors"
        >
          Forgot Password?
        </Link>
      </div>

      <Button type="submit" size="lg" disabled={submitting} className="auth-submit-button w-full">
        {submitting ? "Signing you in…" : "Login to FitSwap"}
      </Button>

      <p className="text-center text-sm text-zinc-500">
        Don't have an account?
        <Link
          to="/register"
          className="auth-text-link ml-2 transition-colors"
        >
          Register
        </Link>
      </p>
    </form>
  );
}

export default LoginForm;
