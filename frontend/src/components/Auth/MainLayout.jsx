"use client"
import { Outlet } from "react-router-dom"
import Sidebar from "./Sidebar.jsx"
import styles from "./MainLayout.module.css"

export default function MainLayout() {
  return (
    <div className={styles.layout}>
      {/* Background Pattern */}
      <div className={styles.backgroundPattern}></div>

      {/* Sidebar */}
      <div className={styles.sidebarWrapper}>
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <main className={styles.mainContent}>
        <div className={styles.contentWrapper}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
