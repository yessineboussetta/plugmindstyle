"use client"
import { useEffect, useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import axios from "axios"
import styles from "./Dashboard.module.css"
import { toast } from "react-toastify"
import AgentModal from "./AgentModal"
import { motion } from "framer-motion"
import {
  Eye,
  Edit,
  Trash2,
  FlaskRoundIcon as Flask,
  Puzzle,
  Layers,
  Bot,
  Search,
  Plus,
  AlertCircle,
  Loader2,
  Filter,
} from "lucide-react"
import "react-toastify/dist/ReactToastify.css"
import EmbeddedChat from "./EmbeddedChat"
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from "@mui/material"

export default function Dashboard() {
  const [agents, setAgents] = useState([])
  const [search, setSearch] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [selectedAgent, setSelectedAgent] = useState(null)
  const [showChat, setShowChat] = useState(false)
  const [selectedChatbotId, setSelectedChatbotId] = useState(null)
  const [selectedChatbotName, setSelectedChatbotName] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [agentToDelete, setAgentToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        setIsLoading(true)
        const token = localStorage.getItem("access_token")
        if (!token) return navigate("/login")
        const headers = { Authorization: `Bearer ${token}` }

        const [chatbotRes, searchbotRes] = await Promise.all([
          axios.get("http://localhost:8000/chatbots", { headers }),
          axios.get("http://localhost:8000/searchbots", { headers }),
        ])

        const chatbots = chatbotRes.data.map((bot) => ({ ...bot, type: "chatbot" }))
        const searchbots = searchbotRes.data.map((bot) => ({ ...bot, type: "searchbot" }))

        setAgents([...chatbots, ...searchbots])
      } catch (error) {
        console.error("Error fetching agents:", error)
        toast.error("Failed to fetch agents")
        if (error.response?.status === 401) {
          navigate("/login")
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchAgents()
  }, [navigate, location.pathname])

  const handleCreateAgent = () => navigate("/app/create-agent")
  const handleUpdateAgent = (a) => navigate(`/app/update/${a.type}/${a.id}`)
  const handleViewAgent = (a) => setSelectedAgent(a)
  const handleDeleteClick = (agent) => {
    setAgentToDelete(agent)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!agentToDelete) return

    setIsDeleting(true)
    try {
      const token = localStorage.getItem("access_token")
      const endpoint =
        agentToDelete.type === "chatbot"
          ? `http://localhost:8000/chatbots/${agentToDelete.id}`
          : `http://localhost:8000/searchbots/${agentToDelete.id}`

      await axios.delete(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      })

      // Remove the deleted agent from the state
      setAgents(agents.filter((a) => a.id !== agentToDelete.id))
      toast.success("✅ Agent deleted successfully")
    } catch (error) {
      console.error("Error deleting agent:", error)
      toast.error("❌ Failed to delete agent")
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setAgentToDelete(null)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false)
    setAgentToDelete(null)
  }

  const handleTestChatbot = (agent) => {
    setSelectedChatbotId(String(agent.id))
    setSelectedChatbotName(agent.name)
    setShowChat(true)
  }

  const byType = filterType === "all" ? agents : agents.filter((a) => a.type === filterType)
  const filtered = byType.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()))

  const chatbotCount = agents.filter((a) => a.type === "chatbot").length
  const searchbotCount = agents.filter((a) => a.type === "searchbot").length

  // Animation variants
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
    <div className={styles.dashboardContainer}>
      {/* Header Section */}
      <motion.div
        className={styles.headerSection}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className={styles.titleContainer}>
          <h1 className={styles.pageTitle}>Agent Dashboard</h1>
          <p className={styles.pageSubtitle}>Manage and monitor your AI agents</p>
        </div>

        <div className={styles.headerActions}>
          <div className={styles.searchContainer}>
            <Search className={styles.searchIcon} size={18} />
            <input
              type="text"
              placeholder="Search agents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          <button className={styles.createButton} onClick={handleCreateAgent}>
            <Plus size={18} />
            <span>Create Agent</span>
          </button>
        </div>
      </motion.div>

      {/* Stats Section */}
      <motion.div
        className={styles.statsSection}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <Layers size={24} />
          </div>
          <div className={styles.statContent}>
            <h3>Total Agents</h3>
            <p>{agents.length}</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <Bot size={24} />
          </div>
          <div className={styles.statContent}>
            <h3>Chatbots</h3>
            <p>{chatbotCount}</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <Search size={24} />
          </div>
          <div className={styles.statContent}>
            <h3>Searchbots</h3>
            <p>{searchbotCount}</p>
          </div>
        </div>
      </motion.div>

      {/* Filter Section */}
      <motion.div
        className={styles.filterSection}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className={styles.filterHeader}>
          <Filter size={18} />
          <span>Filter by Type</span>
        </div>
        <div className={styles.filterTabs}>
          {[
            { key: "all", label: "All Agents", icon: <Layers size={16} /> },
            { key: "chatbot", label: "Chatbots", icon: <Bot size={16} /> },
            { key: "searchbot", label: "Searchbots", icon: <Search size={16} /> },
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              className={`${styles.filterTab} ${filterType === key ? styles.activeTab : ""}`}
              onClick={() => setFilterType(key)}
            >
              {icon}
              <span>{label}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Content Section */}
      <div className={styles.contentSection}>
        {isLoading ? (
          <div className={styles.loadingState}>
            <Loader2 className={styles.loadingIcon} size={40} />
            <p>Loading agents...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <AlertCircle size={48} />
            <h3>No agents found</h3>
            <p>
              {search
                ? "Try adjusting your search or filter criteria."
                : "Get started by creating your first AI agent."}
            </p>
            {!search && (
              <button className={styles.emptyStateButton} onClick={handleCreateAgent}>
                <Plus size={18} />
                <span>Create Your First Agent</span>
              </button>
            )}
          </div>
        ) : (
          <motion.div className={styles.agentGrid} variants={containerVariants} initial="hidden" animate="visible">
            {filtered.map((agent) => (
              <motion.div
                key={agent.id}
                className={styles.agentCard}
                variants={itemVariants}
                whileHover={{ y: -5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.agentInfo}>
                    <h3 className={styles.agentName}>{agent.name}</h3>
                    <span className={`${styles.agentBadge} ${styles[agent.type]}`}>
                      {agent.type === "chatbot" ? <Bot size={14} /> : <Search size={14} />}
                      {agent.type === "chatbot" ? "Chatbot" : "Searchbot"}
                    </span>
                  </div>
                </div>

                <p className={styles.agentDescription}>
                  {agent.description?.length > 120
                    ? agent.description.slice(0, 120) + "..."
                    : agent.description || "No description provided."}
                </p>

                <div className={styles.cardActions}>
                  <div className={styles.primaryActions}>
                    <button
                      className={`${styles.actionBtn} ${styles.viewBtn}`}
                      onClick={() => handleViewAgent(agent)}
                      title="View Details"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      className={`${styles.actionBtn} ${styles.editBtn}`}
                      onClick={() => handleUpdateAgent(agent)}
                      title="Edit Agent"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      className={`${styles.actionBtn} ${styles.deleteBtn}`}
                      onClick={() => handleDeleteClick(agent)}
                      title="Delete Agent"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {agent.type === "chatbot" && (
                    <div className={styles.secondaryActions}>
                      <button
                        className={`${styles.actionBtn} ${styles.testBtn}`}
                        onClick={() => handleTestChatbot(agent)}
                        title="Test Chatbot"
                      >
                        <Flask size={16} />
                        <span>Test</span>
                      </button>
                      <button
                        className={`${styles.actionBtn} ${styles.pluginBtn}`}
                        onClick={() => navigate(`/app/chatbots/${agent.id}/plugin`)}
                        title="Get Plugin"
                      >
                        <Puzzle size={16} />
                        <span>Plugin</span>
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {selectedAgent && <AgentModal agent={selectedAgent} onClose={() => setSelectedAgent(null)} />}

      {showChat && (
        <div className={styles.chatOverlay}>
          <EmbeddedChat
            chatbotId={selectedChatbotId}
            chatbotName={selectedChatbotName}
            onClose={() => setShowChat(false)}
          />
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
        PaperProps={{
          style: {
            backgroundColor: "#1e1e2f",
            color: "#e2e8f0",
            borderRadius: "16px",
          },
        }}
      >
        <DialogTitle id="delete-dialog-title" style={{ color: "#e2e8f0" }}>
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <div id="delete-dialog-description">
            <Typography component="div" style={{ color: "#e2e8f0" }}>
              Are you sure you want to delete the agent "{agentToDelete?.name}"? This action cannot be undone.
            </Typography>
            {agentToDelete?.type === "chatbot" && (
              <Typography component="div" variant="body2" style={{ color: "#94a3b8", marginTop: "8px" }}>
                This will also delete all associated documents and embeddings.
              </Typography>
            )}
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} style={{ color: "#94a3b8" }} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            style={{
              backgroundColor: "rgba(239, 68, 68, 0.2)",
              color: "#ef4444",
              borderRadius: "8px",
            }}
            disabled={isDeleting}
            startIcon={isDeleting ? <Loader2 className={styles.spinAnimation} size={16} /> : null}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}
