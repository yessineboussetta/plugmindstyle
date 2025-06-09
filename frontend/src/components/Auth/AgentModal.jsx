"use client"
import { motion } from "framer-motion"
import {
  X,
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
  Calendar,
  Clock,
  Info,
} from "lucide-react"
import styles from "./AgentModal.module.css"

export default function AgentModal({ agent, onClose }) {
  if (!agent) return null

  const formatModelName = (modelId) => {
    try {
      return modelId
        .replace(":free", "")
        .split("/")
        .pop()
        .replace(/-/g, " ")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase())
    } catch {
      return modelId
    }
  }

  const getPdfPaths = () => {
    if (!agent.pdf_paths) return []

    // Handle string case
    if (typeof agent.pdf_paths === "string") {
      return agent.pdf_paths.split(",")
    }

    // Handle array case
    if (Array.isArray(agent.pdf_paths)) {
      return agent.pdf_paths
    }

    // Handle single path case
    return [agent.pdf_paths]
  }

  const getFileName = (path) => {
    try {
      return path.split("/").pop()
    } catch {
      return path
    }
  }

  const getTemperatureDescription = (temp) => {
    if (temp < 0.3) return "Focused & Deterministic"
    if (temp > 0.7) return "Creative & Varied"
    return "Balanced & Reliable"
  }

  const formatFileSize = (path) => {
    // This is a placeholder since we don't have file size info
    return "PDF Document"
  }

  return (
    <motion.div
      className={styles.modalOverlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClose}
    >
      <motion.div
        className={styles.modalBox}
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <div className={styles.agentTypeIcon}>
            {agent.type === "chatbot" ? <Bot size={24} /> : <Search size={24} />}
          </div>
          <div className={styles.headerContent}>
            <h2 className={styles.agentName}>{agent.name}</h2>
            <div className={`${styles.agentBadge} ${styles[agent.type]}`}>
              {agent.type === "chatbot" ? <MessageSquare size={14} /> : <Search size={14} />}
              {agent.type === "chatbot" ? "Chatbot" : "Searchbot"}
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.modalContent}>
          {/* Basic Information Section */}
          <motion.div
            className={styles.section}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIcon}>
                <Info size={20} />
              </div>
              <h3>Basic Information</h3>
            </div>

            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <div className={styles.infoLabel}>
                  <FileText size={16} />
                  <span>Description</span>
                </div>
                <div className={styles.infoValue}>{agent.description}</div>
              </div>

              {agent.type === "chatbot" && (
                <>
                  <div className={styles.infoItem}>
                    <div className={styles.infoLabel}>
                      <MessageSquare size={16} />
                      <span>Greeting Message</span>
                    </div>
                    <div className={styles.infoValue}>{agent.greeting_message}</div>
                  </div>

                  <div className={styles.infoItem}>
                    <div className={styles.infoLabel}>
                      <Brain size={16} />
                      <span>System Prompt</span>
                    </div>
                    <div className={styles.infoValue}>{agent.prompt}</div>
                  </div>
                </>
              )}
            </div>
          </motion.div>

          {/* Agent Settings Section */}
          {agent.type === "chatbot" && (
            <motion.div
              className={styles.section}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon}>
                  <Settings size={20} />
                </div>
                <h3>Agent Settings</h3>
              </div>

              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <div className={styles.infoLabel}>
                    <Brain size={16} />
                    <span>AI Model</span>
                  </div>
                  <div className={styles.infoBadge}>
                    <Brain size={14} />
                    {formatModelName(agent.model)}
                  </div>
                </div>

                <div className={styles.infoItem}>
                  <div className={styles.infoLabel}>
                    <Thermometer size={16} />
                    <span>Temperature</span>
                  </div>
                  <div className={styles.infoValueWithBadge}>
                    <span className={styles.infoValue}>{agent.temperature}</span>
                    <span className={styles.infoSubtext}>({getTemperatureDescription(agent.temperature)})</span>
                  </div>
                </div>

                <div className={styles.infoItem}>
                  <div className={styles.infoLabel}>
                    <Hash size={16} />
                    <span>Max Tokens</span>
                  </div>
                  <div className={styles.infoValue}>{agent.max_tokens?.toLocaleString()}</div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Files Section */}
          {agent.type === "chatbot" && getPdfPaths().length > 0 && (
            <motion.div
              className={styles.section}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon}>
                  <FileText size={20} />
                </div>
                <h3>Documents ({getPdfPaths().length})</h3>
              </div>

              <div className={styles.fileList}>
                {getPdfPaths().map((path, index) => (
                  <div key={index} className={styles.fileItem}>
                    <FileText size={16} />
                    <div className={styles.fileInfo}>
                      <span className={styles.fileName}>{getFileName(path)}</span>
                      <span className={styles.fileType}>{formatFileSize(path)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Website Section */}
          {agent.website_url && (
            <motion.div
              className={styles.section}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon}>
                  <Globe size={20} />
                </div>
                <h3>Website Source</h3>
              </div>

              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <div className={styles.infoLabel}>
                    <Globe size={16} />
                    <span>URL</span>
                  </div>
                  <a href={agent.website_url} target="_blank" rel="noopener noreferrer" className={styles.infoLink}>
                    {agent.website_url}
                  </a>
                </div>
              </div>
            </motion.div>
          )}

          {/* Database Information Section */}
          {agent.type === "searchbot" && (
            <motion.div
              className={styles.section}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon}>
                  <Database size={20} />
                </div>
                <h3>Database Configuration</h3>
              </div>

              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <div className={styles.infoLabel}>
                    <Database size={16} />
                    <span>Host</span>
                  </div>
                  <div className={styles.infoValue}>{agent.db_host}</div>
                </div>

                <div className={styles.infoItem}>
                  <div className={styles.infoLabel}>
                    <Database size={16} />
                    <span>Database</span>
                  </div>
                  <div className={styles.infoValue}>{agent.db_name}</div>
                </div>

                {agent.allowed_tables && (
                  <div className={styles.infoItem}>
                    <div className={styles.infoLabel}>
                      <Database size={16} />
                      <span>Allowed Tables</span>
                    </div>
                    <div className={styles.tableList}>
                      {(typeof agent.allowed_tables === "string"
                        ? agent.allowed_tables.split(",")
                        : Array.isArray(agent.allowed_tables)
                          ? agent.allowed_tables
                          : []
                      ).map((table, index) => (
                        <div key={index} className={styles.tableChip}>
                          <Database size={12} />
                          <span>{table.trim()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Timestamps Section */}
          <motion.div
            className={styles.section}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
          >
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIcon}>
                <Clock size={20} />
              </div>
              <h3>Timeline</h3>
            </div>

            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <div className={styles.infoLabel}>
                  <Calendar size={16} />
                  <span>Created</span>
                </div>
                <div className={styles.infoValue}>{new Date(agent.created_at).toLocaleString()}</div>
              </div>

              <div className={styles.infoItem}>
                <div className={styles.infoLabel}>
                  <Clock size={16} />
                  <span>Last Updated</span>
                </div>
                <div className={styles.infoValue}>{new Date(agent.updated_at).toLocaleString()}</div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  )
}
