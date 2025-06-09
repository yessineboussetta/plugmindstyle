"use client"
import { useState } from "react"
import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { ToastContainer, toast } from "react-toastify"
import styles from "./ForgotPassword.module.css"
import logo from "../../assets/logo.png"
import "react-toastify/dist/ReactToastify.css"

export default function ForgotPassword() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("http://localhost:8000/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        const errorMessage = data?.detail || "Failed to send reset email"
        console.error("Forgot password error:", errorMessage)
        toast.error(errorMessage)
        return
      }

      toast.success("If your email is registered, you will receive a password reset link")
      navigate("/login")
    } catch (error) {
      console.error("Error:", error)
      toast.error("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.forgotPasswordContainer}>
      {/* Background Pattern */}
      <div className={styles.backgroundPattern}></div>

      {/* Back to Login Button */}
      <motion.button
        className={styles.backButton}
        onClick={() => navigate("/login")}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
      >
        ← Back to Login
      </motion.button>

      <motion.form
        className={styles.forgotPasswordForm}
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

        <h2 className={styles.formTitle}>Reset Your Password</h2>
        <p className={styles.description}>Enter your email address and we'll send you a link to reset your password.</p>

        <div className={styles.inputGroup}>
          <label htmlFor="email">Email Address</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Enter your email address"
          />
        </div>

        <button type="submit" className={styles.btn} disabled={isLoading}>
          {isLoading ? (
            <div className={styles.loadingSpinner}>
              <div className={styles.spinner}></div>
              <span>Sending...</span>
            </div>
          ) : (
            "Send Reset Link"
          )}
        </button>

        <div className={styles.loginLink}>
          <span>Remember your password?</span>
          <button type="button" className={styles.linkBtn} onClick={() => navigate("/login")}>
            Back to Login
          </button>
        </div>
      </motion.form>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  )
}
