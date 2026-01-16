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
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>(
    registered ? 'Account created! Please sign in below.' : ''
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(0);
  const [showSecurityTip, setShowSecurityTip] = useState(false);

  // Lockout timer
  useEffect(() => {
    if (lockoutTime > 0) {
      const timer = setTimeout(() => {
        setLockoutTime(lockoutTime - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (isLocked && lockoutTime === 0) {
      setIsLocked(false);
      setAttempts(0);
    }
  }, [lockoutTime, isLocked]);

  // Redirect on authentication
  useEffect(() => {
    if (status === 'authenticated' && session) {
      const timer = setTimeout(() => {
        router.push('/dashboard');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [status, session, router]);

  // Show security tip after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSecurityTip(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (isLocked) {
      setErrorMsg(`Account temporarily locked. Try again in ${lockoutTime} seconds.`);
      return;
    }

    setErrorMsg('');
    setLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      const res = await signIn("credentials", {
        redirect: false,
        email: email.trim(),
        password: password.trim(),
      });

      setLoading(false);

      if (res?.error) {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        if (newAttempts >= 3) {
          setIsLocked(true);
          setLockoutTime(30);
          setErrorMsg("Too many failed attempts. Account locked for 30 seconds.");
        } else {
          setErrorMsg(`Invalid email or password. ${3 - newAttempts} attempt(s) remaining.`);
        }
        return;
      }

      if (res?.ok) {
        setAttempts(0);
        setErrorMsg('');
        window.location.href = '/dashboard';
      }
    } catch (error) {
      setLoading(false);
      console.error('Sign-in error:', error);
      setErrorMsg('An unexpected error occurred. Please try again.');
    }
  }

  const handleForgotPassword = () => {
    alert('Password reset link would be sent to your email address.');
  };

  // Dark/Gold Theme Styles
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#0D0D0D',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  };

  const leftColumnStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: '0 32px',
    backgroundColor: '#1A1A1A',
    boxShadow: '0 0 60px rgba(0, 0, 0, 0.5)',
    position: 'relative',
    zIndex: 2,
    borderRight: '1px solid #333333',
  };

  const rightColumnStyle: React.CSSProperties = {
    flex: 1,
    position: 'relative',
    background: 'linear-gradient(135deg, #1A1A1A 0%, #0D0D0D 50%, #252525 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  };

  const rightOverlayStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'radial-gradient(circle at 30% 40%, rgba(212, 175, 55, 0.15) 0%, transparent 50%), radial-gradient(circle at 70% 60%, rgba(212, 175, 55, 0.1) 0%, transparent 50%)',
    pointerEvents: 'none',
  };

  const formWrapperStyle: React.CSSProperties = {
    maxWidth: '420px',
    margin: '0 auto',
    width: '100%',
  };

  const logoContainerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '40px',
    justifyContent: 'center',
  };

  const logoIconStyle: React.CSSProperties = {
    width: '48px',
    height: '48px',
    background: 'linear-gradient(135deg, #D4AF37 0%, #B8962E 100%)',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    marginRight: '12px',
    boxShadow: '0 4px 15px rgba(212, 175, 55, 0.3)',
  };

  const logoTextStyle: React.CSSProperties = {
    fontSize: '28px',
    fontWeight: 700,
    background: 'linear-gradient(135deg, #F4D03F 0%, #D4AF37 50%, #B8962E 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    letterSpacing: '-0.025em',
  };

  const headingStyle: React.CSSProperties = {
    fontSize: '36px',
    fontWeight: 800,
    color: '#FFFFFF',
    margin: '0 0 8px 0',
    textAlign: 'center',
    letterSpacing: '-0.025em',
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: '16px',
    color: '#A0A0A0',
    marginBottom: '32px',
    textAlign: 'center',
    lineHeight: '1.5',
  };

  const inputGroupStyle: React.CSSProperties = {
    marginBottom: '20px',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '14px',
    fontWeight: 600,
    color: '#A0A0A0',
    marginBottom: '8px',
  };

  const inputWrapperStyle: React.CSSProperties = {
    position: 'relative',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 16px',
    fontSize: '16px',
    color: '#FFFFFF',
    border: '2px solid #333333',
    borderRadius: '12px',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'all 0.2s ease',
    backgroundColor: '#252525',
  };

  const inputFocusStyle: React.CSSProperties = {
    borderColor: '#D4AF37',
    boxShadow: '0 0 0 3px rgba(212, 175, 55, 0.15)',
    backgroundColor: '#1A1A1A',
  };

  const passwordToggleStyle: React.CSSProperties = {
    position: 'absolute',
    right: '16px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    color: '#A0A0A0',
    padding: '4px',
  };

  const checkboxContainerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '24px',
  };

  const checkboxWrapperStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const checkboxStyle: React.CSSProperties = {
    width: '16px',
    height: '16px',
    accentColor: '#D4AF37',
  };

  const checkboxLabelStyle: React.CSSProperties = {
    fontSize: '14px',
    color: '#A0A0A0',
    cursor: 'pointer',
  };

  const forgotPasswordStyle: React.CSSProperties = {
    fontSize: '14px',
    color: '#D4AF37',
    textDecoration: 'none',
    fontWeight: 500,
    cursor: 'pointer',
    border: 'none',
    background: 'none',
    transition: 'color 0.2s ease',
  };

  const buttonStyle: React.CSSProperties = {
    width: '100%',
    padding: '16px 0',
    fontSize: '16px',
    fontWeight: 600,
    color: '#0D0D0D',
    background: isLocked 
      ? 'linear-gradient(135deg, #4A4A4A 0%, #333333 100%)'
      : 'linear-gradient(135deg, #D4AF37 0%, #B8962E 100%)',
    border: 'none',
    borderRadius: '12px',
    cursor: loading || isLocked ? 'not-allowed' : 'pointer',
    transition: 'all 0.3s ease',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: isLocked ? 'none' : '0 4px 15px rgba(212, 175, 55, 0.3)',
  };

  const buttonHoverStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, #F4D03F 0%, #D4AF37 100%)',
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 25px rgba(212, 175, 55, 0.5)',
  };

  const errorTextStyle: React.CSSProperties = {
    color: attempts >= 2 ? '#FF4757' : '#F4D03F',
    fontSize: '14px',
    marginBottom: '16px',
    textAlign: 'center',
    padding: '12px',
    backgroundColor: attempts >= 2 ? 'rgba(255, 71, 87, 0.1)' : 'rgba(244, 208, 63, 0.1)',
    border: `1px solid ${attempts >= 2 ? 'rgba(255, 71, 87, 0.3)' : 'rgba(244, 208, 63, 0.3)'}`,
    borderRadius: '8px',
    fontWeight: 500,
  };

  const successTextStyle: React.CSSProperties = {
    color: '#00C48C',
    fontSize: '14px',
    marginBottom: '16px',
    textAlign: 'center',
    padding: '12px',
    backgroundColor: 'rgba(0, 196, 140, 0.1)',
    border: '1px solid rgba(0, 196, 140, 0.3)',
    borderRadius: '8px',
    fontWeight: 500,
  };

  const footerTextStyle: React.CSSProperties = {
    marginTop: '32px',
    fontSize: '14px',
    color: '#A0A0A0',
    textAlign: 'center',
  };

  const footerLinkStyle: React.CSSProperties = {
    color: '#D4AF37',
    textDecoration: 'none',
    fontWeight: 600,
  };

  const securityTipStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    background: 'linear-gradient(135deg, #252525 0%, #1A1A1A 100%)',
    color: 'white',
    padding: '16px 20px',
    borderRadius: '12px',
    fontSize: '14px',
    maxWidth: '300px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
    transform: showSecurityTip ? 'translateX(0)' : 'translateX(100%)',
    transition: 'transform 0.5s ease',
    zIndex: 1000,
    border: '1px solid rgba(212, 175, 55, 0.3)',
  };

  const closeTipStyle: React.CSSProperties = {
    position: 'absolute',
    top: '8px',
    right: '12px',
    background: 'none',
    border: 'none',
    color: '#A0A0A0',
    cursor: 'pointer',
    fontSize: '16px',
  };

  const rightContentStyle: React.CSSProperties = {
    textAlign: 'center',
    color: 'white',
    padding: '40px',
    maxWidth: '500px',
    position: 'relative',
    zIndex: 1,
  };

  const rightHeadingStyle: React.CSSProperties = {
    fontSize: '48px',
    fontWeight: 800,
    marginBottom: '24px',
    lineHeight: '1.1',
    background: 'linear-gradient(135deg, #F4D03F 0%, #D4AF37 50%, #B8962E 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  };

  const rightSubtitleStyle: React.CSSProperties = {
    fontSize: '20px',
    color: '#A0A0A0',
    marginBottom: '32px',
    lineHeight: '1.5',
  };

  const featureListStyle: React.CSSProperties = {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  };

  const featureItemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '16px',
    fontSize: '16px',
    gap: '12px',
    color: '#FFFFFF',
  };

  const loadingSpinnerStyle: React.CSSProperties = {
    display: 'inline-block',
    width: '20px',
    height: '20px',
    border: '2px solid rgba(13, 13, 13, 0.3)',
    borderRadius: '50%',
    borderTopColor: '#0D0D0D',
    animation: 'spin 0.8s linear infinite',
    marginRight: '8px',
  };

  // Don't show the form if already authenticated
  if (status === 'authenticated') {
    return (
      <div style={containerStyle}>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          fontSize: '18px',
          color: '#D4AF37'
        }}>
          Redirecting to dashboard...
        </div>
      </div>
    );
  }

  return (
    <>
      <div style={containerStyle}>
        <div style={leftColumnStyle}>
          <div style={formWrapperStyle}>
           <div style={logoContainerStyle}>
  <Image
    src="/images/Logo.png"
    alt="Horizon Global Capital"
    width={260}
    height={80}
    priority
    style={{
      height: 'auto',
      width: '260px',
      objectFit: 'contain',
    }}
  />
</div>


            <h1 style={headingStyle}>Welcome Back</h1>
            <p style={subtitleStyle}>
              Sign in to your account to access your secure banking dashboard
            </p>

            {errorMsg && (
              <div style={registered ? successTextStyle : errorTextStyle}>
                {registered && '✅ '}
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={inputGroupStyle}>
                <label htmlFor="email" style={labelStyle}>
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  style={inputStyle}
                  onFocus={(e) =>
                    Object.assign(e.currentTarget.style, inputFocusStyle)
                  }
                  onBlur={(e) =>
                    Object.assign(e.currentTarget.style, inputStyle)
                  }
                />
              </div>

              <div style={inputGroupStyle}>
                <label htmlFor="password" style={labelStyle}>
                  Password
                </label>
                <div style={inputWrapperStyle}>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
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
                  <button
                    type="button"
                    style={passwordToggleStyle}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div style={checkboxContainerStyle}>
                <div style={checkboxWrapperStyle}>
                  <input
                    type="checkbox"
                    id="remember"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={checkboxStyle}
                  />
                  <label htmlFor="remember" style={checkboxLabelStyle}>
                    Remember me for 30 days
                  </label>
                </div>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  style={forgotPasswordStyle}
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading || isLocked}
                style={{
                  ...buttonStyle,
                  ...(loading || isLocked ? { opacity: 0.7 } : {}),
                }}
                onMouseEnter={(e) => {
                  if (!loading && !isLocked) {
                    Object.assign(e.currentTarget.style, buttonHoverStyle);
                  }
                }}
                onMouseLeave={(e) =>
                  Object.assign(e.currentTarget.style, buttonStyle)
                }
              >
                {loading && <span style={loadingSpinnerStyle}></span>}
                {loading ? 'Signing In...' : isLocked ? `Locked (${lockoutTime}s)` : 'Sign In Securely'}
              </button>
            </form>

            <p style={footerTextStyle}>
              Don't have an account?{' '}
              <a href="/auth/signup" style={footerLinkStyle}>
                Create account
              </a>
            </p>

            {/* Security indicators */}
            <div style={{
              marginTop: '24px',
              padding: '16px',
              backgroundColor: '#252525',
              borderRadius: '8px',
              border: '1px solid #333333',
            }}>
              <div style={{
                fontSize: '12px',
                color: '#A0A0A0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '16px',
                flexWrap: 'wrap',
              }}>
                <span>🔒 256-bit SSL</span>
                <span>🛡️ FDIC Insured</span>
                <span>✅ SOC 2 Certified</span>
              </div>
            </div>
          </div>
        </div>

        <div style={rightColumnStyle} className="hide-on-narrow">
          <div style={rightOverlayStyle}></div>
          <div style={rightContentStyle}>
            <h2 style={rightHeadingStyle}>Secure Banking Made Simple</h2>
            <p style={rightSubtitleStyle}>
              Join over 100,000 customers who trust Horizon Global Capital with their financial future.
            </p>
            <ul style={featureListStyle}>
              <li style={featureItemStyle}>
                <span style={{ color: '#D4AF37' }}>✅</span>
                <span>Bank-grade security with 2FA</span>
              </li>
              <li style={featureItemStyle}>
                <span style={{ color: '#D4AF37' }}>✅</span>
                <span>Real-time transaction notifications</span>
              </li>
              <li style={featureItemStyle}>
                <span style={{ color: '#D4AF37' }}>✅</span>
                <span>24/7 customer support</span>
              </li>
              <li style={featureItemStyle}>
                <span style={{ color: '#D4AF37' }}>✅</span>
                <span>FDIC insured up to $250,000</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Security Tip */}
      {showSecurityTip && (
        <div style={securityTipStyle}>
          <button
            style={closeTipStyle}
            onClick={() => setShowSecurityTip(false)}
          >
            ×
          </button>
          <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#D4AF37' }}>
            🔐 Security Tip
          </div>
          <div style={{ fontSize: '13px', lineHeight: '1.4', color: '#A0A0A0' }}>
            Never share your login credentials. Horizon will never ask for your password via email or phone.
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @media (max-width: 1023px) {
          .hide-on-narrow {
            display: none;
          }
        }
        
        @media (max-width: 640px) {
          body {
            font-size: 14px;
          }
        }
        
        input::placeholder {
          color: #666666;
        }
      `}</style>
    </>
  );
}