import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import styles from './Login.module.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = isRegistering ? '/register' : '/login';

    try {
      const response = await axios.post(`http://localhost:5000${endpoint}`, {
        username,
        password,
      });

      if (isRegistering) {
        // For Registration
        toast.success('Registration successful! Please log in.', {
          position: "top-center",
          autoClose: 3000,
        });
        setIsRegistering(false);
        setUsername('');
        setPassword('');
      } else {
        // For Login
        localStorage.setItem('token', response.data.access_token);
        
        // Show success toast and navigate after toast is shown
        toast.success('Successfully logged in!', {
          position: "top-center",
          autoClose: 2000,
          onClose: () => navigate('/conversations')
        });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'An error occurred', {
        position: "top-center",
        autoClose: 3000,
      });
    }
  };

  return (
    <>
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
      <div className={styles.loginContainer}>
        <div className={styles.formWrapper}>
          <h2>{isRegistering ? 'Register' : 'Login'}</h2>
          <form onSubmit={handleSubmit} className={styles.form}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={styles.input}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
              required
            />
            <button type="submit" className={styles.primaryButton}>
              {isRegistering ? 'Register' : 'Login'}
            </button>
          </form>
          <button
            onClick={() => setIsRegistering(!isRegistering)}
            className={styles.toggleButton}
          >
            {isRegistering ? 'Already have an account? Login' : 'Need to register?'}
          </button>
        </div>
      </div>
    </>
  );
};

export default Login;