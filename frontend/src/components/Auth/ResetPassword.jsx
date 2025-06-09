import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import styles from './ResetPassword.module.css';
import logo from '../../assets/logo.png';
import 'react-toastify/dist/ReactToastify.css';
import { FaCheck, FaTimes } from 'react-icons/fa';

export default function ResetPassword() {
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: '',
    isValid: false
  });
  const [passwordsMatch, setPasswordsMatch] = useState(null);
  const navigate = useNavigate();
  const { token } = useParams();

  const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    let score = 0;
    let feedback = [];

    if (password.length >= minLength) score += 1;
    else feedback.push('Password must be at least 8 characters long');

    if (hasUpperCase) score += 1;
    else feedback.push('Include at least one uppercase letter');

    if (hasLowerCase) score += 1;
    else feedback.push('Include at least one lowercase letter');

    if (hasNumbers) score += 1;
    else feedback.push('Include at least one number');

    if (hasSpecialChar) score += 1;
    else feedback.push('Include at least one special character');

    return {
      score,
      feedback: feedback.join('. '),
      isValid: score >= 4 // Require at least 4 out of 5 criteria
    };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'newPassword') {
      const strength = validatePassword(value);
      setPasswordStrength(strength);
      // Check password match when password changes
      if (formData.confirmPassword) {
        setPasswordsMatch(value === formData.confirmPassword);
      }
    } else if (name === 'confirmPassword') {
      // Check password match when confirm password changes
      setPasswordsMatch(value === formData.newPassword);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    const passwordValidation = validatePassword(formData.newPassword);
    if (!passwordValidation.isValid) {
      toast.error('Password is not strong enough. ' + passwordValidation.feedback);
      return;
    }

    if (formData.oldPassword.length < 6) {
      toast.error('Please enter your old password');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          old_password: formData.oldPassword,
          new_password: formData.newPassword
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data?.detail || 'Failed to reset password';
        console.error('Reset password error:', errorMessage);
        toast.error(errorMessage);
        return;
      }

      toast.success('Password has been reset successfully');
      navigate('/login');
    } catch (error) {
      console.error('Error:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = () => {
    return (
      formData.oldPassword &&
      formData.newPassword &&
      formData.confirmPassword &&
      passwordsMatch &&
      passwordStrength.isValid
    );
  };

  return (
    <div className={styles.resetPasswordContainer}>
      <motion.form
        className={styles.resetPasswordForm}
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <div className={styles.logoContainer}>
          <img src={logo} alt="Plugmind Logo" className={styles.logo} />
          <h1 className={styles.websiteName}>Plugmind</h1>
        </div>

        <h2 className={styles.formTitle}>Set New Password</h2>
        <p className={styles.description}>
          Please enter your old password and your new password below.
        </p>

        <div className={styles.inputGroup}>
          <label htmlFor="oldPassword">Old Password</label>
          <input
            type="password"
            id="oldPassword"
            name="oldPassword"
            value={formData.oldPassword}
            onChange={handleChange}
            required
            minLength={6}
          />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="newPassword">New Password</label>
          <input
            type="password"
            id="newPassword"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleChange}
            required
            minLength={8}
          />
          {formData.newPassword && (
            <div className={styles.passwordStrength}>
              <div className={styles.strengthMeter}>
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={`${styles.strengthSegment} ${
                      i < passwordStrength.score ? styles.strong : ''
                    }`}
                  />
                ))}
              </div>
              {passwordStrength.feedback && (
                <p className={styles.strengthFeedback}>{passwordStrength.feedback}</p>
              )}
            </div>
          )}
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="confirmPassword">Confirm New Password</label>
          <div className={styles.confirmPasswordContainer}>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className={passwordsMatch !== null ? (passwordsMatch ? styles.match : styles.noMatch) : ''}
            />
            {passwordsMatch !== null && (
              <span className={styles.matchIcon}>
                {passwordsMatch ? <FaCheck className={styles.checkIcon} /> : <FaTimes className={styles.timesIcon} />}
              </span>
            )}
          </div>
          {passwordsMatch !== null && !passwordsMatch && (
            <p className={styles.matchFeedback}>Passwords do not match</p>
          )}
        </div>

        <button 
          type="submit" 
          className={`${styles.btn} ${!isFormValid() ? styles.btnDisabled : ''}`}
          disabled={!isFormValid() || isLoading}
        >
          {isLoading ? (
            <div className={styles.loadingSpinner}>
              <div className={styles.spinner}></div>
              <span>Resetting password...</span>
            </div>
          ) : (
            'Reset Password'
          )}
        </button>

        <div className={styles.loginLink}>
          <span>Remember your password?</span>
          <button 
            type="button" 
            className={styles.linkBtn}
            onClick={() => navigate('/login')}
          >
            Back to Login
          </button>
        </div>
      </motion.form>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
} 