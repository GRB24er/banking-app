// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { sendWelcomeEmail } from '@/lib/mail';
// @ts-ignore - runtime exports exist, TypeScript resolution quirk with nodemailer types
import { sendEmail, emailShell, greeting, leadText, signatureBlock } from '@/lib/mail';

// Helper functions for generating account details
function generateAccountNumber() {
  return 'AC' + Math.floor(1e8 + Math.random() * 9e8);
}

function generateRoutingNumber() {
  return 'RT' + Math.floor(1e8 + Math.random() * 9e8);
}

function generateBitcoinAddress() {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let address = '1'; // Bitcoin addresses start with 1 or 3
  for (let i = 0; i < 33; i++) {
    address += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return address;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Registration request body:', body);
    
    // Extract fields - handle both simple and enhanced forms
    const {
      // Simple form fields
      name,
      email,
      password,
      // Enhanced form fields
      firstName,
      lastName,
      confirmPassword,
      dob,
      nationality,
      idType,
      idNumber,
      address,
      city,
      postalCode,
      country,
      phone,
      employmentStatus,
      monthlyIncome,
      purpose,
      terms,
      privacy,
      marketing,
    } = body;

    // Determine form type and construct full name
    const isEnhancedForm = !!(firstName || lastName);
    const fullName = isEnhancedForm 
      ? `${firstName || ''} ${lastName || ''}`.trim()
      : name;

    // Normalize email
    const userEmail = email?.toLowerCase().trim();
    const userPassword = password;

    // Basic validation
    if (!fullName || !userEmail || !userPassword) {
      console.log('Missing basic fields:', { fullName, userEmail, hasPassword: !!userPassword });
      return NextResponse.json({ 
        message: 'Name, email, and password are required',
        errors: {
          name: !fullName ? 'Name is required' : undefined,
          email: !userEmail ? 'Email is required' : undefined,
          password: !userPassword ? 'Password is required' : undefined,
        }
      }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      return NextResponse.json(
        { message: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Password validation
    if (userPassword.length < 8) {
      return NextResponse.json(
        { message: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Enhanced form specific validations
    if (isEnhancedForm) {
      // Check password match if confirmPassword is provided
      if (confirmPassword && userPassword !== confirmPassword) {
        return NextResponse.json(
          { message: 'Passwords do not match' },
          { status: 400 }
        );
      }

      // Age validation if DOB is provided
      if (dob) {
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        if (age < 18) {
          return NextResponse.json(
            { message: 'You must be at least 18 years old to register' },
            { status: 400 }
          );
        }
      }

      // Phone validation if provided
      if (phone && !/^\+?\d{10,15}$/.test(phone.replace(/[\s-]/g, ''))) {
        return NextResponse.json(
          { message: 'Please enter a valid phone number' },
          { status: 400 }
        );
      }
    }

    // Connect to database
    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({ email: userEmail });
    if (existingUser) {
      console.log('User already exists:', userEmail);
      return NextResponse.json(
        { message: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Generate account details
    const accountNumber = generateAccountNumber();
    const routingNumber = generateRoutingNumber();

    // Create user object
    const userData: any = {
      name: fullName,
      email: userEmail,
      password: userPassword,
      role: 'user',
      verified: false,
      checkingBalance: 0,
      savingsBalance: 0,
      investmentBalance: 0,
      accountNumber,
      routingNumber,
      transactions: [],
    };

    // Store enhanced profile data if available
    if (isEnhancedForm) {
      // Add any enhanced data as metadata (you can extend your User model to store this)
      userData.metadata = {
        firstName,
        lastName,
        dateOfBirth: dob ? new Date(dob) : undefined,
        nationality,
        identification: {
          type: idType || 'passport',
          number: idNumber
        },
        address: {
          street: address,
          city,
          postalCode,
          country
        },
        phone,
        employment: {
          status: employmentStatus,
          monthlyIncome
        },
        accountPurpose: purpose,
        consents: {
          terms: terms || false,
          privacy: privacy || false,
          marketing: marketing || false
        }
      };
    }

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationCodeExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Add verification fields to user data
    userData.verificationCode = verificationCode;
    userData.verificationCodeExpiry = verificationCodeExpiry;
    userData.emailVerified = false;

    // Create the user
    console.log('Creating user:', userEmail);
    const newUser = await User.create(userData);

    // Add initial transaction
    const initTransaction = {
      type: 'deposit' as const,
      amount: 0,
      description: 'Account opened',
      date: new Date(),
      balanceAfter: 0,
    };

    newUser.transactions.push(initTransaction);
    await newUser.save();

    console.log('User created successfully:', newUser.email);

    // Send verification code email (don't fail registration if email fails)
    try {
      console.log('Sending verification code email to:', userEmail);
      const verificationHtml = emailShell(`
        ${greeting(fullName)}
        ${leadText('Thank you for registering with Horizon Global Capital. Please use the verification code below to verify your email address.')}
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 28px 0;">
          <tr>
            <td style="padding:24px; background:#111623; border:1px solid #1A2035; border-radius:12px; text-align:center;">
              <p style="margin:0 0 8px 0; font-family:sans-serif; font-size:12px; color:#8E92A8; text-transform:uppercase; letter-spacing:1px;">Your Verification Code</p>
              <p style="margin:0; font-family:'SF Mono','Consolas',monospace; font-size:36px; font-weight:700; color:#C9A84C; letter-spacing:8px;">${verificationCode}</p>
              <p style="margin:12px 0 0 0; font-family:sans-serif; font-size:12px; color:#5C6078;">This code expires in 15 minutes</p>
            </td>
          </tr>
        </table>
        ${leadText('If you did not create an account, please ignore this email.')}
        ${signatureBlock()}
      `, { preheader: `Your verification code is ${verificationCode}` });

      const emailResult = await sendEmail({
        to: userEmail,
        subject: 'Verify Your Email - Horizon Global Capital',
        html: verificationHtml,
      });

      if (emailResult.failed) {
        console.warn('Verification email failed but registration continues:', emailResult.error);
      } else if (emailResult.skipped) {
        console.log('Verification email skipped (SMTP not configured)');
      } else {
        console.log('Verification email sent successfully');
      }
    } catch (emailError) {
      console.error('Verification email error (non-fatal):', emailError);
    }

    // Return success response
    return NextResponse.json({
      message: 'Account created successfully! Please check your email for a verification code.',
      success: true,
      requiresVerification: true,
      user: {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        accountNumber: newUser.accountNumber,
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('Registration error:', error);
    
    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        { message: 'An account with this email already exists' },
        { status: 409 }
      );
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { message: validationErrors.join(', ') },
        { status: 400 }
      );
    }

    // Generic error
    return NextResponse.json(
      { 
        message: 'Registration failed. Please try again later.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}