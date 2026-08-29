import { useState } from "react";
import { Link } from "react-router-dom";

import { User, Mail, Phone, Lock, Eye, EyeOff, Dumbbell, CheckCircle2 } from "lucide-react";

import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import RoleCard from "./RoleCard";
import { registerUser } from "../../api/auth.api";

function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [role, setRole] = useState("USER");

  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [errors, setErrors] = useState({});
  const [registeredEmail, setRegisteredEmail] = useState("");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    setErrors((current) => ({ ...current, [name]: "", form: "" }));
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

    if (submitting || !validateForm()) return;

    try {
      setSubmitting(true);
      await registerUser({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role,
      });

      setRegisteredEmail(formData.email.trim());
    } catch (error) {
      const message = error.response?.data?.message || "Registration failed. Please try again.";
      setErrors((current) => ({ ...current, form: message }));
    } finally {
      setSubmitting(false);
    }
  };

  if (registeredEmail) {
    return (
      <section className="py-5 text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-300">
          <CheckCircle2 size={32} />
        </span>
        <h2 className="mt-5 text-2xl font-bold text-white">Account created</h2>
        <p className="mt-3 text-sm leading-6 text-zinc-400">
          Your account for <span className="font-medium text-zinc-200">{registeredEmail}</span> is ready.
          We&apos;ve queued a verification email; check your inbox and spam folder.
        </p>
        <p className="mt-3 text-xs leading-5 text-zinc-500">
          You are not signed in yet. If the email does not arrive, you can resend it after signing in from Settings.
        </p>
        <Link
          to="/login"
          className="mt-7 inline-flex w-full items-center justify-center rounded-xl bg-violet-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-violet-500"
        >
          Go to login
        </Link>
        <button
          type="button"
          onClick={() => setRegisteredEmail("")}
          className="mt-4 text-sm font-medium text-zinc-400 transition hover:text-violet-300"
        >
          Create another account
        </button>
      </section>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="auth-form space-y-4">
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
        <label className="mb-3 block text-sm font-medium text-zinc-300">I want to join as</label>

        <div className="grid grid-cols-2 gap-3">
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
            onChange={(e) => {
              setAcceptedTerms(e.target.checked);
              setErrors((current) => ({ ...current, terms: "", form: "" }));
            }}
            className="auth-terms-checkbox"
          />

          <p className="text-sm text-zinc-400">
            I agree to the Terms & Conditions
          </p>
        </div>

        {errors.terms && (
          <p className="mt-2 text-sm text-red-500">{errors.terms}</p>
        )}
      </div>

      {errors.form && (
        <p role="alert" className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-200">
          {errors.form}
        </p>
      )}

      <Button type="submit" size="lg" disabled={submitting} className="auth-submit-button w-full">
        {submitting ? "Creating account…" : "Create Account"}
      </Button>

      <p className="text-center text-sm text-zinc-500">
        Already have an account?
        <Link
          to="/login"
          className="auth-text-link ml-2 transition-colors"
        >
          Login
        </Link>
      </p>
    </form>
  );
}

export default RegisterForm;
