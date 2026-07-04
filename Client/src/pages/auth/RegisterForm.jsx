import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { User, Mail, Phone, Lock, Eye, EyeOff, Dumbbell } from "lucide-react";

import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import RoleCard from "./RoleCard";
import { registerUser } from "../../api/auth.api";

function RegisterForm() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);

  const [role, setRole] = useState("USER");

  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required.";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required.";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required.";
    } else if (
      !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)
    ) {
      newErrors.email = "Enter a valid email address.";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required.";
    } else if (!/^[0-9]{10}$/.test(formData.phone)) {
      newErrors.phone = "Enter a valid 10-digit phone number.";
    }

    if (!formData.password) {
      newErrors.password = "Password is required.";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters.";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password.";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    if (!acceptedTerms) {
      newErrors.terms = "Please accept the Terms & Conditions.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const response = await registerUser({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role,
      });

      console.log(response);

      alert("Registration Successful!");

      navigate("/login");
    } catch (error) {
      alert(error.response?.data?.message || "Registration Failed");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="First Name"
          name="firstName"
          value={formData.firstName}
          onChange={handleChange}
          placeholder="John"
          icon={<User size={18} />}
          error={errors.firstName}
        />

        <Input
          label="Last Name"
          name="lastName"
          value={formData.lastName}
          onChange={handleChange}
          placeholder="Doe"
          icon={<User size={18} />}
          error={errors.lastName}
        />
      </div>

      <Input
        label="Email Address"
        name="email"
        value={formData.email}
        onChange={handleChange}
        placeholder="Enter your email"
        icon={<Mail size={18} />}
        error={errors.email}
      />

      <Input
        label="Phone Number"
        name="phone"
        value={formData.phone}
        onChange={handleChange}
        placeholder="9876543210"
        icon={<Phone size={18} />}
        error={errors.phone}
      />

      <Input
        label="Password"
        name="password"
        value={formData.password}
        onChange={handleChange}
        type={showPassword ? "text" : "password"}
        placeholder="Create password"
        icon={<Lock size={18} />}
        rightIcon={showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        onRightIconClick={() => setShowPassword(!showPassword)}
        error={errors.password}
      />

      <Input
        label="Confirm Password"
        name="confirmPassword"
        value={formData.confirmPassword}
        onChange={handleChange}
        type="password"
        placeholder="Confirm password"
        icon={<Lock size={18} />}
        error={errors.confirmPassword}
      />

      <div>
        <label className="mb-4 block text-sm text-zinc-400">Register As</label>

        <div className="grid grid-cols-2 gap-5">
          <RoleCard
            title="Member"
            description="Buy & sell memberships, book trainers and access the marketplace."
            icon={<User size={28} />}
            selected={role === "USER"}
            onClick={() => setRole("USER")}
          />

          <RoleCard
            title="Gym"
            description="Create membership plans, manage members and approve transfers."
            icon={<Dumbbell size={28} />}
            selected={role === "GYM_OWNER"}
            onClick={() => setRole("GYM_OWNER")}
          />
        </div>
      </div>

      <div>
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            className="accent-violet-600"
          />

          <p className="text-sm text-zinc-400">
            I agree to the Terms & Conditions
          </p>
        </div>

        {errors.terms && (
          <p className="mt-2 text-sm text-red-500">{errors.terms}</p>
        )}
      </div>

      <Button type="submit" size="lg" className="w-full">
        Create Account
      </Button>

      <p className="text-center text-zinc-400">
        Already have an account?
        <Link
          to="/login"
          className="ml-2 text-violet-400 hover:text-violet-300 transition-colors"
        >
          Login
        </Link>
      </p>
    </form>
  );
}

export default RegisterForm;
