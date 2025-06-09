"use client"
import { useState } from "react"
import { motion } from "framer-motion"
import { useNavigate, Link } from "react-router-dom"
import { ToastContainer, toast } from "react-toastify"
import styles from "./Login.module.css"
import logo from "../../assets/logo.png"
import "react-toastify/dist/ReactToastify.css"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("http://localhost:8000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 404 || (response.status === 500 && data.detail?.includes("not found"))) {
          toast.error("Account not found. Please sign up.")
        } else if (response.status === 401) {
          if (data.detail === "Wrong password") {
            toast.error("Incorrect password. Please try again.")
          } else if (data.detail === "Account not verified") {
            toast.error("Please verify your email before logging in.")
            // Optionally redirect to a verification page or show verification instructions
            setTimeout(() => navigate("/verify-email"), 3000)
          } else {
            toast.error(data.detail || "Authentication failed")
          }
        } else {
          // Log the error for debugging
          console.error("Login error:", {
            status: response.status,
            data: data,
          })
          toast.error(data.detail || "Login failed. Please try again.")
        }
        setIsLoading(false)
        return
      }

      // Store tokens and role
      localStorage.setItem("access_token", data.access_token)
      localStorage.setItem("refresh_token", data.refresh_token)
      localStorage.setItem("role", data.role)

      toast.success("Login successful!")

      // Redirect based on role
      if (data.role === "admin") {
        navigate("/admin/dashboard")
      } else {
        navigate("/app/dashboard")
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error("An unexpected error occurred. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.loginContainer}>
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
        className={styles.loginForm}
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

        <h2 className={styles.formTitle}>Welcome Back</h2>
        <p className={styles.description}>Please enter your credentials to login.</p>

        <div className={styles.inputGroup}>
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Enter your email"
          />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Enter your password"
          />
        </div>

        <button type="submit" className={styles.btn} disabled={isLoading}>
          {isLoading ? (
            <div className={styles.loadingSpinner}>
              <div className={styles.spinner}></div>
              <span>Logging in...</span>
            </div>
          ) : (
            "Login"
          )}
        </button>

        <div className={styles.links}>
          <Link to="/forgot-password" className={styles.linkBtn}>
            Forgot Password?
          </Link>
          <div className={styles.signupLink}>
            <span>Don't have an account?</span>
            <Link to="/signup" className={styles.linkBtn}>
              Sign up
            </Link>
          </div>
        </div>
      </motion.form>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  )
}
