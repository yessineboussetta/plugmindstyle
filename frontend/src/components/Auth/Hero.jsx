"use client"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import styles from "./Hero.module.css"

import logoImage from "../../assets/logo.png" // Top navbar logo
import heroImage from "../../assets/plugmind-bg.png" // Hero section image

export default function Hero() {
  const navigate = useNavigate()

  return (
    <div className={styles.heroContainer}>
      {/* Navigation */}
      <motion.nav
        className={styles.navbar}
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className={styles.logoWrap}>
          <img src={logoImage || "/placeholder.svg"} alt="PlugMind Logo" className={styles.navLogo} />
          <span className={styles.logoText}>PlugMind</span>
        </div>
        <div className={styles.navLinks}>
          <button onClick={() => navigate("/about")} className={styles.navBtn}>
            About Us
          </button>
          <button onClick={() => navigate("/login")} className={styles.navBtn}>
            Login
          </button>
          <button onClick={() => navigate("/signup")} className={styles.navBtnOutline}>
            Sign Up
          </button>
        </div>
      </motion.nav>

      {/* Hero Content */}
      <div className={styles.heroMain}>
        <motion.div
          className={styles.heroContent}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        >
          {/* Left Content */}
          <div className={styles.heroTextArea}>
            <div className={styles.logoIconContainer}>
              <img src={logoImage || "/placeholder.svg"} alt="PlugMind Logo Icon" className={styles.centerHeroLogo} />
            </div>
            <h1 className={styles.title}>
              Plug<span className={styles.titleAccent}>Mind</span>
            </h1>
            <p className={styles.subtitle}>
              Build your smart AI chatbot and embed it as a plugin — all in just a few clicks.
            </p>
            <p className={styles.ctaText}>Get started and improve your website</p>
            <button className={styles.btn} onClick={() => navigate("/signup")}>
              Get Started
              <span className={styles.btnIcon}>→</span>
            </button>
          </div>

          {/* Right Content */}
          <div className={styles.heroImageArea}>
            <div className={styles.imageContainer}>
              <img src={heroImage || "/placeholder.svg"} alt="PlugMind Dashboard" className={styles.heroImage} />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
