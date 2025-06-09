"use client"
import { useEffect, useState } from "react"
import styles from "./AccountSettings.module.css"
import axios from "axios"
import { toast } from "sonner"
import { CheckCircle2, RotateCcw, Save, User, Mail, Lock, Settings } from "lucide-react"
import { motion } from "framer-motion"

export default function AccountSettings() {
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    password: "",
  })

  const [originalData, setOriginalData] = useState({
    firstname: "",
    lastname: "",
    email: "",
  })

  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const res = await axios.get("http://localhost:8000/users/me", {
          headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
        })
        const { firstname, lastname, email } = res.data
        setFormData((prev) => ({ ...prev, firstname, lastname, email }))
        setOriginalData({ firstname, lastname, email })
      } catch {
        toast.error("Failed to load user info")
      }
    }

    fetchUserInfo()
  }, [])

  const isModified =
    formData.firstname !== originalData.firstname ||
    formData.lastname !== originalData.lastname ||
    formData.email !== originalData.email

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (success) setSuccess(false)
  }

  const handleReset = () => {
    setFormData({
      firstname: originalData.firstname,
      lastname: originalData.lastname,
      email: originalData.email,
      password: "",
    })
    setSuccess(false)
    toast.info("Changes reset")
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.password) {
      toast.warning("⚠️ Enter your password to confirm changes.")
      return
    }

    setIsLoading(true)
    try {
      await axios.put("http://localhost:8000/users/me", formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
      })
      toast.success("✅ Profile updated successfully")
      setSuccess(true)
      setOriginalData({
        firstname: formData.firstname,
        lastname: formData.lastname,
        email: formData.email,
      })
      setFormData((prev) => ({ ...prev, password: "" }))
    } catch (err) {
      const backendError = err.response?.data?.detail || err.response?.data?.message || err.message || "Update failed"
      toast.error(`❌ ${backendError}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.fullBackground}>
      <motion.div
        className={styles.accountSettingsContainer}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className={styles.headerSection}>
          <div className={styles.iconContainer}>
            <Settings className={styles.headerIcon} size={28} />
          </div>
          <h2 className={styles.pageTitle}>Account Settings</h2>
          <p className={styles.pageDescription}>Manage your personal information and account preferences</p>
        </div>

        <form className={styles.accountForm} onSubmit={handleSubmit}>
          <div className={styles.formSection}>
            <h3 className={styles.sectionTitle}>
              <User size={18} />
              Personal Information
            </h3>

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
              <label htmlFor="email">
                <Mail size={16} />
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Enter your email address"
              />
            </div>
          </div>

          <div className={styles.formSection}>
            <h3 className={styles.sectionTitle}>
              <Lock size={18} />
              Security Confirmation
            </h3>

            <div className={styles.inputGroup}>
              <label htmlFor="password">
                Confirm Password <span className={styles.required}>*</span>
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Enter your current password to confirm changes"
              />
              <p className={styles.inputHint}>Required to verify your identity before making changes</p>
            </div>
          </div>

          {success && (
            <motion.div
              className={styles.successMessage}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <CheckCircle2 size={20} />
              <span>Profile updated successfully!</span>
            </motion.div>
          )}

          <div className={styles.actionButtons}>
            <button
              type="button"
              className={`${styles.resetBtn} ${!isModified ? styles.disabled : ""}`}
              onClick={handleReset}
              disabled={!isModified}
            >
              <RotateCcw size={16} />
              <span>Reset Changes</span>
            </button>

            <button
              type="submit"
              className={`${styles.updateBtn} ${isModified && formData.password ? styles.active : ""}`}
              disabled={!isModified || !formData.password || isLoading}
            >
              {isLoading ? (
                <div className={styles.loadingSpinner}>
                  <div className={styles.spinner}></div>
                  <span>Updating...</span>
                </div>
              ) : (
                <>
                  <Save size={16} />
                  <span>Update Profile</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
