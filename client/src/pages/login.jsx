
import { useEffect, useState, useRef } from "react";

const API_BASE = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

const BRAND = "PharmTech";

const SLIDES = [
  "/medicine cabinet.png",
  "/meds.png",
  "/pharmaceutical-industry.jpg",
  "/pharmacy.jpg",
  "/pexels-karola-g-4021813.jpg",
  "/pharmacy_24_bg.avif",
];

const CAPTIONS = [
  "Medicine delivered to your door, anywhere in the country",
  "Find pharmacies with the medicines you need",
  "Verified pharmacies working together as one network",
  "Order medicines with confidence",
  "Access pharmacy stock across the network",
  "Healthcare that reaches every town",
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?\d{9,15}$/;

function normalisePhone(value) {
  return value.replace(/[^\d+]/g, "");
}

function passwordRules(password, email = "", name = "") {
  const personalWords = [
    email.split("@")[0],
    ...name.trim().split(/\s+/),
  ]
    .map((word) => word.toLowerCase())
    .filter((word) => word.length >= 3);

  return [
    {
      label: "At least 8 characters",
      valid: password.length >= 8 && password.length <= 64,
    },
    {
      label: "One uppercase letter",
      valid: /[A-Z]/.test(password),
    },
    {
      label: "One lowercase letter",
      valid: /[a-z]/.test(password),
    },
    {
      label: "One number",
      valid: /\d/.test(password),
    },
    {
      label: "One special character",
      valid: /[^A-Za-z0-9\s]/.test(password),
    },
    {
      label: "No spaces",
      valid: !/\s/.test(password),
    },
    {
      label: "No name or email in password",
      valid: !personalWords.some((word) =>
        password.toLowerCase().includes(word)
      ),
    },
  ];
}

async function apiRequest(endpoint, data) {
  let response;

  try {
    response = await fetch(`${API_BASE}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
  } catch {
    throw new Error(
      "Cannot connect to PharmTech. Make sure your backend server is running."
    );
  }

  const responseText = await response.text();

  let result;

  try {
    result = JSON.parse(responseText);
  } catch {
    console.error("Server response:", responseText);

    throw new Error(
      `The server returned an invalid response (HTTP ${response.status}). Please check the backend server.`
    );
  }

  if (!response.ok) {
    throw new Error(
      result.message || "Something went wrong. Please try again."
    );
  }

  return result;
}

function Icon({ type, size = 20 }) {
  const paths = {
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
      </>
    ),
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </>
    ),
    lock: (
      <>
        <rect x="5" y="11" width="14" height="10" rx="2" />
        <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      </>
    ),
    phone: (
      <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />
    ),
    pharmacy: (
      <>
        <path d="M3 21h18" />
        <path d="M5 21V7l7-4 7 4v14" />
        <path d="M9 21v-7h6v7" />
        <path d="M12 7v6M9 10h6" />
      </>
    ),
    check: <path d="m5 12 5 5 9-10" />,
    eye: (
      <>
        <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    eyeOff: (
      <>
        <path d="M3 3l18 18" />
        <path d="M10.6 6.1A9.8 9.8 0 0 1 12 5c6 0 10 7 10 7a17 17 0 0 1-3.2 4M6.6 6.6A17 17 0 0 0 2 12s4 7 10 7a9.7 9.7 0 0 0 4.2-1" />
      </>
    ),
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[type]}
    </svg>
  );
}

function Field({
  icon,
  label,
  value,
  onChange,
  type = "text",
  name,
  autoComplete,
  maxLength,
  right,
  error,
}) {
  const [focused, setFocused] = useState(false);
  const lifted = focused || Boolean(value);

  return (
    <div className="pt-field-wrap">
      <div
        className={`pt-field ${focused ? "focused" : ""} ${
          error ? "invalid" : ""
        }`}
      >
        <span className="pt-field-icon">
          <Icon type={icon} />
        </span>

        <label
          className={lifted ? "lifted" : ""}
          htmlFor={name}
        >
          {label}
        </label>

        <input
          id={name}
          name={name}
          type={type}
          value={value}
          autoComplete={autoComplete}
          maxLength={maxLength}
          onChange={(event) => onChange(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          aria-invalid={Boolean(error)}
        />

        {right && <span className="pt-field-right">{right}</span>}
      </div>

      {error && <p className="pt-field-error">{error}</p>}
    </div>
  );
}

function PasswordToggle({ shown, onClick }) {
  return (
    <button
      type="button"
      className="pt-eye"
      onClick={onClick}
      aria-label={shown ? "Hide password" : "Show password"}
    >
      <Icon type={shown ? "eyeOff" : "eye"} size={19} />
    </button>
  );
}

function Message({ type = "error", children }) {
  return (
    <div className={`pt-message ${type}`} role="status">
      {children}
    </div>
  );
}

function PasswordRules({ password, email, name }) {
  const rules = passwordRules(password, email, name);

  return (
    <div className="pt-rules">
      {rules.map((rule) => (
        <div
          key={rule.label}
          className={rule.valid ? "valid" : ""}
        >
          <span>{rule.valid ? "✓" : "×"}</span>
          {rule.label}
        </div>
      ))}
    </div>
  );
}

function PasswordStrength({ password }) {
  const rules = passwordRules(password).slice(0, 6);
  const score = rules.filter((rule) => rule.valid).length;

  const level =
    !password
      ? 0
      : score <= 2
        ? 1
        : score <= 4
          ? 2
          : score === 5
            ? 3
            : 4;

  const labels = ["", "Weak", "Fair", "Good", "Strong"];

  return (
    <div className="pt-strength">
      <div className="pt-strength-bars">
        {[0, 1, 2, 3].map((item) => (
          <span
            key={item}
            className={item < level ? `level-${level}` : ""}
          />
        ))}
      </div>
      <small>{labels[level]}</small>
    </div>
  );
}

// LOGIN FORM
function LoginForm({ onSwitch }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accountType, setAccountType] = useState("customer");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleLogin(event) {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }

    setBusy(true);

    try {
      const result = await apiRequest("/api/auth/login", {
        email: email.trim().toLowerCase(),
        password,
        accountType,
      });

      if (
        !result.token ||
        !result.accountId ||
        !result.accountType
      ) {
        throw new Error(
          "Login was successful, but the session details are incomplete."
        );
      }

      const userSession = {
        id: result.accountId,
        accountId: result.accountId,
        accountType: result.accountType,
        email: result.email,
        name: result.name,
        token: result.token,
      };

      sessionStorage.setItem(
        "pharmalink_session",
        JSON.stringify(userSession)
      );

      window.location.hash = "/home";
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="pt-card">
      <CardHeader
        eyebrow="Welcome home"
        title="Log in to your account"
        tagline="Find your medicine across every partner pharmacy"
      />

      <div className="pt-account-switch">
        <button
          type="button"
          className={accountType === "customer" ? "selected" : ""}
          onClick={() => {
            setAccountType("customer");
            setError("");
          }}
        >
          Customer
        </button>

        <button
          type="button"
          className={accountType === "pharmacy" ? "selected" : ""}
          onClick={() => {
            setAccountType("pharmacy");
            setError("");
          }}
        >
          Pharmacy owner
        </button>
      </div>

      {error && <Message>{error}</Message>}

      <form onSubmit={handleLogin}>
        <Field
          icon="mail"
          label="Email address"
          name="login-email"
          value={email}
          onChange={setEmail}
          type="email"
          autoComplete="username"
        />

        <Field
          icon="lock"
          label="Password"
          name="login-password"
          value={password}
          onChange={setPassword}
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          right={
            <PasswordToggle
              shown={showPassword}
              onClick={() => setShowPassword((value) => !value)}
            />
          }
        />

        <button
          className="pt-primary-button"
          type="submit"
          disabled={busy}
        >
          {busy ? "Please wait..." : "Log In"}
        </button>
      </form>

      <p className="pt-bottom-text">
        New to PharmTech?{" "}
        <button type="button" onClick={onSwitch}>
          Create an account
        </button>
      </p>
    </div>
  );
}

// REGISTRATION FORM
function RegistrationForm({ onSwitch, onRegistered }) {
  const [accountType, setAccountType] = useState("customer");

  const [values, setValues] = useState({
    fullName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    pharmacyName: "",
    registrationNumber: "",
    address: "",
    county: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const update = (field, value) => {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));
  };

  function validate() {
    const name = values.fullName.trim();

    if (!name || name.length < 3) {
      return "Enter the account owner's full name.";
    }

    if (!EMAIL_RE.test(values.email.trim())) {
      return "Enter a valid email address.";
    }

    if (!PHONE_RE.test(normalisePhone(values.phone))) {
      return "Enter a valid phone number with 9 to 15 digits.";
    }

    if (accountType === "pharmacy") {
      if (!values.pharmacyName.trim()) {
        return "Enter your pharmacy name.";
      }

      if (!values.registrationNumber.trim()) {
        return "Enter your pharmacy registration number.";
      }

      if (!values.address.trim()) {
        return "Enter your pharmacy physical address.";
      }

      if (!values.county.trim()) {
        return "Enter your county.";
      }
    }

    if (
      passwordRules(
        values.password,
        values.email,
        values.fullName
      ).some((rule) => !rule.valid)
    ) {
      return "Your password does not meet all the requirements.";
    }

    if (values.password !== values.confirmPassword) {
      return "Your passwords do not match.";
    }

    return "";
  }

  async function handleRegister(event) {
    event.preventDefault();
    setError("");

    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    setBusy(true);

    try {
      let registrationData;

      if (accountType === "customer") {
        registrationData = {
          accountType: "customer",
          fullName: values.fullName.trim(),
          email: values.email.trim().toLowerCase(),
          phone: normalisePhone(values.phone),
          password: values.password,
        };
      } else {
        registrationData = {
          accountType: "pharmacy",
          ownerName: values.fullName.trim(),
          ownerEmail: values.email.trim().toLowerCase(),
          pharmacyName: values.pharmacyName.trim(),
          registrationNumber: values.registrationNumber.trim(),
          phone: normalisePhone(values.phone),
          address: values.address.trim(),
          county: values.county.trim(),
          password: values.password,
        };
      }

      const result = await apiRequest(
        "/api/auth/register",
        registrationData
      );

      onRegistered({
        email: result.email || values.email.trim().toLowerCase(),
        accountType,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const passwordEye = (
    <PasswordToggle
      shown={showPassword}
      onClick={() => setShowPassword((value) => !value)}
    />
  );

  return (
    <div className="pt-card pt-register-card">
      <CardHeader
        eyebrow="Join the network"
        title="Create your account"
        tagline="Become part of the PharmTech network"
      />

      <div className="pt-account-switch">
        <button
          type="button"
          className={accountType === "customer" ? "selected" : ""}
          onClick={() => {
            setAccountType("customer");
            setError("");
          }}
        >
          Customer
        </button>

        <button
          type="button"
          className={accountType === "pharmacy" ? "selected" : ""}
          onClick={() => {
            setAccountType("pharmacy");
            setError("");
          }}
        >
          Pharmacy owner
        </button>
      </div>

      {error && <Message>{error}</Message>}

      <form onSubmit={handleRegister}>
        <Field
          icon="user"
          label="Full name"
          name="registration-name"
          value={values.fullName}
          onChange={(value) => update("fullName", value)}
          autoComplete="name"
          maxLength={100}
        />

        {accountType === "pharmacy" && (
          <>
            <Field
              icon="pharmacy"
              label="Pharmacy name"
              name="pharmacy-name"
              value={values.pharmacyName}
              onChange={(value) => update("pharmacyName", value)}
              maxLength={150}
            />

            <Field
              icon="pharmacy"
              label="Registration number"
              name="registration-number"
              value={values.registrationNumber}
              onChange={(value) =>
                update("registrationNumber", value)
              }
              maxLength={100}
            />

            <Field
              icon="user"
              label="Physical address"
              name="pharmacy-address"
              value={values.address}
              onChange={(value) => update("address", value)}
            />

            <Field
              icon="user"
              label="County"
              name="pharmacy-county"
              value={values.county}
              onChange={(value) => update("county", value)}
              maxLength={100}
            />
          </>
        )}

        <Field
          icon="phone"
          label="Phone number"
          name="registration-phone"
          value={values.phone}
          onChange={(value) => update("phone", value)}
          type="tel"
          autoComplete="tel"
          maxLength={20}
        />

        <Field
          icon="mail"
          label="Email address"
          name="registration-email"
          value={values.email}
          onChange={(value) => update("email", value)}
          type="email"
          autoComplete="email"
          maxLength={255}
        />

        <Field
          icon="lock"
          label="Password"
          name="registration-password"
          value={values.password}
          onChange={(value) => update("password", value)}
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          maxLength={64}
          right={passwordEye}
        />

        <PasswordStrength password={values.password} />

        <PasswordRules
          password={values.password}
          email={values.email}
          name={values.fullName}
        />

        <Field
          icon="lock"
          label="Confirm password"
          name="confirm-password"
          value={values.confirmPassword}
          onChange={(value) => update("confirmPassword", value)}
          type={showConfirm ? "text" : "password"}
          autoComplete="new-password"
          maxLength={64}
          right={
            <PasswordToggle
              shown={showConfirm}
              onClick={() => setShowConfirm((value) => !value)}
            />
          }
        />

        <button
          className="pt-primary-button"
          type="submit"
          disabled={busy}
        >
          {busy ? "Sending verification code..." : "Create account"}
        </button>
      </form>

      <p className="pt-bottom-text">
        Already have an account?{" "}
        <button type="button" onClick={onSwitch}>
          Log in
        </button>
      </p>
    </div>
  );
}

// EMAIL VERIFICATION FORM
function VerificationForm({ pending, onVerified, onBack }) {
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const inputRefs = useRef([]);
  const verificationStarted = useRef(false);
  const verifyHandlerRef = useRef(null);

  const otp = digits.join("");

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  function updateDigit(index, value) {
    const cleaned = value.replace(/\D/g, "");

    setError("");
    verificationStarted.current = false;

    // Handle autofill or multiple digits entered at once
    if (cleaned.length > 1) {
      const pasted = cleaned.slice(0, 6);

      setDigits(
        Array.from({ length: 6 }, (_, i) => pasted[i] || "")
      );

      inputRefs.current[Math.min(pasted.length, 5)]?.focus();
      return;
    }

    const digit = cleaned.slice(-1);

    setDigits((current) => {
      const next = [...current];
      next[index] = digit;
      return next;
    });

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(event, index) {
    if (
      event.key === "Backspace" &&
      !digits[index] &&
      index > 0
    ) {
      inputRefs.current[index - 1]?.focus();
    }

    if (event.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    if (event.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handlePaste(event) {
    event.preventDefault();

    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);

    verificationStarted.current = false;
    setError("");

    setDigits(
      Array.from({ length: 6 }, (_, index) => pasted[index] || "")
    );

    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  }

  async function handleVerify(event) {
    if (event) {
      event.preventDefault();
    }

    if (busy || verificationStarted.current) {
      return;
    }

    setError("");

    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the six-digit verification code.");
      return;
    }

    verificationStarted.current = true;
    setBusy(true);

    try {
      const result = await apiRequest("/api/auth/verify-email", {
        accountType: pending.accountType,
        email: pending.email,
        otp,
      });

      onVerified(result);
    } catch (err) {
      setError(err.message);
      verificationStarted.current = false;
    } finally {
      setBusy(false);
    }
  }

  // Keep the latest verification function available to auto-verification
  verifyHandlerRef.current = handleVerify;

  // Automatically verify when all six digits have been entered
  useEffect(() => {
    if (/^\d{6}$/.test(otp) && !busy) {
      verifyHandlerRef.current?.();
    }
  }, [otp, busy]);

  return (
    <div className="pt-card">
      <CardHeader
        eyebrow="Email verification"
        title="Verify your email"
        tagline="One more step to complete your registration"
      />

      <div className="pt-verification-icon">
        <Icon type="mail" size={32} />
      </div>

      <p className="pt-description">
        We sent a six-digit verification code to:
      </p>

      <p className="pt-email-display">{pending.email}</p>

      {error && <Message>{error}</Message>}

      <form onSubmit={handleVerify}>
        <div className="pt-otp-boxes">
          {Array.from({ length: 6 }).map((_, index) => (
            <input
              key={index}
              ref={(element) => {
                inputRefs.current[index] = element;
              }}
              type="text"
              inputMode="numeric"
              autoComplete={index === 0 ? "one-time-code" : "off"}
              maxLength={1}
              value={digits[index]}
              disabled={busy}
              onChange={(event) =>
                updateDigit(index, event.target.value)
              }
              onKeyDown={(event) =>
                handleKeyDown(event, index)
              }
              onPaste={handlePaste}
              onFocus={(event) => event.target.select()}
              aria-label={`Verification digit ${index + 1}`}
            />
          ))}
        </div>

        <button
          className="pt-primary-button"
          type="submit"
          disabled={busy}
        >
          {busy ? "Verifying..." : "Verify email"}
        </button>
      </form>

      <p className="pt-description pt-small">
        Your code expires after 10 minutes. Check your spam folder if
        you cannot find the email.
      </p>

      <p className="pt-bottom-text">
        <button
          type="button"
          onClick={onBack}
          disabled={busy}
        >
          Back to registration
        </button>
      </p>
    </div>
  );
}

// CARD HEADER
function CardHeader({ eyebrow, title, tagline }) {
  return (
    <div className="pt-header">
      <div className="pt-logo">
        <span className="pt-logo-symbol">+</span>
        <span>{BRAND}</span>
      </div>

      <p className="pt-eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p className="pt-tagline">{tagline}</p>
    </div>
  );
}

// MAIN AUTHENTICATION PAGE
export default function AuthPages() {
  const [page, setPage] = useState("login");
  const [pending, setPending] = useState(null);
  const [notice, setNotice] = useState("");
  const [verifiedMessage, setVerifiedMessage] = useState("");

  const [slide, setSlide] = useState(0);

  useEffect(() => {
    document.title = `${BRAND} | Account Access`;

    const timer = setInterval(() => {
      setSlide((current) => (current + 1) % SLIDES.length);
    }, 6000);

    return () => clearInterval(timer);
  }, []);

  function handleRegistered(data) {
    setPending(data);
    setNotice("");
    setVerifiedMessage("");
    setPage("verify");
  }

  // AUTOMATIC CUSTOMER LOGIN AFTER EMAIL VERIFICATION
  function handleVerified(result) {
    if (result.accountType === "customer") {
      if (!result.token || !result.accountId) {
        setVerifiedMessage(
          "Your email was verified, but we could not create your login session. Please contact support."
        );

        setPending(null);
        setPage("login");
        return;
      }

      const customerSession = {
        id: result.accountId,
        accountId: result.accountId,
        accountType: "customer",
        email: pending.email,
        token: result.token,
      };

      sessionStorage.setItem(
        "pharmalink_session",
        JSON.stringify(customerSession)
      );

      window.location.hash = "/home";
      return;
    }

    setPending(null);
    setPage("login");

    setVerifiedMessage(
      "Your email has been verified. Your pharmacy registration is now awaiting administrator approval."
    );

    setNotice("Email verification completed successfully.");
  }

  return (
    <div className="pt-page">
      <style>{styles}</style>

      <div
        className="pt-background"
        style={{
          backgroundImage: `url("${encodeURI(SLIDES[slide])}")`,
        }}
      />

      <div className="pt-overlay" />

      <main className="pt-main">
        {page === "login" && (
          <>
            {verifiedMessage && (
              <div className="pt-card-notice">
                <Message type="success">{verifiedMessage}</Message>
                <button
                  type="button"
                  onClick={() => setVerifiedMessage("")}
                >
                  Dismiss
                </button>
              </div>
            )}

            {notice && !verifiedMessage && (
              <div className="pt-card-notice">
                <Message type="success">{notice}</Message>
              </div>
            )}

            <LoginForm
              onSwitch={() => {
                setNotice("");
                setVerifiedMessage("");
                setPage("signup");
              }}
            />
          </>
        )}

        {page === "signup" && (
          <RegistrationForm
            onSwitch={() => setPage("login")}
            onRegistered={handleRegistered}
          />
        )}

        {page === "verify" && pending && (
          <VerificationForm
            pending={pending}
            onVerified={handleVerified}
            onBack={() => setPage("signup")}
          />
        )}

        <div className="pt-features">
          <span>✓ Nationwide pharmacy network</span>
          <span>✓ Shared medicine availability</span>
          <span>✓ Verified pharmacy accounts</span>
        </div>
      </main>

      <div className="pt-carousel-controls">
        <button
          type="button"
          aria-label="Previous background"
          onClick={() =>
            setSlide((current) =>
              (current - 1 + SLIDES.length) % SLIDES.length
            )
          }
        >
          ‹
        </button>

        <p>{CAPTIONS[slide]}</p>

        <button
          type="button"
          aria-label="Next background"
          onClick={() =>
            setSlide((current) => (current + 1) % SLIDES.length)
          }
        >
          ›
        </button>
      </div>
    </div>
  );
}

// STYLES
const styles = `
* {
  box-sizing: border-box;
}

.pt-page {
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
  background: #04150d;
  color: #fff;
  font-family: 'Montserrat', 'Segoe UI', system-ui, sans-serif;
}

.pt-background {
  position: fixed;
  inset: 0;
  z-index: 0;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  transform: scale(1.03);
  transition: background-image 1s ease;
}

.pt-overlay {
  position: fixed;
  inset: 0;
  z-index: 1;
  background: linear-gradient(
    180deg,
    rgba(0,0,0,.58),
    rgba(0,0,0,.75)
  );
}

.pt-main {
  position: relative;
  z-index: 2;
  min-height: 100vh;
  padding: 45px 16px 150px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.pt-card {
  width: min(440px, 100%);
  padding: 34px 30px 26px;
  border-radius: 32px;
  background: linear-gradient(
    145deg,
    rgba(255,255,255,.16),
    rgba(4,21,13,.78)
  );
  backdrop-filter: blur(22px) saturate(160%);
  -webkit-backdrop-filter: blur(22px) saturate(160%);
  border: 1px solid rgba(255,255,255,.23);
  box-shadow:
    0 30px 80px rgba(0,0,0,.55),
    0 0 50px rgba(16,178,101,.3),
    inset 0 1px 0 rgba(255,255,255,.3);
  animation: pt-enter .7s ease both;
}

.pt-register-card {
  width: min(480px, 100%);
  margin: 10px 0;
}

@keyframes pt-enter {
  from {
    opacity: 0;
    transform: translateY(25px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.pt-header {
  text-align: center;
  margin-bottom: 25px;
}

.pt-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 27px;
  font-weight: 800;
  letter-spacing: .3px;
  color: #fff;
  text-shadow: 0 0 18px rgba(16,178,101,.6);
}

.pt-logo-symbol {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: linear-gradient(135deg,#10b265,#7ee8b0);
  color: #04150d;
  font-size: 32px;
  line-height: 1;
}

.pt-eyebrow {
  margin: 17px 0 5px;
  color: #d8f8e8;
  font-size: 14px;
}

.pt-header h1 {
  margin: 5px 0;
  font-size: 27px;
  line-height: 1.25;
  font-weight: 800;
  background: linear-gradient(100deg,#fff,#d8f8e8,#7ee8b0);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.pt-tagline {
  margin: 8px 0 0;
  color: #d8f8e8;
  font-size: 13px;
  line-height: 1.5;
}

.pt-account-switch {
  display: flex;
  gap: 8px;
  padding: 5px;
  margin-bottom: 20px;
  border-radius: 30px;
  background: rgba(0,0,0,.3);
  border: 1px solid rgba(255,255,255,.15);
}

.pt-account-switch button {
  flex: 1;
  min-height: 42px;
  border: 0;
  border-radius: 25px;
  color: rgba(255,255,255,.8);
  background: transparent;
  font-family: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.pt-account-switch button.selected {
  color: #04150d;
  background: linear-gradient(120deg,#10b265,#7ee8b0);
  box-shadow: 0 0 20px rgba(16,178,101,.4);
}

.pt-field-wrap {
  margin-bottom: 17px;
}

.pt-field {
  height: 58px;
  position: relative;
  border-radius: 999px;
  background: linear-gradient(
    145deg,
    rgba(255,255,255,.1),
    rgba(4,21,13,.45)
  );
  border: 1px solid rgba(126,232,176,.28);
  box-shadow: 5px 8px 16px rgba(0,0,0,.3);
  transition: .25s ease;
}

.pt-field.focused {
  border-color: #7ee8b0;
  box-shadow:
    0 0 22px rgba(16,178,101,.35),
    5px 8px 16px rgba(0,0,0,.3);
  transform: translateY(-1px);
}

.pt-field.invalid {
  border-color: #ff7a90;
}

.pt-field-icon {
  position: absolute;
  left: 19px;
  top: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  color: #d8f8e8;
  pointer-events: none;
}

.pt-field label {
  position: absolute;
  left: 55px;
  top: 20px;
  color: rgba(255,255,255,.75);
  font-size: 14px;
  pointer-events: none;
  transition: .2s ease;
}

.pt-field label.lifted {
  top: 7px;
  font-size: 10px;
  color: #7ee8b0;
}

.pt-field input {
  width: 100%;
  height: 100%;
  padding: 24px 55px 5px;
  border: 0;
  outline: 0;
  background: transparent;
  color: #fff;
  font-family: inherit;
  font-size: 14px;
  border-radius: 999px;
}

.pt-field-right {
  position: absolute;
  right: 10px;
  top: 0;
  bottom: 0;
  display: flex;
  align-items: center;
}

.pt-eye {
  width: 38px;
  height: 38px;
  border: 0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #d8f8e8;
  background: transparent;
  cursor: pointer;
}

.pt-eye:hover {
  background: rgba(255,255,255,.12);
  color: #7ee8b0;
}

.pt-field-error {
  margin: 6px 0 0 17px;
  color: #ff9fb0;
  font-size: 12px;
}

.pt-primary-button {
  width: 100%;
  min-height: 54px;
  margin-top: 9px;
  border: 0;
  border-radius: 999px;
  background: linear-gradient(120deg,#10b265,#7ee8b0);
  color: #04150d;
  font-family: inherit;
  font-size: 16px;
  font-weight: 800;
  cursor: pointer;
  box-shadow:
    0 8px 25px rgba(16,178,101,.42),
    inset 0 1px 0 rgba(255,255,255,.5);
  transition: .25s ease;
}

.pt-primary-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 12px 35px rgba(16,178,101,.6);
}

.pt-primary-button:disabled {
  opacity: .65;
  cursor: not-allowed;
}

.pt-message {
  padding: 11px 14px;
  margin-bottom: 16px;
  border-radius: 15px;
  font-size: 13px;
  line-height: 1.5;
  color: #ffc9d2;
  background: rgba(255,122,144,.13);
  border: 1px solid rgba(255,122,144,.5);
}

.pt-message.success {
  color: #d8f8e8;
  background: rgba(16,178,101,.13);
  border-color: rgba(126,232,176,.5);
}

.pt-rules {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 10px;
  margin: 2px 6px 15px;
}

.pt-rules div {
  display: flex;
  align-items: center;
  gap: 6px;
  color: rgba(255,255,255,.65);
  font-size: 11px;
}

.pt-rules div span {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  border-radius: 50%;
  background: rgba(255,255,255,.12);
}

.pt-rules div.valid {
  color: #7ee8b0;
}

.pt-rules div.valid span {
  color: #04150d;
  background: #7ee8b0;
}

.pt-strength {
  display: flex;
  align-items: center;
  gap: 9px;
  margin: 0 6px 12px;
}

.pt-strength-bars {
  display: flex;
  flex: 1;
  gap: 5px;
}

.pt-strength-bars span {
  height: 6px;
  flex: 1;
  border-radius: 5px;
  background: rgba(255,255,255,.15);
}

.pt-strength-bars span.level-1 {
  background: #ff6b81;
}

.pt-strength-bars span.level-2 {
  background: #f2b84b;
}

.pt-strength-bars span.level-3 {
  background: #7ee8b0;
}

.pt-strength-bars span.level-4 {
  background: #10b265;
}

.pt-strength small {
  width: 48px;
  color: #7ee8b0;
  text-align: right;
  font-size: 11px;
}

.pt-bottom-text {
  margin: 22px 0 0;
  color: rgba(255,255,255,.85);
  text-align: center;
  font-size: 13px;
}

.pt-bottom-text button,
.pt-card-notice button {
  padding: 0;
  border: 0;
  background: transparent;
  color: #7ee8b0;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.pt-bottom-text button:hover,
.pt-card-notice button:hover {
  text-decoration: underline;
}

.pt-verification-icon {
  width: 72px;
  height: 72px;
  margin: 0 auto 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #04150d;
  background: linear-gradient(135deg,#10b265,#7ee8b0);
  box-shadow: 0 0 35px rgba(16,178,101,.5);
}

.pt-description {
  color: #d8f8e8;
  text-align: center;
  font-size: 13px;
  line-height: 1.6;
}

.pt-email-display {
  margin: 8px 0 20px;
  color: #7ee8b0;
  font-size: 14px;
  font-weight: 700;
  text-align: center;
  overflow-wrap: anywhere;
}

.pt-small {
  margin-top: 16px;
  font-size: 11px;
}

/* SIX-DIGIT OTP INPUT BOXES */
.pt-otp-boxes {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin: 25px 0;
}

.pt-otp-boxes input {
  width: 48px;
  height: 55px;
  border: 1px solid rgba(126,232,176,.4);
  border-radius: 12px;
  outline: none;
  background: rgba(4,21,13,.55);
  color: #fff;
  text-align: center;
  font-family: inherit;
  font-size: 23px;
  font-weight: 800;
}

.pt-otp-boxes input:focus {
  border-color: #7ee8b0;
  box-shadow: 0 0 15px rgba(16,178,101,.4);
}

.pt-card-notice {
  width: min(480px,100%);
  margin-bottom: 15px;
}

.pt-features {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 9px;
  max-width: 500px;
  margin-top: 20px;
}

.pt-features span {
  padding: 9px 13px;
  border: 1px solid rgba(126,232,176,.3);
  border-radius: 30px;
  background: rgba(4,21,13,.65);
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  backdrop-filter: blur(12px);
}

.pt-carousel-controls {
  position: fixed;
  z-index: 5;
  left: 50%;
  bottom: 16px;
  transform: translateX(-50%);
  width: min(560px,calc(100% - 24px));
  min-height: 65px;
  padding: 10px 14px;
  border: 1px solid rgba(255,255,255,.2);
  border-radius: 25px;
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(0,0,0,.55);
  backdrop-filter: blur(16px);
}

.pt-carousel-controls p {
  flex: 1;
  margin: 0;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  line-height: 1.4;
}

.pt-carousel-controls button {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border: 1px solid rgba(255,255,255,.25);
  border-radius: 50%;
  color: #fff;
  background: rgba(255,255,255,.1);
  font-size: 25px;
  cursor: pointer;
}

.pt-carousel-controls button:hover {
  color: #04150d;
  background: #7ee8b0;
}

@media (max-width: 520px) {
  .pt-main {
    padding: 25px 12px 130px;
  }

  .pt-card {
    padding: 27px 18px 22px;
    border-radius: 25px;
  }

  .pt-header h1 {
    font-size: 23px;
  }

  .pt-rules {
    grid-template-columns: 1fr;
  }

  .pt-features {
    gap: 6px;
  }

  .pt-features span {
    font-size: 10px;
  }
}

@media (max-width: 380px) {
  .pt-otp-boxes {
    gap: 6px;
  }

  .pt-otp-boxes input {
    width: 42px;
    height: 50px;
  }
}
`;
