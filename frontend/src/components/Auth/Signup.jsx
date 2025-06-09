"use client"
import { useState } from "react"
import styles from "./Signup.module.css"
import { useNavigate, Link } from "react-router-dom"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { motion } from "framer-motion"
import logo from "../../assets/logo.png"
import "../../index.css"
import { FaCheck, FaTimes } from "react-icons/fa"

export default function Signup() {
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    password: "",
    confirmPassword: "",
    date: "",
    role: "user",
  })

  const [day, setDay] = useState("")
  const [month, setMonth] = useState("")
  const [year, setYear] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: "",
    isValid: false,
  })
  const [passwordsMatch, setPasswordsMatch] = useState(null)
  const navigate = useNavigate()

  const generateRange = (start, end) => Array.from({ length: end - start + 1 }, (_, i) => String(start + i))

  const validatePassword = (password) => {
    const minLength = 8
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumbers = /\d/.test(password)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)

    let score = 0
    const feedback = []

    if (password.length >= minLength) score += 1
    else feedback.push("Password must be at least 8 characters long")

    if (hasUpperCase) score += 1
    else feedback.push("Include at least one uppercase letter")

    if (hasLowerCase) score += 1
    else feedback.push("Include at least one lowercase letter")

    if (hasNumbers) score += 1
    else feedback.push("Include at least one number")

    if (hasSpecialChar) score += 1
    else feedback.push("Include at least one special character")

    return {
      score,
      feedback: feedback.join(". "),
      isValid: score >= 4, // Require at least 4 out of 5 criteria
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    if (name === "password") {
      const strength = validatePassword(value)
      setPasswordStrength(strength)
      // Check password match when password changes
      if (formData.confirmPassword) {
        setPasswordsMatch(value === formData.confirmPassword)
      }
    } else if (name === "confirmPassword") {
      // Check password match when confirm password changes
      setPasswordsMatch(value === formData.password)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match")
      setIsLoading(false)
      return
    }

    const passwordValidation = validatePassword(formData.password)
    if (!passwordValidation.isValid) {
      toast.error("Password is not strong enough. " + passwordValidation.feedback)
      setIsLoading(false)
      return
    }

    if (!day || !month || !year) {
      toast.error("Please select a valid birth date")
      setIsLoading(false)
      return
    }

    const birthDateFormatted = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
    const birthDateObj = new Date(birthDateFormatted)
    const today = new Date()
    const age = today.getFullYear() - birthDateObj.getFullYear()
    const monthDiff = today.getMonth() - birthDateObj.getMonth()
    const dayDiff = today.getDate() - birthDateObj.getDate()
    const is12OrOlder = age > 12 || (age === 12 && (monthDiff > 0 || (monthDiff === 0 && dayDiff >= 0)))

    if (!is12OrOlder) {
      toast.error("You must be at least 12 years old to sign up.")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("http://localhost:8000/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, date: birthDateFormatted }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.detail || "Signup failed")

      toast.success("Signup successful! Redirecting to verify...")
      toast.info("📬 Check your email to verify your account.")
      setTimeout(() => navigate("/login"), 3000)
    } catch (error) {
      toast.error(error.message || "Signup failed")
      setIsLoading(false)
    }
  }

  const isFormValid = () => {
    return (
      formData.firstname.trim() &&
      formData.lastname.trim() &&
      formData.email.trim() &&
      formData.password &&
      formData.confirmPassword &&
      day &&
      month &&
      year &&
      passwordsMatch &&
      passwordStrength.isValid
    )
  }

  return (
    <div className={styles.signupContainer}>
      {/* Background Pattern */}
      <div className={styles.backgroundPattern}></div>

      {/* Back to Home Button */}
      <motion.button
        className={styles.backButton}
        onClick={() => navigate("/")}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
      >
        ← Back to Home
      </motion.button>

      <motion.form
        className={styles.signupForm}
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className={styles.logoContainer}>
          <img src={logo || "/placeholder.svg"} alt="PlugMind Logo" className={styles.logo} />
          <h1 className={styles.websiteName}>
            Plug<span className={styles.nameAccent}>Mind</span>
          </h1>
        </div>

        <h2 className={styles.formTitle}>Create an Account</h2>
        <p className={styles.description}>Join PlugMind and start building your AI chatbot today.</p>

        <div className={styles.inputRow}>
          <div className={styles.inputGroup}>
            <label htmlFor="firstname">First Name</label>
            <input
              type="text"
              id="firstname"
              name="firstname"
              value={formData.firstname}
              onChange={handleChange}
              required
              placeholder="Enter your first name"
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="lastname">Last Name</label>
            <input
              type="text"
              id="lastname"
              name="lastname"
              value={formData.lastname}
              onChange={handleChange}
              required
              placeholder="Enter your last name"
            />
          </div>
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="Enter your email"
          />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            minLength={8}
            placeholder="Create a strong password"
          />
          {formData.password && (
            <div className={styles.passwordStrength}>
              <div className={styles.strengthMeter}>
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={`${styles.strengthSegment} ${i < passwordStrength.score ? styles.strong : ""}`}
                  />
                ))}
              </div>
              {passwordStrength.feedback && <p className={styles.strengthFeedback}>{passwordStrength.feedback}</p>}
            </div>
          )}
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="confirmPassword">Confirm Password</label>
          <div className={styles.confirmPasswordContainer}>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="Confirm your password"
              className={passwordsMatch !== null ? (passwordsMatch ? styles.match : styles.noMatch) : ""}
            />
            {passwordsMatch !== null && (
              <span className={styles.matchIcon}>
                {passwordsMatch ? <FaCheck className={styles.checkIcon} /> : <FaTimes className={styles.timesIcon} />}
              </span>
            )}
          </div>
          {passwordsMatch !== null && !passwordsMatch && <p className={styles.matchFeedback}>Passwords do not match</p>}
        </div>

        <div className={styles.inputGroup}>
          <label>Birth Date</label>
          <div className={styles.dateSelectGroup}>
            <select value={day} onChange={(e) => setDay(e.target.value)} required>
              <option value="">Day</option>
              {generateRange(1, 31).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <select value={month} onChange={(e) => setMonth(e.target.value)} required>
              <option value="">Month</option>
              {generateRange(1, 12).map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <select value={year} onChange={(e) => setYear(e.target.value)} required>
              <option value="">Year</option>
              {generateRange(1950, new Date().getFullYear())
                .reverse()
                .map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          className={`${styles.btn} ${!isFormValid() ? styles.btnDisabled : ""}`}
          disabled={!isFormValid() || isLoading}
        >
          {isLoading ? (
            <div className={styles.loadingSpinner}>
              <div className={styles.spinner}></div>
              <span>Creating your account...</span>
            </div>
          ) : (
            "Sign Up"
          )}
        </button>

        <div className={styles.links}>
          <div className={styles.loginLink}>
            <span>Already have an account?</span>
            <Link to="/login" className={styles.linkBtn}>
              Login
            </Link>
          </div>
        </div>
      </motion.form>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  )
}
