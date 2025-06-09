"use client"

import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { Copy, Download, Globe, Code, Zap, CheckCircle, XCircle, Clock } from "lucide-react"
import styles from "./PluginPage.module.css"
import axios from "../../axiosconfig"

export default function PluginPage() {
  const { chatbotId } = useParams()
  const [status, setStatus] = useState("checking")
  const [copiedIframe, setCopiedIframe] = useState(false)
  const [copiedShortcode, setCopiedShortcode] = useState(false)

  const iframeSnippet = `<iframe src="http://localhost:8000/chatbot/embed/${chatbotId}" width="100%" height="600px" style="border:none;border-radius:8px;"></iframe>`
  const wpShortcode = `[chatbot id="${chatbotId}"]`

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const token = localStorage.getItem("access_token")
        const res = await axios.get(`http://localhost:8000/chatbots/${chatbotId}/status`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setStatus(res.data.is_embedded ? "active" : "inactive")
      } catch (err) {
        setStatus("unknown")
      }
    }
    fetchStatus()
  }, [chatbotId])

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text)
      if (type === "iframe") {
        setCopiedIframe(true)
        setTimeout(() => setCopiedIframe(false), 2000)
      } else {
        setCopiedShortcode(true)
        setTimeout(() => setCopiedShortcode(false), 2000)
      }
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case "active":
        return <CheckCircle className={styles.statusIcon} />
      case "inactive":
        return <XCircle className={styles.statusIcon} />
      case "checking":
        return <Clock className={styles.statusIcon} />
      default:
        return <XCircle className={styles.statusIcon} />
    }
  }

  const getStatusText = () => {
    switch (status) {
      case "active":
        return "Active & Embedded"
      case "inactive":
        return "Not Embedded"
      case "checking":
        return "Checking Status..."
      default:
        return "Status Unknown"
    }
  }

  return (
    <div className={styles.pluginContainer}>
      {/* Header Section */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.iconWrapper}>
            <Globe className={styles.headerIcon} />
          </div>
          <div>
            <h1 className={styles.title}>Embed Your Chatbot</h1>
            <p className={styles.subtitle}>Integrate your AI chatbot into any website using these simple methods</p>
          </div>
        </div>
      </div>

      {/* Status Card */}
      <div className={styles.statusCard}>
        <div className={styles.statusHeader}>
          <Zap className={styles.statusHeaderIcon} />
          <h3>Live Status</h3>
        </div>
        <div className={styles.statusContent}>
          <div className={styles.statusIndicator}>
            {getStatusIcon()}
            <span
              className={`${styles.statusText} ${
                status === "active"
                  ? styles.statusActive
                  : status === "inactive"
                    ? styles.statusInactive
                    : styles.statusChecking
              }`}
            >
              {getStatusText()}
            </span>
          </div>
          <p className={styles.statusDescription}>Status updates are based on real embed usage via tracking</p>
        </div>
      </div>

      {/* HTML Embed Section */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <Code className={styles.sectionIcon} />
          <div>
            <h2>HTML Embed Code</h2>
            <p>Paste this iframe into any HTML file, blog post, or CMS editor</p>
          </div>
        </div>

        <div className={styles.codeContainer}>
          <pre className={styles.codeBlock}>{iframeSnippet}</pre>
          <button
            className={`${styles.copyBtn} ${copiedIframe ? styles.copied : ""}`}
            onClick={() => copyToClipboard(iframeSnippet, "iframe")}
          >
            <Copy className={styles.copyIcon} />
            {copiedIframe ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      {/* WordPress Plugin Section */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <Download className={styles.sectionIcon} />
          <div>
            <h2>WordPress Plugin</h2>
            <p>Download and install our WordPress plugin for easy integration</p>
          </div>
        </div>

        <div className={styles.pluginSteps}>
          <div className={styles.step}>
            <div className={styles.stepNumber}>1</div>
            <div className={styles.stepContent}>
              <h4>Download Plugin</h4>
              <p>Get the official PlugMind WordPress plugin</p>
              <a href="http://localhost:8000/plugins/plugmind-chat.zip" className={styles.downloadBtn} download>
                <Download className={styles.downloadIcon} />
                Download Plugin
              </a>
            </div>
          </div>

          <div className={styles.step}>
            <div className={styles.stepNumber}>2</div>
            <div className={styles.stepContent}>
              <h4>Install & Activate</h4>
              <p>Upload the plugin to your WordPress admin and activate it</p>
            </div>
          </div>

          <div className={styles.step}>
            <div className={styles.stepNumber}>3</div>
            <div className={styles.stepContent}>
              <h4>Use Shortcode</h4>
              <p>Place your chatbot anywhere using this shortcode:</p>
              <div className={styles.shortcodeContainer}>
                <code className={styles.shortcode}>{wpShortcode}</code>
                <button
                  className={`${styles.copyBtn} ${styles.copyBtnSmall} ${copiedShortcode ? styles.copied : ""}`}
                  onClick={() => copyToClipboard(wpShortcode, "shortcode")}
                >
                  <Copy className={styles.copyIcon} />
                  {copiedShortcode ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Integration Tips */}
      <div className={styles.tipsSection}>
        <h3>💡 Integration Tips</h3>
        <div className={styles.tipsList}>
          <div className={styles.tip}>
            <strong>Responsive Design:</strong> The iframe automatically adjusts to your website's layout
          </div>
          <div className={styles.tip}>
            <strong>Custom Styling:</strong> You can modify the iframe's width and height as needed
          </div>
          <div className={styles.tip}>
            <strong>WordPress:</strong> Use the shortcode in posts, pages, or widget areas
          </div>
          <div className={styles.tip}>
            <strong>Performance:</strong> The chatbot loads asynchronously without affecting page speed
          </div>
        </div>
      </div>
    </div>
  )
}
