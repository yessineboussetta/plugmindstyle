import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../axiosconfig';
import styles from './EditUser.module.css';
import { toast } from 'react-toastify';

export default function EditUser() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    email: '',
  });
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
        setFormData({
          firstname: response.data.firstname,
          lastname: response.data.lastname,
          email: response.data.email,
        });
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevFormData => ({
      ...prevFormData,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        navigate('/login');
        return;
      }
      // The backend PUT /users/{user_id} expects UserUpdate model (firstname, lastname, email)
      await axios.put(`http://localhost:8000/users/${userId}`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('User updated successfully');
      navigate('/admin/dashboard'); // Navigate back to admin dashboard
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/login');
      } else {
        setError('Failed to update user');
        toast.error('Failed to update user');
      }
      setLoading(false);
    }
  };

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
    <div className={styles.editUserContainer}>
      <h1 className={styles.title}>Edit User: {user.firstname} {user.lastname}</h1>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="firstname" className={styles.label}>First Name:</label>
          <input
            type="text"
            id="firstname"
            name="firstname"
            value={formData.firstname}
            onChange={handleChange}
            className={styles.input}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="lastname" className={styles.label}>Last Name:</label>
          <input
            type="text"
            id="lastname"
            name="lastname"
            value={formData.lastname}
            onChange={handleChange}
            className={styles.input}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="email" className={styles.label}>Email:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={styles.input}
            required
          />
        </div>

        {/* Password fields are not handled by the existing PUT /users/{user_id} endpoint */}
        {/* You would need a separate endpoint for password changes if required */}
        <p className={styles.note}>Note: Password changes are not supported on this page. Contact the user directly or use a separate process for password resets.</p>

        <button type="submit" className={styles.submitButton} disabled={loading}>
          {loading ? 'Updating...' : 'Update User'}
        </button>
         <button type="button" className={styles.cancelButton} onClick={() => navigate('/admin/dashboard')} disabled={loading}>
          Cancel
        </button>
      </form>
    </div>
  );
} 