"use client"
import { motion } from "framer-motion"
import {
  Eye,
  Bot,
  Search,
  MessageSquare,
  FileText,
  Settings,
  Thermometer,
  Hash,
  Brain,
  Database,
  Globe,
  CheckCircle,
  Info,
} from "lucide-react"
import styles from "./CreateAgent.module.css"

export default function AgentPreview({ botType, formData, pdfFiles }) {
  const formatModelName = (modelId) => {
    try {
      return modelId
        .split("/")
        .pop()
        .replace(/-/g, " ")
        .replace(/_/g, " ")
        .replace(":free", "")
        .replace(/\b\w/g, (l) => l.toUpperCase())
    } catch {
      return modelId
    }
  }

  const getTemperatureDescription = (temp) => {
    if (temp < 0.3) return "Focused & Deterministic"
    if (temp > 0.7) return "Creative & Varied"
    return "Balanced & Reliable"
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  }

  return (
    <motion.div className={styles.previewContainer} variants={containerVariants} initial="hidden" animate="visible">
      <div className={styles.sectionHeader}>
        <Eye size={24} />
        <h2>Review & Create</h2>
        <p>Review your agent configuration before creating</p>
      </div>

      {/* Basic Information Section */}
      <motion.div className={styles.previewSection} variants={itemVariants}>
        <div className={styles.previewSectionHeader}>
          <div className={styles.previewSectionIcon}>
            {botType === "chatbot" ? <Bot size={20} /> : <Search size={20} />}
          </div>
          <h3>Basic Information</h3>
        </div>

        <div className={styles.previewGrid}>
          <div className={styles.previewItem}>
            <div className={styles.previewLabel}>
              <Info size={16} />
              <span>Agent Type</span>
            </div>
            <div className={`${styles.previewBadge} ${styles[botType]}`}>
              {botType === "chatbot" ? <MessageSquare size={14} /> : <Search size={14} />}
              {botType === "chatbot" ? "Chatbot" : "Searchbot"}
            </div>
          </div>

          <div className={styles.previewItem}>
            <div className={styles.previewLabel}>
              <FileText size={16} />
              <span>Name</span>
            </div>
            <div className={styles.previewValue}>{formData.name}</div>
          </div>

          <div className={styles.previewItem}>
            <div className={styles.previewLabel}>
              <MessageSquare size={16} />
              <span>Description</span>
            </div>
            <div className={styles.previewValue}>{formData.description}</div>
          </div>
        </div>
      </motion.div>

      {/* Agent Settings Section */}
      <motion.div className={styles.previewSection} variants={itemVariants}>
        <div className={styles.previewSectionHeader}>
          <div className={styles.previewSectionIcon}>
            <Settings size={20} />
          </div>
          <h3>Agent Settings</h3>
        </div>

        <div className={styles.previewGrid}>
          <div className={styles.previewItem}>
            <div className={styles.previewLabel}>
              <MessageSquare size={16} />
              <span>Greeting Message</span>
            </div>
            <div className={styles.previewValue}>{formData.greeting_message}</div>
          </div>

          <div className={styles.previewItem}>
            <div className={styles.previewLabel}>
              <Brain size={16} />
              <span>System Prompt</span>
            </div>
            <div className={styles.previewValue}>{formData.prompt}</div>
          </div>

          <div className={styles.previewItem}>
            <div className={styles.previewLabel}>
              <Thermometer size={16} />
              <span>Temperature</span>
            </div>
            <div className={styles.previewValueWithBadge}>
              <span className={styles.previewValue}>{formData.temperature}</span>
              <span className={styles.previewSubtext}>({getTemperatureDescription(formData.temperature)})</span>
            </div>
          </div>

          <div className={styles.previewItem}>
            <div className={styles.previewLabel}>
              <Hash size={16} />
              <span>Max Tokens</span>
            </div>
            <div className={styles.previewValue}>{formData.max_tokens.toLocaleString()}</div>
          </div>

          <div className={styles.previewItem}>
            <div className={styles.previewLabel}>
              <Brain size={16} />
              <span>AI Model</span>
            </div>
            <div className={styles.previewBadge}>
              <Brain size={14} />
              {formatModelName(formData.model)}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Resources Section */}
      <motion.div className={styles.previewSection} variants={itemVariants}>
        <div className={styles.previewSectionHeader}>
          <div className={styles.previewSectionIcon}>
            {botType === "chatbot" ? <FileText size={20} /> : <Database size={20} />}
          </div>
          <h3>{botType === "chatbot" ? "Documents & Resources" : "Database Configuration"}</h3>
        </div>

        <div className={styles.previewGrid}>
          {botType === "chatbot" && pdfFiles && pdfFiles.length > 0 && (
            <div className={styles.previewItem}>
              <div className={styles.previewLabel}>
                <FileText size={16} />
                <span>Uploaded Files ({pdfFiles.length})</span>
              </div>
              <div className={styles.previewFileList}>
                {pdfFiles.map((file, index) => (
                  <div key={index} className={styles.previewFile}>
                    <FileText size={14} />
                    <div className={styles.previewFileInfo}>
                      <span className={styles.previewFileName}>{file.name}</span>
                      <span className={styles.previewFileSize}>{formatFileSize(file.size)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {formData.website_url && (
            <div className={styles.previewItem}>
              <div className={styles.previewLabel}>
                <Globe size={16} />
                <span>Website URL</span>
              </div>
              <div className={styles.previewValue}>{formData.website_url}</div>
            </div>
          )}

          {botType === "searchbot" && (
            <>
              <div className={styles.previewItem}>
                <div className={styles.previewLabel}>
                  <Database size={16} />
                  <span>Database Host</span>
                </div>
                <div className={styles.previewValue}>{formData.db_host}</div>
              </div>

              <div className={styles.previewItem}>
                <div className={styles.previewLabel}>
                  <Database size={16} />
                  <span>Database Name</span>
                </div>
                <div className={styles.previewValue}>{formData.db_name}</div>
              </div>

              <div className={styles.previewItem}>
                <div className={styles.previewLabel}>
                  <Database size={16} />
                  <span>Database User</span>
                </div>
                <div className={styles.previewValue}>{formData.db_user}</div>
              </div>

              {formData.allowed_tables && formData.allowed_tables.length > 0 && (
                <div className={styles.previewItem}>
                  <div className={styles.previewLabel}>
                    <Database size={16} />
                    <span>Allowed Tables ({formData.allowed_tables.length})</span>
                  </div>
                  <div className={styles.previewTableList}>
                    {formData.allowed_tables.map((table, index) => (
                      <div key={index} className={styles.previewTable}>
                        <Database size={14} />
                        <span>{table}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>

      {/* Summary Section */}
      <motion.div className={styles.previewSummary} variants={itemVariants}>
        <div className={styles.previewSummaryIcon}>
          <CheckCircle size={24} />
        </div>
        <div className={styles.previewSummaryContent}>
          <h3>Ready to Create</h3>
          <p>
            Your {botType} "{formData.name}" is configured and ready to be created. Click "Create Agent" to proceed.
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}
