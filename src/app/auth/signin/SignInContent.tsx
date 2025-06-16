'use client';

import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';

export default function SignInContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams?.get('registered') ?? '';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string>(
    registered ? 'Account created! Please sign in below.' : ''
  );
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [status, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const res = await signIn('credentials', {
      redirect: false,
      email,
      password,
    });

    setLoading(false);
    if (res?.error) {
      setErrorMsg('Invalid email or password.');
      return;
    }

    if (res?.ok) {
      router.refresh();
      router.push('/dashboard');
    }
  };

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#F9FAFB',
    fontFamily: 'Arial, sans-serif',
  };

  const leftColumnStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: '0 24px',
    backgroundColor: '#FFFFFF',
  };

  const rightColumnStyle: React.CSSProperties = {
    flex: 1,
    position: 'relative',
    backgroundColor: '#EFF6FF',
  };

  const formWrapperStyle: React.CSSProperties = {
    maxWidth: '400px',
    margin: '0 auto',
  };

  const logoContainerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '32px',
  };

  const logoTextStyle: React.CSSProperties = {
    marginLeft: '8px',
    fontSize: '24px',
    fontWeight: 600,
    color: '#0F172A',
  };

  const headingStyle: React.CSSProperties = {
    fontSize: '32px',
    fontWeight: 700,
    color: '#0F172A',
    margin: 0,
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: '16px',
    color: '#4B5563',
    marginTop: '8px',
    marginBottom: '24px',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '14px',
    fontWeight: 500,
    color: '#374151',
    marginBottom: '6px',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    fontSize: '14px',
    color: '#111827',
    border: '1px solid #D1D5DB',
    borderRadius: '8px',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const inputFocusStyle: React.CSSProperties = {
    borderColor: '#3B82F6',
    boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.3)',
  };

  const buttonStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 0',
    fontSize: '16px',
    fontWeight: 600,
    color: '#FFFFFF',
    background: 'linear-gradient(to right, #3B82F6, #2563EB)',
    border: 'none',
    borderRadius: '8px',
    cursor: loading ? 'not-allowed' : 'pointer',
    transition: 'background 0.2s ease',
  };

  const buttonHoverStyle: React.CSSProperties = {
    background: 'linear-gradient(to right, #2563EB, #1E40AF)',
  };

  const errorTextStyle: React.CSSProperties = {
    color: '#DC2626',
    fontSize: '14px',
    marginBottom: '16px',
    textAlign: 'center',
  };

  const footerTextStyle: React.CSSProperties = {
    marginTop: '24px',
    fontSize: '14px',
    color: '#4B5563',
    textAlign: 'center',
  };

  const footerLinkStyle: React.CSSProperties = {
    color: '#2563EB',
    textDecoration: 'none',
    fontWeight: 500,
  };

  const imageContainerStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const imageBoxStyle: React.CSSProperties = {
    width: '90%',
    maxWidth: '800px',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
  };

  return (
    <div style={containerStyle}>
      <div style={leftColumnStyle}>
        <div style={formWrapperStyle}>
          <div style={logoContainerStyle}>
            <Image
              src="/icons/logo.svg"
              alt="Horizon Logo"
              width={40}
              height={40}
            />
            <span style={logoTextStyle}>Horizon</span>
          </div>

          <h1 style={headingStyle}>Sign In</h1>
          <p style={subtitleStyle}>Please enter your details</p>

          {errorMsg && <div style={errorTextStyle}>{errorMsg}</div>}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="email" style={labelStyle}>
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                style={inputStyle}
                onFocus={(e) =>
                  Object.assign(e.currentTarget.style, inputFocusStyle)
                }
                onBlur={(e) =>
                  Object.assign(e.currentTarget.style, inputStyle)
                }
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label htmlFor="password" style={labelStyle}>
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                style={inputStyle}
                onFocus={(e) =>
                  Object.assign(e.currentTarget.style, inputFocusStyle)
                }
                onBlur={(e) =>
                  Object.assign(e.currentTarget.style, inputStyle)
                }
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                ...buttonStyle,
                ...(loading ? { opacity: 0.5 } : {}),
              }}
              onMouseEnter={(e) =>
                Object.assign(e.currentTarget.style, buttonHoverStyle)
              }
              onMouseLeave={(e) =>
                Object.assign(e.currentTarget.style, buttonStyle)
              }
            >
              {loading ? 'Signing In…' : 'Sign In'}
            </button>
          </form>

          <p style={footerTextStyle}>
            Don’t have an account?{' '}
            <a href="/auth/signup" style={footerLinkStyle}>
              Sign up
            </a>
          </p>
        </div>
      </div>

      <div style={rightColumnStyle} className="hide-on-narrow">
        <div style={imageContainerStyle}>
          <div style={imageBoxStyle}>
            <Image
              src="/icons/auth-image.svg"
              alt="Dashboard Preview"
              width={1000}
              height={600}
              style={{ objectFit: 'cover', width: '100%', height: 'auto' }}
            />
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1023px) {
          .hide-on-narrow {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
