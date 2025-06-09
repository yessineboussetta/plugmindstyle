import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import styles from "./VerifyEmail.module.css";

export default function VerifyEmail() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState("Verifying...");
  const [status, setStatus] = useState("loading");

  const hasVerified = useRef(false); // ✅ track whether request already sent

  useEffect(() => {
    const verify = async () => {
      if (!token || hasVerified.current) return;
      hasVerified.current = true; // ✅ block future requests

      try {
        const res = await axios.get(`http://localhost:8000/verify/${token}`);
        setMessage(res.data.message || "✅ Email verified successfully!");
        setStatus("success");
        setTimeout(() => navigate("/login"), 3000);
      } catch (err) {
        console.warn("🔴 Verification error:", err?.response?.data?.detail || err.message);
        setMessage("❌ Invalid or expired token.");
        setStatus("error");
      }
    };

    verify();
  }, [token, navigate]);

  return (
    <div className={styles.container}>
      <div className={`${styles.messageBox} ${styles[status]}`}>
        <h2 className={styles.messageText}>{message}</h2>
        {(status === "success" || status === "error") }
      </div>
    </div>
  );
}
