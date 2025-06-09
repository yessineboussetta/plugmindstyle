"use client"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import axios from "../../axiosconfig"
import styles from "./AdminDashboard.module.css"
import { toast } from "react-toastify"
import {
  Users,
  UserCheck,
  UserX,
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Calendar,
  Mail,
  User,
  Shield,
  Clock,
  Filter,
  RefreshCw,
  Download,
} from "lucide-react"

export default function AdminDashboard() {
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState("created_at")
  const [sortOrder, setSortOrder] = useState("desc")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [refreshing, setRefreshing] = useState(false)
  const navigate = useNavigate()

  // Calculate statistics
  const totalUsers = users.length
  const verifiedUsers = users.filter((user) => user.is_verified).length
  const unverifiedUsers = totalUsers - verifiedUsers
  const adminUsers = users.filter((user) => user.role === "admin").length
  const newUsersThisMonth = users.filter((user) => {
    const userDate = new Date(user.created_at)
    const now = new Date()
    return userDate.getMonth() === now.getMonth() && userDate.getFullYear() === now.getFullYear()
  }).length

  useEffect(() => {
    fetchUsers()
  }, [navigate])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("access_token")
      if (!token) {
        navigate("/login")
        return
      }
      const response = await axios.get("http://localhost:8000/users", {
        headers: { Authorization: `Bearer ${token}` },
      })
      setUsers(response.data)
      setError("")
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/login")
      } else {
        setError("Failed to fetch users")
        toast.error("Failed to fetch users")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchUsers()
    setRefreshing(false)
    toast.success("User list refreshed")
  }

  const handleExport = () => {
    const csvContent = [
      ["Name", "Email", "Role", "Status", "Created Date"],
      ...filteredUsers.map((user) => [
        `${user.firstname} ${user.lastname}`,
        user.email,
        user.role || "user",
        user.is_verified ? "Verified" : "Unverified",
        new Date(user.created_at).toLocaleDateString(),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "users_export.csv"
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success("User data exported successfully")
  }

  const handleViewUser = (user) => {
    navigate(`/admin/users/${user.id}`)
  }

  const handleToggleVerifiedStatus = async (user) => {
    try {
      const token = localStorage.getItem("access_token")
      if (!token) {
        navigate("/login")
        return
      }

      await axios.put(
        `http://localhost:8000/users/${user.id}`,
        {
          firstname: user.firstname,
          lastname: user.lastname,
          email: user.email,
          is_verified: !user.is_verified,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )

      setUsers((prevUsers) => prevUsers.map((u) => (u.id === user.id ? { ...u, is_verified: !u.is_verified } : u)))
      toast.success(`User ${user.is_verified ? "unverified" : "verified"} successfully`)
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/login")
      } else {
        setError("Failed to toggle verification status")
        toast.error("Failed to toggle verification status")
      }
    }
  }

  const handleEditUser = (userId) => {
    navigate(`/admin/users/${userId}/edit`)
  }

  const handleDeleteUser = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        const token = localStorage.getItem("access_token")
        if (!token) {
          navigate("/login")
          return
        }
        await axios.delete(`http://localhost:8000/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setUsers(users.filter((u) => u.id !== userId))
        toast.success("User deleted successfully")
      } catch (err) {
        if (err.response?.status === 401) {
          navigate("/login")
        } else {
          setError("Failed to delete user")
          toast.error("Failed to delete user")
        }
      }
    }
  }

  const handleNewUser = () => {
    toast.info("New user creation feature not implemented yet.")
  }

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(column)
      setSortOrder("asc")
    }
  }

  // Filter and sort users
  const filteredUsers = users
    .filter((user) => {
      const matchesSearch =
        `${user.firstname} ${user.lastname}`.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase())
      const matchesRole = roleFilter === "all" || user.role === roleFilter || (roleFilter === "user" && !user.role)
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "verified" && user.is_verified) ||
        (statusFilter === "unverified" && !user.is_verified)
      return matchesSearch && matchesRole && matchesStatus
    })
    .sort((a, b) => {
      let aValue, bValue
      switch (sortBy) {
        case "name":
          aValue = `${a.firstname} ${a.lastname}`.toLowerCase()
          bValue = `${b.firstname} ${b.lastname}`.toLowerCase()
          break
        case "email":
          aValue = a.email.toLowerCase()
          bValue = b.email.toLowerCase()
          break
        case "role":
          aValue = a.role || "user"
          bValue = b.role || "user"
          break
        case "created_at":
          aValue = new Date(a.created_at)
          bValue = new Date(b.created_at)
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1
      return 0
    })

  if (error && !users.length) {
    return (
      <div className={styles.adminDashboardContainer}>
        <div className={styles.errorContainer}>
          <div className={styles.errorMessage}>{error}</div>
          <button className={styles.retryButton} onClick={fetchUsers}>
            <RefreshCw size={16} />
            <span>Retry</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.adminDashboardContainer}>
      {/* Header Section */}
      <div className={styles.headerSection}>
        <div className={styles.titleContainer}>
          <h1 className={styles.pageTitle}>User Management</h1>
          <p className={styles.pageSubtitle}>Manage user accounts, permissions, and verification status</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.refreshButton} onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw size={16} className={refreshing ? styles.spinning : ""} />
            <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
          </button>
          <button className={styles.exportButton} onClick={handleExport}>
            <Download size={16} />
            <span>Export CSV</span>
          </button>
          <button className={styles.newUserButton} onClick={handleNewUser}>
            <Plus size={16} />
            <span>New User</span>
          </button>
        </div>
      </div>

      {/* Statistics Section */}
      <div className={styles.statsSection}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <Users size={24} />
          </div>
          <div className={styles.statContent}>
            <h3>Total Users</h3>
            <p>{totalUsers}</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <UserCheck size={24} />
          </div>
          <div className={styles.statContent}>
            <h3>Verified</h3>
            <p>{verifiedUsers}</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <UserX size={24} />
          </div>
          <div className={styles.statContent}>
            <h3>Unverified</h3>
            <p>{unverifiedUsers}</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <Shield size={24} />
          </div>
          <div className={styles.statContent}>
            <h3>Admins</h3>
            <p>{adminUsers}</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <Calendar size={24} />
          </div>
          <div className={styles.statContent}>
            <h3>New This Month</h3>
            <p>{newUsersThisMonth}</p>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className={styles.filterSection}>
        <div className={styles.searchContainer}>
          <Search className={styles.searchIcon} size={18} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search users by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className={styles.filterControls}>
          <div className={styles.filterGroup}>
            <Filter size={16} />
            <span>Role:</span>
            <select className={styles.filterSelect} value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>
          </div>
          <div className={styles.filterGroup}>
            <Filter size={16} />
            <span>Status:</span>
            <select
              className={styles.filterSelect}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="verified">Verified</option>
              <option value="unverified">Unverified</option>
            </select>
          </div>
          <div className={styles.resultsCount}>
            {filteredUsers.length} of {totalUsers} users
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className={styles.tableContainer}>
        {loading ? (
          <div className={styles.loadingState}>
            <RefreshCw className={styles.spinning} size={40} />
            <p>Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className={styles.emptyState}>
            <Users size={48} />
            <h3>No users found</h3>
            <p>
              {search || roleFilter !== "all" || statusFilter !== "all"
                ? "Try adjusting your search or filter criteria."
                : "No users have been created yet."}
            </p>
            {!search && roleFilter === "all" && statusFilter === "all" && (
              <button className={styles.emptyStateButton} onClick={handleNewUser}>
                <Plus size={18} />
                <span>Create First User</span>
              </button>
            )}
          </div>
        ) : (
          <table className={styles.userTable}>
            <thead>
              <tr>
                <th className={styles.avatarColumn}>AVATAR</th>
                <th className={styles.userColumn}>
                  <div className={styles.sortableColumn} onClick={() => handleSort("name")}>
                    <span>USER</span>
                    {sortBy === "name" && <span className={styles.sortIcon}>{sortOrder === "asc" ? "↑" : "↓"}</span>}
                  </div>
                </th>
                <th className={styles.emailColumn}>
                  <div className={styles.sortableColumn} onClick={() => handleSort("email")}>
                    <span>EMAIL</span>
                    {sortBy === "email" && <span className={styles.sortIcon}>{sortOrder === "asc" ? "↑" : "↓"}</span>}
                  </div>
                </th>
                <th className={styles.roleColumn}>
                  <div className={styles.sortableColumn} onClick={() => handleSort("role")}>
                    <span>ROLE</span>
                    {sortBy === "role" && <span className={styles.sortIcon}>{sortOrder === "asc" ? "↑" : "↓"}</span>}
                  </div>
                </th>
                <th className={styles.createdColumn}>
                  <div className={styles.sortableColumn} onClick={() => handleSort("created_at")}>
                    <span>CREATED</span>
                    {sortBy === "created_at" && (
                      <span className={styles.sortIcon}>{sortOrder === "asc" ? "↑" : "↓"}</span>
                    )}
                  </div>
                </th>
                <th className={styles.statusColumn}>STATUS</th>
                <th className={styles.actionsColumn}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className={styles.userAvatar}>{user.firstname ? user.firstname[0].toUpperCase() : "?"}</div>
                  </td>
                  <td>
                    <div className={styles.userName}>
                      {user.firstname} {user.lastname}
                    </div>
                  </td>
                  <td>
                    <div className={styles.userEmail}>
                      <Mail size={14} />
                      <span>{user.email}</span>
                    </div>
                  </td>
                  <td>
                    <div className={`${styles.userRole} ${styles[user.role || "user"]}`}>
                      {user.role === "admin" ? <Shield size={14} /> : <User size={14} />}
                      <span>{user.role || "user"}</span>
                    </div>
                  </td>
                  <td>
                    <div className={styles.userDate}>
                      <Clock size={14} />
                      <span>{user.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A"}</span>
                    </div>
                  </td>
                  <td>
                    <div
                      className={`${styles.userStatus} ${
                        user.is_verified ? styles.statusVerified : styles.statusUnverified
                      }`}
                    >
                      {user.is_verified ? <CheckCircle size={14} /> : <XCircle size={14} />}
                      <span>{user.is_verified ? "Verified" : "Unverified"}</span>
                    </div>
                  </td>
                  <td>
                    <div className={styles.actionButtons}>
                      <button
                        className={`${styles.actionButton} ${styles.viewButton}`}
                        onClick={() => handleViewUser(user)}
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        className={`${styles.actionButton} ${styles.editButton}`}
                        onClick={() => handleEditUser(user.id)}
                        title="Edit User"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        className={`${styles.actionButton} ${
                          user.is_verified ? styles.unverifyButton : styles.verifyButton
                        }`}
                        onClick={() => handleToggleVerifiedStatus(user)}
                        title={user.is_verified ? "Mark Unverified" : "Mark Verified"}
                      >
                        {user.is_verified ? <UserX size={16} /> : <UserCheck size={16} />}
                      </button>
                      {user.role !== "admin" && (
                        <button
                          className={`${styles.actionButton} ${styles.deleteButton}`}
                          onClick={() => handleDeleteUser(user.id)}
                          title="Delete User"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
