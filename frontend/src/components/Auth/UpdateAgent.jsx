"use client"
import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "react-toastify"
import axios from "axios"
import { useParams, useNavigate } from "react-router-dom"
import {
  Bot,
  Settings,
  Upload,
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  FileText,
  MessageSquare,
  Thermometer,
  Hash,
  Brain,
  Trash2,
  Plus,
  ArrowLeft,
} from "lucide-react"
import styles from "./UpdateAgent.module.css"
import "react-toastify/dist/ReactToastify.css"

const steps = [
  { id: "basic", label: "Basic Info", icon: <Bot size={20} /> },
  { id: "settings", label: "Settings", icon: <Settings size={20} /> },
  { id: "documents", label: "Documents", icon: <Upload size={20} /> },
]

// Available models from OpenRouter
const AVAILABLE_MODELS = [
  { id: "mistralai/mistral-7b-instruct:free", name: "Mistral 7B Instruct", description: "Fast and efficient" },
  { id: "meta-llama/llama-2-7b-chat:free", name: "Llama 2 7B Chat", description: "Conversational AI" },
  { id: "google/gemma-7b-it:free", name: "Gemma 7B", description: "Google's model" },
  { id: "anthropic/claude-3-haiku:free", name: "Claude 3 Haiku", description: "Quick responses" },
  { id: "meta-llama/llama-2-13b-chat:free", name: "Llama 2 13B Chat", description: "More capable" },
]

const LoadingAnimation = () => (
  <div className={styles.loadingContainer}>
    <Loader2 className={styles.loadingIcon} size={40} />
    <div className={styles.loadingText}>
      <h3>Updating your agent...</h3>
      <p>This may take a few moments</p>
    </div>
  </div>
)

