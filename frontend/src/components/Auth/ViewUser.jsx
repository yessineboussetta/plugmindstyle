import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../axiosconfig';
import styles from './ViewUser.module.css';
import { toast } from 'react-toastify';

export default function ViewUser() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          navigate('/login');
          return;
        }
        const response = await axios.get(`http://localhost:8000/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(response.data);
        setLoading(false);
      } catch (err) {
        if (err.response?.status === 401) {
          navigate('/login');
        } else {
          setError('Failed to fetch user data');
          toast.error('Failed to fetch user data');
          setLoading(false);
        }
      }
    };

    fetchUser();
  }, [userId, navigate]);

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (error) {
    return <div className={styles.errorMessage}>{error}</div>;
  }

  if (!user) {
    return <div className={styles.noUser}>User not found.</div>;
  }

  return (
    <div className={styles.viewUserContainer}>
      <h1 className={styles.title}>User Details</h1>
      <div className={styles.detailsContainer}>
        <p><span className={styles.label}>ID:</span> {user.id}</p>
        <p><span className={styles.label}>First Name:</span> {user.firstname}</p>
        <p><span className={styles.label}>Last Name:</span> {user.lastname}</p>
        <p><span className={styles.label}>Email:</span> {user.email}</p>
        <p><span className={styles.label}>Role:</span> {user.role || 'N/A'}</p>
        <p><span className={styles.label}>Verified:</span> {user.is_verified ? 'Yes' : 'No'}</p>
        <p><span className={styles.label}>Birth Date:</span> {user.date ? new Date(user.date).toLocaleDateString() : 'N/A'}</p>
        <p><span className={styles.label}>Created At:</span> {user.created_at ? new Date(user.created_at).toLocaleString() : 'N/A'}</p>
        {/* Add more fields as needed */}
      </div>
      <div className={styles.buttonGroup}>
        <button className={styles.backButton} onClick={() => navigate('/admin/dashboard')}>Back to Admin Dashboard</button>
        <button className={styles.editButton} onClick={() => navigate(`/admin/users/${userId}/edit`)}>Edit User</button>
      </div>
    </div>
  );
} 