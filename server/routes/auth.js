
import jwt from 'jsonwebtoken';
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import {
  createHmac,
  randomInt,
  timingSafeEqual,
} from 'node:crypto';

import prisma from '../utils/prisma.js';
import { sendVerificationEmail } from '../utils/email.js';

const router = Router();

const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function hashOtp(otp) {
  return createHmac('sha256', process.env.JWT_SECRET)
    .update(otp)
    .digest('hex');
}

function validOtpHash(otp, storedHash) {
  const submittedHash = Buffer.from(hashOtp(otp), 'hex');
  const savedHash = Buffer.from(storedHash, 'hex');

  return submittedHash.length === savedHash.length &&
    timingSafeEqual(submittedHash, savedHash);
}

function validPassword(password, name, email) {
  if (
    typeof password !== 'string' ||
    password.length < 8 ||
    password.length > 72 ||
    /\s/.test(password)
  ) {
    return false;
  }

  const rules =
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password);

  if (!rules) return false;

  const lowerPassword = password.toLowerCase();

  if (name && lowerPassword.includes(name.toLowerCase().trim())) {
    return false;
  }

  const emailName = email.split('@')[0];

  if (emailName && lowerPassword.includes(emailName.toLowerCase())) {
    return false;
  }

  return true;
}

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validPhone(phone) {
  return /^\+?[0-9]{9,15}$/.test(phone);
}

// REGISTER CUSTOMER OR PHARMACY
router.post('/register', async (req, res) => {
  try {
    const { accountType, password } = req.body;

    if (!['customer', 'pharmacy'].includes(accountType)) {
      return res.status(400).json({
        message: 'Choose customer or pharmacy registration.',
      });
    }

    let email;
    let name;
    let registrationData;

    if (accountType === 'customer') {
      const fullName = String(
        req.body.fullName || req.body.name || ''
      ).trim();

      const phone = String(req.body.phone || '').trim();

      email = normalizeEmail(req.body.email);
      name = fullName;

      if (fullName.length < 2 || fullName.length > 100) {
        return res.status(400).json({
          message: 'Enter a valid full name.',
        });
      }

      if (!phone || !validPhone(phone)) {
        return res.status(400).json({
          message: 'Enter a valid phone number.',
        });
      }

      registrationData = {
        full_name: fullName,
        phone,
      };
    } else {
      const ownerName = String(req.body.ownerName || '').trim();
      const pharmacyName = String(req.body.pharmacyName || '').trim();
      const registrationNumber = String(
        req.body.registrationNumber || ''
      ).trim();
      const phone = String(req.body.phone || '').trim();
      const address = String(req.body.address || '').trim();
      const county = String(req.body.county || '').trim();

      email = normalizeEmail(req.body.ownerEmail);
      name = ownerName;

      if (!ownerName || ownerName.length > 100) {
        return res.status(400).json({
          message: 'Enter the pharmacy owner’s full name.',
        });
      }

      if (!pharmacyName || pharmacyName.length > 150) {
        return res.status(400).json({
          message: 'Enter a valid pharmacy name.',
        });
      }

      if (!registrationNumber || registrationNumber.length > 100) {
        return res.status(400).json({
          message: 'Enter the pharmacy registration number.',
        });
      }

      if (!phone || !validPhone(phone)) {
        return res.status(400).json({
          message: 'Enter a valid phone number.',
        });
      }

      if (!address || !county || county.length > 100) {
        return res.status(400).json({
          message: 'Enter the physical address and county.',
        });
      }

      registrationData = {
        owner_name: ownerName,
        pharmacy_name: pharmacyName,
        registration_number: registrationNumber,
        phone,
        address,
        county,
      };
    }

    if (!validEmail(email)) {
      return res.status(400).json({
        message: 'Enter a valid email address.',
      });
    }

    if (!validPassword(password, name, email)) {
      return res.status(400).json({
        message:
          'Password must have at least 8 characters, uppercase and lowercase letters, a number and a special character. No spaces, name or email username are allowed.',
      });
    }

    const [existingCustomer, existingPharmacy] = await Promise.all([
      prisma.customers.findUnique({ where: { email } }),
      prisma.pharmacies.findUnique({
        where: { owner_email: email },
      }),
    ]);

    if (existingCustomer || existingPharmacy) {
      return res.status(409).json({
        message: 'This email is already registered. Please log in instead.',
      });
    }

    if (accountType === 'pharmacy') {
      const existingRegistration =
        await prisma.pharmacies.findUnique({
          where: {
            registration_number: registrationData.registration_number,
          },
        });

      if (existingRegistration) {
        return res.status(409).json({
          message: 'This pharmacy registration number is already registered.',
        });
      }
    }

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured.');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const otp = String(randomInt(100000, 1000000));
    const otpHash = hashOtp(otp);

    const expiresAt = new Date(
      Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000
    );

    await prisma.pending_registrations.deleteMany({
      where: { account_type: accountType, email },
    });

    await prisma.pending_registrations.create({
      data: {
        account_type: accountType,
        email,
        password_hash: passwordHash,
        registration_data: registrationData,
        otp_hash: otpHash,
        expires_at: expiresAt,
        attempts: 0,
        last_sent_at: new Date(),
      },
    });

    try {
      await sendVerificationEmail(email, otp);
    } catch (emailError) {
      await prisma.pending_registrations.deleteMany({
        where: { account_type: accountType, email },
      });

      console.error('Verification email error:', emailError);

      return res.status(502).json({
        message: 'We could not send the verification email. Please try again.',
      });
    }

    return res.status(200).json({
      message: 'A verification code has been sent to your email. It expires in 10 minutes.',
      email,
      accountType,
    });
  } catch (error) {
    console.error('Registration error:', error);

    return res.status(500).json({
      message: 'Registration could not be started. Please try again.',
    });
  }
});

