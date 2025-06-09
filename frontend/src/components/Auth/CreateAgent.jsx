"use client"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import axios from "axios"
import { toast } from "react-toastify"
import { useNavigate } from "react-router-dom"
import {
  Bot,
  Search,
  Settings,
  Upload,
  Eye,
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  FileText,
  Database,
  MessageSquare,
  Thermometer,
  Hash,
  Brain,
} from "lucide-react"
import styles from "./CreateAgent.module.css"
import FileUpload from "./FileUpload"
import AgentPreview from "./AgentPreview"
import TableSelector from "./TableSelector"
import "react-toastify/dist/ReactToastify.css"

const chatbotSteps = [
  { id: "basic", label: "Basic Info", icon: <Bot size={20} /> },
  { id: "settings", label: "Settings", icon: <Settings size={20} /> },
  { id: "resources", label: "Resources", icon: <Upload size={20} /> },
  { id: "review", label: "Review & Create", icon: <Eye size={20} /> },
]

const searchbotSteps = [
  { id: "basic", label: "Basic Info", icon: <Search size={20} /> },
  { id: "settings", label: "Settings", icon: <Settings size={20} /> },
  { id: "resources", label: "Database", icon: <Database size={20} /> },
  { id: "review", label: "Review & Create", icon: <Eye size={20} /> },
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
      <h3>Creating your agent...</h3>
      <p>This may take a few moments</p>
    </div>
  </div>
)

