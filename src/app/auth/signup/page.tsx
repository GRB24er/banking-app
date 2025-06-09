'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type FormData = {
  name: string;
  email: string;
  password: string;
  dob: string;            // YYYY-MM-DD
  ssnOrItin: string;
  address: string;
  phone: string;
};

export default function SignUpPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    dob: '',
    ssnOrItin: '',
    address: '',
    phone: '',
  });
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Helper: calculate age from DOB
  const calculateAge = (dob: string) => {
    if (!dob) return 0;
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // 1) Basic validation
    const age = calculateAge(form.dob);
    if (age < 18) {
      setErrorMsg('You must be at least 18 years old to sign up.');
      return;
    }
    if (!/^\d{3}-?\d{2}-?\d{4}$/.test(form.ssnOrItin)) {
      setErrorMsg('Please enter a valid SSN or ITIN (e.g. 123-45-6789).');
      return;
    }
    if (form.address.trim().length < 5) {
      setErrorMsg('Please enter a valid U.S. address.');
      return;
    }
    if (!/^\+?\d{10,15}$/.test(form.phone)) {
      setErrorMsg('Please enter a valid mobile phone number (numbers only, 10–15 digits).');
      return;
    }
    setLoading(true);

    // 2) Send to backend
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setErrorMsg(data.message || 'Something went wrong. Please try again.');
      return;
    }

    // 3) On success, redirect to Sign In
    router.push('/auth/signin?registered=1');
  };

  return (
    <div
      style={{
        maxWidth: '500px',
        margin: '3rem auto',
        padding: '2rem',
        border: '1px solid #ddd',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        backgroundColor: '#fff',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <h1 style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '1.75rem' }}>
        Create Your Account
      </h1>

      {/* Requirements */}
      <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
        <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>Before you begin, please ensure you:</p>
        <ul style={{ margin: 0, paddingLeft: '1.25rem', lineHeight: 1.5 }}>
          <li>Are at least 18 years old (varies only for some states)</li>
          <li>Have a valid SSN or ITIN (e.g. 123-45-6789)</li>
          <li>Have a permanent U.S. residential address</li>
          <li>Can enroll in Horizon online Banking</li>
          <li>Have a working mobile phone number</li>
        </ul>
      </div>

      {errorMsg && (
        <p style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>{errorMsg}</p>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Name */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label style={{ marginBottom: '0.25rem', fontWeight: 'bold' }}>Full Name</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            placeholder="John Doe"
            style={{
              padding: '0.75rem',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '1rem',
            }}
          />
        </div>

        {/* Email */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label style={{ marginBottom: '0.25rem', fontWeight: 'bold' }}>Email Address</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            placeholder="you@example.com"
            style={{
              padding: '0.75rem',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '1rem',
            }}
          />
        </div>

        {/* Password */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label style={{ marginBottom: '0.25rem', fontWeight: 'bold' }}>Password</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            placeholder="Create a password"
            style={{
              padding: '0.75rem',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '1rem',
            }}
          />
        </div>

        {/* Date of Birth */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label style={{ marginBottom: '0.25rem', fontWeight: 'bold' }}>Date of Birth</label>
          <input
            type="date"
            name="dob"
            value={form.dob}
            onChange={handleChange}
            required
            style={{
              padding: '0.75rem',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '1rem',
            }}
          />
        </div>

        {/* SSN or ITIN */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label style={{ marginBottom: '0.25rem', fontWeight: 'bold' }}>SSN or ITIN</label>
          <input
            type="text"
            name="ssnOrItin"
            value={form.ssnOrItin}
            onChange={handleChange}
            required
            placeholder="123-45-6789"
            style={{
              padding: '0.75rem',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '1rem',
            }}
          />
        </div>

        {/* Address */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label style={{ marginBottom: '0.25rem', fontWeight: 'bold' }}>Permanent U.S. Address</label>
          <textarea
            name="address"
            value={form.address}
            onChange={handleChange}
            required
            placeholder="123 Main St, Apt 4B, Springfield, IL 62704"
            rows={3}
            style={{
              padding: '0.75rem',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '1rem',
              resize: 'vertical',
            }}
          />
        </div>

        {/* Phone */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label style={{ marginBottom: '0.25rem', fontWeight: 'bold' }}>Mobile Phone Number</label>
          <input
            type="tel"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            required
            placeholder="+12345678900"
            style={{
              padding: '0.75rem',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '1rem',
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: '1rem',
            padding: '0.75rem',
            backgroundColor: '#004085',
            color: 'white',
            fontSize: '1rem',
            fontWeight: 'bold',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Creating account…' : 'Create Account'}
        </button>
      </form>

      <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
        Already have an account?{' '}
        <a href="/auth/signin" style={{ color: '#004085', textDecoration: 'underline' }}>
          Sign In
        </a>
      </p>
    </div>
  );
}