// VERIFY EMAIL AND SAVE ACCOUNT
router.post('/verify-email', async (req, res) => {
  try {
    const accountType = req.body.accountType;
    const email = normalizeEmail(req.body.email);
    const otp = String(req.body.otp || '').trim();

    if (!['customer', 'pharmacy'].includes(accountType)) {
      return res.status(400).json({
        message: 'Invalid account type.',
      });
    }

    if (!validEmail(email) || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        message: 'Enter a valid email address and six-digit code.',
      });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured.');
    }

    const result = await prisma.$transaction(async (tx) => {
      const pending = await tx.pending_registrations.findFirst({
        where: {
          account_type: accountType,
          email,
        },
      });

      if (!pending) {
        return {
          status: 404,
          message: 'No pending registration was found. Please register again.',
        };
      }

      if (pending.expires_at.getTime() <= Date.now()) {
        await tx.pending_registrations.delete({
          where: { id: pending.id },
        });

        return {
          status: 400,
          message: 'Your verification code has expired. Please register again.',
        };
      }

      if (pending.attempts >= MAX_OTP_ATTEMPTS) {
        await tx.pending_registrations.delete({
          where: { id: pending.id },
        });

        return {
          status: 429,
          message: 'Too many incorrect attempts. Please register again.',
        };
      }

      if (!validOtpHash(otp, pending.otp_hash)) {
        const newAttempts = pending.attempts + 1;

        if (newAttempts >= MAX_OTP_ATTEMPTS) {
          await tx.pending_registrations.delete({
            where: { id: pending.id },
          });
        } else {
          await tx.pending_registrations.update({
            where: { id: pending.id },
            data: { attempts: newAttempts },
          });
        }

        return {
          status: 400,
          message: `Incorrect verification code. ${MAX_OTP_ATTEMPTS - newAttempts} attempt(s) remaining.`,
        };
      }

      const data = pending.registration_data;

      if (accountType === 'customer') {
        const customer = await tx.customers.create({
          data: {
            full_name: data.full_name,
            email: pending.email,
            password_hash: pending.password_hash,
            phone: data.phone,
            account_status: 'active',
          },
        });

        await tx.pending_registrations.delete({
          where: { id: pending.id },
        });

        return {
          status: 200,
          message: 'Your email is verified and your customer account has been created.',
          accountType: 'customer',
          accountId: customer.customer_id.toString(),
        };
      }

      const pharmacy = await tx.pharmacies.create({
        data: {
          owner_name: data.owner_name,
          owner_email: pending.email,
          password_hash: pending.password_hash,
          pharmacy_name: data.pharmacy_name,
          registration_number: data.registration_number,
          phone: data.phone,
          address: data.address,
          county: data.county,
          approval_status: 'pending',
        },
      });

      await tx.pending_registrations.delete({
        where: { id: pending.id },
      });

      return {
        status: 200,
        message: 'Your email is verified. Your pharmacy registration is awaiting administrator approval.',
        accountType: 'pharmacy',
        accountId: pharmacy.pharmacy_id.toString(),
        approvalStatus: 'pending',
      };
    });

    const { status, ...response } = result;

    if (status === 200 && response.accountType === 'customer') {
      response.token = jwt.sign(
        {
          sub: response.accountId,
          accountType: 'customer',
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
    }

    return res.status(status).json(response);
  } catch (error) {
    console.error('Email verification error:', error);

    if (error.code === 'P2002') {
      return res.status(409).json({
        message: 'Some registration details are already in use. Please contact support.',
      });
    }

    return res.status(500).json({
      message: 'Email verification could not be completed. Please try again.',
    });
  }
});

