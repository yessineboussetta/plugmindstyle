import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './UserEdit.css';

export default function UserEdit() {
  const [formData, setFormData] = useState({ firstname: '', lastname: '', email: '' });
  const [error, setError] = useState('');
  const { userId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('admin_access_token');
        if (!token) {
          navigate('/admin/login');
          return;
        }
        const response = await axios.get(`http://localhost:8000/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFormData({
          firstname: response.data.firstname,
          lastname: response.data.lastname,
          email: response.data.email,
        });
      } catch (err) {
        setError('Failed to fetch user');
        if (err.response?.status === 401) {
          navigate('/admin/dashboard');
        }
      }
    };
    fetchUser();
  }, [userId, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.firstname || !formData.lastname || !formData.email) {
      setError('Please fill in all fields');
      return;
    }
    try {
      const token = localStorage.getItem('admin_access_token');
      if (!token) {
        navigate('/admin/dashboard');
        return;
      }
      await axios.put(`http://localhost:8000/users/${userId}`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Error updating user');
    }
  };

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="user-edit-container">
      <h2>Edit User</h2>
      <form className="user-edit-form" onSubmit={handleSubmit}>
        <div className="input-group">
          <label htmlFor="firstname">First Name</label>
          <input
            type="text"
            id="firstname"
            name="firstname"
            value={formData.firstname}
            onChange={handleChange}
            required
          />
        </div>
        <div className="input-group">
          <label htmlFor="lastname">Last Name</label>
          <input
            type="text"
            id="lastname"
            name="lastname"
            value={formData.lastname}
            onChange={handleChange}
            required
          />
        </div>
        <div className="input-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        {error && <p className="error">{error}</p>}
        <button type="submit" className="btn">Update User</button>
      </form>
    </div>
  );
}