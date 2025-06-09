import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../axiosconfig';
import styles from './AdminDashboard.module.css'; // reuse same module

export default function UserDetail() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [chatbots, setChatbots] = useState([]);
  const [searchbots, setSearchbots] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const headers = { Authorization: `Bearer ${token}` };

        const [userRes, chatbotsRes, searchbotsRes] = await Promise.all([
          axios.get(`http://localhost:8000/users/${userId}`, { headers }),
          axios.get(`http://localhost:8000/chatbots?user_id=${userId}`, { headers }),
          axios.get(`http://localhost:8000/searchbots?user_id=${userId}`, { headers }),
        ]);

        setUser(userRes.data);
        setChatbots(chatbotsRes.data || []);
        setSearchbots(searchbotsRes.data || []);
      } catch (err) {
        console.error(err);
        if (err.response?.status === 401) {
          navigate('/login');
        } else {
          setError('Failed to load user details');
        }
      }
    };
    fetchUserDetails();
  }, [userId, navigate]);

  const formatDate = (date) =>
    date ? new Date(date).toLocaleDateString() : '—';

  const getLatestUpdate = (items) => {
    if (items.length === 0) return '—';
    const latest = items.reduce((a, b) =>
      new Date(a.updated_at) > new Date(b.updated_at) ? a : b
    );
    return formatDate(latest.updated_at);
  };

  if (error) return <div className={styles.errorMessage}>{error}</div>;
  if (!user) return <div className={styles.dashboardTitle}>Loading...</div>;

  return (
    <div className={styles.adminDashboardContainer}>
      <h1 className={styles.dashboardTitle}>
        Stats for {user.firstname} {user.lastname}
      </h1>

      <div className={styles.userItem}>
        <div className={styles.userInfo}>
          <div className={styles.userName}>{user.firstname} {user.lastname}</div>
          <div className={styles.userEmail}>Email: {user.email}</div>
          <div className={styles.userDate}>Registered: {formatDate(user.date)}</div>
        </div>
      </div>

      <div className={styles.userList}>
        <div className={styles.userItem}>
          <div>
            <h3>Total Chatbots:</h3>
            <p>{chatbots.length}</p>
          </div>
          <div>
            <h3>Last Chatbot Update:</h3>
            <p>{getLatestUpdate(chatbots)}</p>
          </div>
        </div>

        <div className={styles.userItem}>
          <div>
            <h3>Total Searchbots:</h3>
            <p>{searchbots.length}</p>
          </div>
          <div>
            <h3>Last Searchbot Update:</h3>
            <p>{getLatestUpdate(searchbots)}</p>
          </div>
        </div>
      </div>

      <button className={`${styles.btn}`} onClick={() => navigate('/admin/dashboard')}>
        ⬅ Back to Dashboard
      </button>
    </div>
  );
}