// LOGIN CUSTOMER OR PHARMACY
router.post('/login', async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = req.body.password;
    const accountType = req.body.accountType || 'customer';

    if (!validEmail(email) || typeof password !== 'string' || !password) {
      return res.status(400).json({
        message: 'Enter a valid email address and password.',
      });
    }

    if (!['customer', 'pharmacy'].includes(accountType)) {
      return res.status(400).json({
        message: 'Invalid account type.',
      });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured.');
    }

    let account;
    let accountId;
    let storedPassword;
    let accountName;

    if (accountType === 'customer') {
      account = await prisma.customers.findUnique({
        where: { email },
      });

      if (!account) {
        return res.status(401).json({
          message: 'Incorrect email or password.',
        });
      }

      accountId = account.customer_id.toString();
      storedPassword = account.password_hash;
      accountName = account.full_name;

      if (String(account.account_status).toLowerCase() !== 'active') {
        return res.status(403).json({
          message: 'Your customer account is not active. Please contact support.',
        });
      }
    } else {
      account = await prisma.pharmacies.findUnique({
        where: { owner_email: email },
      });

      if (!account) {
        return res.status(401).json({
          message: 'Incorrect email or password.',
        });
      }

      accountId = account.pharmacy_id.toString();
      storedPassword = account.password_hash;
      accountName = account.pharmacy_name;

      const approvalStatus = String(
        account.approval_status || ''
      ).toLowerCase();

      if (approvalStatus !== 'approved') {
        return res.status(403).json({
          message:
            approvalStatus === 'pending'
              ? 'Your pharmacy registration is awaiting administrator approval.'
              : 'Your pharmacy account has not been approved. Please contact support.',
        });
      }
    }

    const passwordMatches = await bcrypt.compare(
      password,
      storedPassword
    );

    if (!passwordMatches) {
      return res.status(401).json({
        message: 'Incorrect email or password.',
      });
    }

    const token = jwt.sign(
      {
        sub: accountId,
        accountType,
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      message: 'Login successful.',
      token,
      accountId,
      accountType,
      name: accountName,
      email,
    });
  } catch (error) {
    console.error('Login error:', error);

    return res.status(500).json({
      message: 'Login could not be completed. Please try again.',
    });
  }
});

export default router;