export default function UpdateAgent() {
  const { type, id } = useParams()
  const navigate = useNavigate()
  const [activeStep, setActiveStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    greeting_message: "Hello! How can I help you today?",
    prompt: "You are a helpful AI assistant.",
    temperature: 0.7,
    model: "mistralai/mistral-7b-instruct:free",
    max_tokens: 2000,
  })
  const [newFiles, setNewFiles] = useState([])
  const [existingFiles, setExistingFiles] = useState([])

  useEffect(() => {
    const fetchAgentData = async () => {
      try {
        const token = localStorage.getItem("access_token")
        const endpoint = type === "chatbot" ? `chatbots/${id}` : `searchbots/${id}`
        const response = await axios.get(`http://localhost:8000/${endpoint}`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        const data = type === "chatbot" ? response.data.chatbot : response.data
        setFormData({
          name: data.name || "",
          description: data.description || "",
          greeting_message: data.greeting_message || "Hello! How can I help you today?",
          prompt: data.prompt || "You are a helpful AI assistant.",
          temperature: data.temperature || 0.7,
          model: data.model || "mistralai/mistral-7b-instruct:free",
          max_tokens: data.max_tokens || 2000,
        })

        if (type === "chatbot" && data.pdf_paths) {
          setExistingFiles(Array.isArray(data.pdf_paths) ? data.pdf_paths : [])
        }
      } catch (error) {
        console.error("Error fetching agent data:", error)
        toast.error("Failed to load agent data")
        navigate("/app/dashboard")
      } finally {
        setInitialLoading(false)
      }
    }

    fetchAgentData()
  }, [id, type, navigate])

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleTemperatureChange = (value) => {
    setFormData((prev) => ({ ...prev, temperature: value }))
  }

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files)
    const validFiles = selected.filter((file) => file.type.includes("pdf") || file.name.endsWith(".xml"))

    if (validFiles.length !== selected.length) {
      toast.error("❌ Only PDF and XML files are allowed.")
    }

    // Check file sizes
    const MAX_SIZE = 5 * 1024 * 1024 // 5MB
    const oversizedFiles = validFiles.filter((file) => file.size > MAX_SIZE)

    if (oversizedFiles.length > 0) {
      toast.error("📄 Some files are too large (max 5MB).")
      return
    }

    setNewFiles((prev) => [...prev, ...validFiles])
  }

  const handleRemoveNewFile = (index) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleRemoveExistingFile = (index) => {
    setExistingFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const handleNext = async () => {
    if (activeStep === 0) {
      if (!formData.name.trim()) {
        toast.error("📝 Agent name is required.")
        return
      }
      if (!formData.description.trim()) {
        toast.error("🗒️ Agent description is required.")
        return
      }
    }

    if (activeStep === steps.length - 1) {
      setLoading(true)
      try {
        const token = localStorage.getItem("access_token")
        const headers = { Authorization: `Bearer ${token}` }

        if (type === "chatbot") {
          const form = new FormData()
          Object.entries(formData).forEach(([key, value]) => {
            form.append(key, value)
          })

          newFiles.forEach((file) => form.append("files", file))
          form.append("existing_files", JSON.stringify(existingFiles))

          await axios.put(`http://localhost:8000/chatbots/${id}`, form, {
            headers: { ...headers, "Content-Type": "multipart/form-data" },
            timeout: 300000,
          })
        } else {
          await axios.put(`http://localhost:8000/searchbots/${id}`, formData, {
            headers,
            timeout: 300000,
          })
        }

        toast.success("✅ Agent updated successfully!")
        navigate("/app/dashboard")
      } catch (err) {
        console.error("❌ Agent update error:", err)
        if (err.code === "ECONNABORTED") {
          toast.error("⏱️ Request timed out. Please try again.")
        } else {
          toast.error("❌ Failed to update agent. Please try again.")
        }
      } finally {
        setLoading(false)
      }
    } else {
      setActiveStep((prev) => prev + 1)
    }
  }

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep((prev) => prev - 1)
    }
  }

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <motion.div
            className={styles.stepContent}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className={styles.sectionHeader}>
              <Bot size={24} />
              <h2>Basic Information</h2>
              <p>Update your agent's basic details</p>
            </div>

            <div className={styles.basicInfoForm}>
              <div className={styles.inputGroup}>
                <label htmlFor="name">
                  <Bot size={18} />
                  Agent Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter a name for your agent"
                  required
                />
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="description">
                  <FileText size={18} />
                  Agent Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe what your agent does and how it helps users"
                  rows={4}
                  required
                />
              </div>
            </div>
          </motion.div>
        )

      case 1:
        return (
          <motion.div
            className={styles.stepContent}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className={styles.sectionHeader}>
              <Settings size={24} />
              <h2>Agent Settings</h2>
              <p>Configure how your agent behaves and responds</p>
            </div>

            <div className={styles.settingsGrid}>
              <div className={styles.inputGroup}>
                <label htmlFor="greeting_message">
                  <MessageSquare size={18} />
                  Greeting Message
                </label>
                <input
                  type="text"
                  id="greeting_message"
                  name="greeting_message"
                  value={formData.greeting_message}
                  onChange={handleChange}
                  placeholder="How should your agent greet users?"
                />
                <span className={styles.inputHint}>This message appears when users first interact with your agent</span>
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="prompt">
                  <Brain size={18} />
                  System Prompt
                </label>
                <textarea
                  id="prompt"
                  name="prompt"
                  value={formData.prompt}
                  onChange={handleChange}
                  placeholder="Define your agent's personality and behavior"
                  rows={4}
                />
                <span className={styles.inputHint}>This prompt defines how your agent should behave and respond</span>
              </div>

              <div className={styles.sliderGroup}>
                <label>
                  <Thermometer size={18} />
                  Temperature: {formData.temperature}
                </label>
                <div className={styles.sliderContainer}>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={formData.temperature}
                    onChange={(e) => handleTemperatureChange(Number.parseFloat(e.target.value))}
                    className={styles.slider}
                  />
                  <div className={styles.sliderLabels}>
                    <span>Focused (0)</span>
                    <span>Balanced (0.5)</span>
                    <span>Creative (1)</span>
                  </div>
                </div>
                <span className={styles.inputHint}>
                  Lower values make responses more focused, higher values more creative
                </span>
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="max_tokens">
                  <Hash size={18} />
                  Max Tokens
                </label>
                <input
                  type="number"
                  id="max_tokens"
                  name="max_tokens"
                  value={formData.max_tokens}
                  onChange={handleChange}
                  min="0"
                  placeholder="Maximum response length"
                />
                <span className={styles.inputHint}>Higher values allow for longer responses</span>
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="model">
                  <Brain size={18} />
                  AI Model
                </label>
                <select
                  id="model"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  className={styles.modelSelect}
                >
                  {AVAILABLE_MODELS.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name} - {model.description}
                    </option>
                  ))}
                </select>
                <span className={styles.inputHint}>Choose the AI model that best fits your needs</span>
              </div>
            </div>
          </motion.div>
        )

      case 2:
        return (
          <motion.div
            className={styles.stepContent}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className={styles.sectionHeader}>
              <Upload size={24} />
              <h2>Document Management</h2>
              <p>Manage your agent's knowledge base</p>
            </div>

            <div className={styles.documentsSection}>
              {/* File Upload */}
              <div className={styles.uploadSection}>
                <div className={styles.uploadArea}>
                  <input
                    type="file"
                    accept=".pdf,.xml"
                    multiple
                    onChange={handleFileChange}
                    className={styles.fileInput}
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className={styles.uploadLabel}>
                    <Plus size={24} />
                    <span>Add New Documents</span>
                    <p>Click to select PDF or XML files (max 5MB each)</p>
                  </label>
                </div>
              </div>

              {/* Existing Files */}
              {existingFiles.length > 0 && (
                <div className={styles.fileSection}>
                  <h3>
                    <FileText size={20} />
                    Current Documents ({existingFiles.length})
                  </h3>
                  <div className={styles.fileList}>
                    {existingFiles.map((file, index) => (
                      <div key={index} className={styles.fileItem}>
                        <div className={styles.fileInfo}>
                          <FileText size={16} />
                          <span className={styles.fileName}>{file}</span>
                        </div>
                        <button
                          className={styles.removeButton}
                          onClick={() => handleRemoveExistingFile(index)}
                          title="Remove file"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Files */}
              {newFiles.length > 0 && (
                <div className={styles.fileSection}>
                  <h3>
                    <Plus size={20} />
                    New Documents ({newFiles.length})
                  </h3>
                  <div className={styles.fileList}>
                    {newFiles.map((file, index) => (
                      <div key={index} className={styles.fileItem}>
                        <div className={styles.fileInfo}>
                          <FileText size={16} />
                          <div className={styles.fileDetails}>
                            <span className={styles.fileName}>{file.name}</span>
                            <span className={styles.fileSize}>{formatFileSize(file.size)}</span>
                          </div>
                        </div>
                        <button
                          className={styles.removeButton}
                          onClick={() => handleRemoveNewFile(index)}
                          title="Remove file"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {existingFiles.length === 0 && newFiles.length === 0 && (
                <div className={styles.emptyState}>
                  <FileText size={48} />
                  <h3>No documents uploaded</h3>
                  <p>Upload PDF or XML files to provide knowledge to your agent</p>
                </div>
              )}
            </div>
          </motion.div>
        )

      default:
        return null
    }
  }

  if (initialLoading) {
    return (
      <div className={styles.updateAgentContainer}>
        <div className={styles.loadingContainer}>
          <Loader2 className={styles.loadingIcon} size={40} />
          <div className={styles.loadingText}>
            <h3>Loading agent data...</h3>
            <p>Please wait while we fetch your agent information</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.updateAgentContainer}>
      <motion.div
        className={styles.headerSection}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <button className={styles.backToList} onClick={() => navigate("/app/dashboard")}>
          <ArrowLeft size={18} />
          <span>Back to Dashboard</span>
        </button>
        <h1 className={styles.pageTitle}>Update Agent</h1>
        <p className={styles.pageSubtitle}>Modify your AI assistant configuration</p>
      </motion.div>

      <motion.div
        className={styles.stepperContainer}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <div className={styles.stepper}>
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`${styles.step} ${index <= activeStep ? styles.active : ""} ${index < activeStep ? styles.completed : ""}`}
            >
              <div className={styles.stepIcon}>{index < activeStep ? <Check size={20} /> : step.icon}</div>
              <div className={styles.stepContent}>
                <span className={styles.stepLabel}>{step.label}</span>
              </div>
              {index < steps.length - 1 && <div className={styles.stepConnector} />}
            </div>
          ))}
        </div>
      </motion.div>

      <div className={styles.contentContainer}>
        <AnimatePresence mode="wait">{renderStepContent()}</AnimatePresence>
      </div>

      <motion.div
        className={styles.navigationContainer}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        {loading ? (
          <LoadingAnimation />
        ) : (
          <div className={styles.navigationButtons}>
            <button
              className={`${styles.navButton} ${styles.backButton}`}
              onClick={handleBack}
              disabled={activeStep === 0}
            >
              <ChevronLeft size={18} />
              <span>Back</span>
            </button>

            <button className={`${styles.navButton} ${styles.nextButton}`} onClick={handleNext}>
              <span>{activeStep === steps.length - 1 ? "Update Agent" : "Next"}</span>
              {activeStep === steps.length - 1 ? <Check size={18} /> : <ChevronRight size={18} />}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  )
}
