"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./signup.module.css";

type FormData = {
  name: string;
  email: string;
  password: string;
  dob: string;
  ssnOrItin: string;
  address: string;
  phone: string;
};

export default function SignUpPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>({
    name: "",
    email: "",
    password: "",
    dob: "",
    ssnOrItin: "",
    address: "",
    phone: "",
  });
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const calculateAge = (dob: string) => {
    if (!dob) return 0;
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const age = calculateAge(form.dob);
    if (age < 18) {
      setErrorMsg("You must be at least 18 years old to sign up.");
      return;
    }
    if (!/^\d{3}-?\d{2}-?\d{4}$/.test(form.ssnOrItin)) {
      setErrorMsg("Please enter a valid SSN or ITIN (e.g. 123-45-6789).");
      return;
    }
    if (form.address.trim().length < 5) {
      setErrorMsg("Please enter a valid U.S. address.");
      return;
    }
    if (!/^\+?\d{10,15}$/.test(form.phone)) {
      setErrorMsg(
        "Please enter a valid mobile phone number (numbers only, 10–15 digits)."
      );
      return;
    }
    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setErrorMsg(data.message || "Something went wrong. Please try again.");
      return;
    }

    router.push("/auth/signin?registered=1");
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.title}>Create Your Account</h1>

        <div className={styles.requirements}>
          <p>Before you begin, ensure you:</p>
          <ul>
            <li>Are at least 18 years old</li>
            <li>Have a valid SSN or ITIN (e.g. 123-45-6789)</li>
            <li>Have a permanent U.S. residential address</li>
            <li>Can enroll in Horizon Online Banking</li>
            <li>Have a working mobile phone number</li>
          </ul>
        </div>

        {errorMsg && <p className={styles.error}>{errorMsg}</p>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formField}>
            <label>Full Name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="John Doe"
            />
          </div>

          <div className={styles.formField}>
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder="you@example.com"
            />
          </div>

          <div className={styles.formField}>
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              placeholder="Create a password"
            />
          </div>

          <div className={styles.formField}>
            <label>Date of Birth</label>
            <input
              type="date"
              name="dob"
              value={form.dob}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formField}>
            <label>SSN or ITIN</label>
            <input
              type="text"
              name="ssnOrItin"
              value={form.ssnOrItin}
              onChange={handleChange}
              required
              placeholder="123-45-6789"
            />
          </div>

          <div className={styles.formField}>
            <label>Permanent U.S. Address</label>
            <textarea
              name="address"
              value={form.address}
              onChange={handleChange}
              required
              placeholder="123 Main St, Apt 4B, Springfield, IL 62704"
              rows={3}
            />
          </div>

          <div className={styles.formField}>
            <label>Mobile Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              required
              placeholder="+12345678900"
            />
          </div>

          <button type="submit" disabled={loading} className={styles.submitBtn}>
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <p className={styles.signInText}>
          Already have an account?{" "}
          <a href="/auth/signin" className={styles.signInLink}>
            Sign In
          </a>
        </p>
      </div>
    </div>
  );
}
