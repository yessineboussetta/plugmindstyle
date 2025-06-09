"use client"
import { NavLink, useNavigate } from "react-router-dom"
import { LayoutDashboard, Settings, Info, LogOutIcon as LogoutIcon, Menu, X } from "lucide-react"
import { useState } from "react"
import styles from "./Sidebar.module.css"
import logo from "../../assets/logo.png"

export default function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    navigate("/login")
  }

  const toggleMobile = () => {
    setIsMobileOpen(!isMobileOpen)
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button className={styles.mobileMenuButton} onClick={toggleMobile}>
        {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && <div className={styles.mobileOverlay} onClick={toggleMobile}></div>}

      {/* Sidebar */}
      <aside
        className={`${styles.sidebar} ${isExpanded ? styles.expanded : ""} ${isMobileOpen ? styles.mobileOpen : ""}`}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        {/* Logo Section */}
        <div className={styles.logoContainer}>
          <div className={styles.logoWrapper}>
            <img src={logo || "/placeholder.svg"} alt="PlugMind Logo" className={styles.sidebarLogo} />
          </div>
          <div className={styles.logoText}>
            <span className={styles.sidebarTitle}>
              Plug<span className={styles.titleAccent}>Mind</span>
            </span>
            <span className={styles.sidebarSubtitle}>AI Dashboard</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className={styles.navContainer}>
          <div className={styles.navSection}>
            <NavLink
              to="/app/dashboard"
              className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ""}`}
              onClick={() => setIsMobileOpen(false)}
            >
              <div className={styles.linkIcon}>
                <LayoutDashboard size={20} />
              </div>
              <span className={styles.linkText}>Dashboard</span>
              {({ isActive }) => isActive && <div className={styles.activeIndicator}></div>}
            </NavLink>

            <NavLink
              to="/app/account"
              className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ""}`}
              onClick={() => setIsMobileOpen(false)}
            >
              <div className={styles.linkIcon}>
                <Settings size={20} />
              </div>
              <span className={styles.linkText}>Account Settings</span>
            </NavLink>

            <NavLink
              to="/app/about"
              className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ""}`}
              onClick={() => setIsMobileOpen(false)}
            >
              <div className={styles.linkIcon}>
                <Info size={20} />
              </div>
              <span className={styles.linkText}>About Us</span>
            </NavLink>
          </div>

          {/* Logout Button */}
          <button className={styles.logoutButton} onClick={handleLogout}>
            <div className={styles.linkIcon}>
              <LogoutIcon size={20} />
            </div>
            <span className={styles.linkText}>Logout</span>
          </button>
        </nav>
      </aside>
    </>
  )
}