export default function CreateAgent() {
  const [activeStep, setActiveStep] = useState(0)
  const [botType, setBotType] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    greeting_message: "Hello! How can I help you today?",
    prompt: "You are a helpful AI assistant.",
    temperature: 0.7,
    model: "mistralai/mistral-7b-instruct:free",
    max_tokens: 2000,
    db_host: "",
    db_name: "",
    db_user: "",
    db_pass: "",
    allowed_tables: [],
    website_url: "",
  })

  const [pdfFiles, setPdfFiles] = useState([])
  const [dbTables, setDbTables] = useState([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const steps = botType === "searchbot" ? searchbotSteps : chatbotSteps

  const handleChange = (e) => setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const handleTemperatureChange = (value) => {
    setFormData((prev) => ({ ...prev, temperature: value }))
  }

  const validateDBConnection = async () => {
    try {
      const token = localStorage.getItem("access_token")
      const headers = { Authorization: `Bearer ${token}` }
      await axios.post(
        "http://localhost:8000/connect-database",
        {
          db_host: formData.db_host,
          db_name: formData.db_name,
          db_user: formData.db_user,
          db_pass: formData.db_pass,
        },
        { headers },
      )
      return true
    } catch {
      toast.error("❌ Connection failed: Could not connect to database.")
      return false
    }
  }

  const fetchTables = async () => {
    try {
      const token = localStorage.getItem("access_token")
      const headers = { Authorization: `Bearer ${token}` }
      const res = await axios.post(
        "http://localhost:8000/fetch-tables",
        {
          db_host: formData.db_host,
          db_name: formData.db_name,
          db_user: formData.db_user,
          db_pass: formData.db_pass,
        },
        { headers },
      )

      if (res.data?.tables?.length) {
        setDbTables(res.data.tables)
      } else {
        toast.error("⚠️ No tables found in the database.")
      }
    } catch {
      toast.error("❌ Failed to fetch tables. Check DB permissions.")
    }
  }

  const handleNext = async () => {
    if (activeStep === 0 && !botType) {
      toast.error("❗ Please select an agent type.")
      return
    }

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

    if (activeStep === 2 && botType === "chatbot") {
      if (!pdfFiles.length) {
        toast.error("📎 Please upload at least one PDF file.")
        return
      }

      for (const file of pdfFiles) {
        const isPDF = file.type.includes("pdf")
        const isXML = file.type.includes("xml") || file.name.endsWith(".xml")

        if (!isPDF && !isXML) {
          toast.error("❌ Please upload valid PDF or XML files only.")
          return
        }
      }

      const MAX_SIZE = 5 * 1024 * 1024 // 5MB
      const WARNING_SIZE = 3 * 1024 * 1024 // 3MB

      for (const file of pdfFiles) {
        if (file.size > MAX_SIZE) {
          toast.error("📄 File is too large (max 5MB).")
          return
        }

        if (file.size > WARNING_SIZE) {
          toast.warning("⚠️ Large file detected. Processing may take longer than usual.")
        }
      }
    }

    if (activeStep === 2 && botType === "searchbot") {
      const required = ["db_host", "db_name", "db_user", "db_pass"]
      for (const key of required) {
        if (!formData[key]) {
          toast.error(`❗ Please fill in ${key.replace("_", " ")}`)
          return
        }
      }
      if (!(await validateDBConnection())) return
      await fetchTables()
    }

    if (botType === "searchbot" && activeStep === 2 && !formData.allowed_tables.length) {
      toast.error("❗ Please select at least one table.")
      return
    }

    if (activeStep === steps.length - 1) {
      setLoading(true)
      try {
        const token = localStorage.getItem("access_token")
        const headers = { Authorization: `Bearer ${token}` }

        if (botType === "chatbot") {
          const form = new FormData()
          form.append("name", formData.name)
          form.append("description", formData.description)
          form.append("greeting_message", formData.greeting_message)
          form.append("prompt", formData.prompt)
          form.append("temperature", formData.temperature)
          form.append("model", formData.model)

          pdfFiles.forEach((file) => form.append("files", file))

          if (formData.website_url) {
            form.append("website_url", formData.website_url)
          }

          const response = await axios.post("http://localhost:8000/chatbot/pdf", form, {
            headers,
            timeout: 300000,
          })
          if (response.data?.status === "partial_success") {
            toast.warning("⚠️ Agent created but PDF processing is still in progress.")
            navigate("/app/dashboard")
            return
          }
        } else if (botType === "searchbot") {
          await axios.post("http://localhost:8000/searchbot", formData, {
            headers,
            timeout: 300000,
          })
        }

        toast.success("✅ Agent created successfully!")
        navigate("/app/dashboard")
        return
      } catch (err) {
        console.error("❌ Agent creation error:", err)

        if (err.code === "ECONNABORTED") {
          toast.error("⏱️ Request timed out. The file might be too large or taking too long to process.")
        } else if (err.response?.status === 413) {
          toast.error("📄 File is too large. Please try a smaller file.")
        } else if (err.response?.status === 500) {
          if (err.response?.data?.error?.includes("timeout")) {
            toast.warning("⚠️ Agent created but processing timed out. You can use it once processing is complete.")
            navigate("/app/dashboard")
            return
          }
          toast.error("❌ Server error occurred. Please try again later.")
        } else {
          toast.error("❌ Failed to create agent. Please try again.")
        }
      } finally {
        setLoading(false)
      }
    } else {
      setActiveStep((prev) => prev + 1)
    }
  }

  const handleBack = () => setActiveStep((prev) => prev - 1)

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
              <h2>Choose Agent Type</h2>
              <p>Select the type of AI agent you want to create</p>
            </div>

            <div className={styles.agentTypeSelector}>
              <div
                className={`${styles.agentTypeCard} ${botType === "chatbot" ? styles.selected : ""}`}
                onClick={() => setBotType("chatbot")}
              >
                <div className={styles.agentTypeIcon}>
                  <MessageSquare size={32} />
                </div>
                <h3>Chatbot</h3>
                <p>Create an AI assistant that can answer questions based on your documents</p>
                <div className={styles.agentTypeFeatures}>
                  <span>
                    <FileText size={16} /> Document-based
                  </span>
                  <span>
                    <MessageSquare size={16} /> Conversational
                  </span>
                </div>
              </div>

              <div
                className={`${styles.agentTypeCard} ${botType === "searchbot" ? styles.selected : ""}`}
                onClick={() => setBotType("searchbot")}
              >
                <div className={styles.agentTypeIcon}>
                  <Database size={32} />
                </div>
                <h3>Searchbot</h3>
                <p>Create an AI that can query and analyze your database</p>
                <div className={styles.agentTypeFeatures}>
                  <span>
                    <Database size={16} /> Database-powered
                  </span>
                  <span>
                    <Search size={16} /> Query-based
                  </span>
                </div>
              </div>
            </div>

            {botType && (
              <motion.div
                className={styles.basicInfoForm}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
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
              </motion.div>
            )}
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
            <FileUpload
              botType={botType}
              pdfFile={pdfFiles}
              setPdfFile={setPdfFiles}
              formData={formData}
              handleChange={handleChange}
            />

            {botType === "searchbot" && (
              <TableSelector
                tables={dbTables}
                onConfirm={(selected) => {
                  setFormData((prev) => ({ ...prev, allowed_tables: selected }))
                }}
              />
            )}
          </motion.div>
        )

      case 3:
        return (
          <motion.div
            className={styles.stepContent}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <AgentPreview botType={botType} formData={formData} pdfFiles={pdfFiles} />
          </motion.div>
        )

      default:
        return null
    }
  }

  return (
    <div className={styles.createAgentContainer}>
      <motion.div
        className={styles.headerSection}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className={styles.pageTitle}>Create New Agent</h1>
        <p className={styles.pageSubtitle}>Build your AI assistant in just a few steps</p>
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
              <span>{activeStep === steps.length - 1 ? "Create Agent" : "Next"}</span>
              {activeStep === steps.length - 1 ? <Check size={18} /> : <ChevronRight size={18} />}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  )
}
