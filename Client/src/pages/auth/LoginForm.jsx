import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { loginUser } from "../../api/auth.api";

function LoginForm() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

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

    if (!validateForm()) return;

    try {
      const response = await loginUser(formData);

      // console.log(response);

      login(response.user, response.token);

      alert("Login Successful!");

      navigate("/dashboard");
    } catch (error) {
      alert(error.response?.data?.message || "Invalid email or password.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
          className="
            text-sm
            text-violet-400
            hover:text-violet-300
            transition-colors
          "
        >
          Forgot Password?
        </Link>
      </div>

      <Button type="submit" size="lg" className="w-full">
        Login to FitSwap
      </Button>

      <p className="text-center text-zinc-400">
        Don't have an account?
        <Link
          to="/register"
          className="
            ml-2
            text-violet-400
            hover:text-violet-300
            transition-colors
          "
        >
          Register
        </Link>
      </p>
    </form>
  );
}

export default LoginForm;
