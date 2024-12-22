import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import styles from './Login.module.css'; // Importing the CSS module

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = isRegistering ? '/register' : '/login';

    try {
      const response = await axios.post(`http://localhost:5000${endpoint}`, {
        username,
        password,
      });

      if (isRegistering && response.status === 201) {
        setMessage('Registration successful! Please log in.');
        setIsRegistering(false);
      } else if (!isRegistering && response.status === 200) {
        localStorage.setItem('token', response.data.access_token);
        navigate('/conversations');
      }
    } catch (error) {
      console.error(error);
      setMessage('Login/Registration failed. Please try again.');
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.formWrapper}>
        <h2>{isRegistering ? 'Register' : 'Login'}</h2>
        {message && <p className={styles.message}>{message}</p>}
        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={styles.input}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.input}
          />
          <button type="submit" className={styles.primaryButton}>
            {isRegistering ? 'Register' : 'Login'}
          </button>
        </form>
        <button
          onClick={() => {
            setIsRegistering(!isRegistering);
            setMessage('');
          }}
          className={styles.toggleButton}
        >
          {isRegistering ? 'Already have an account? Login' : 'Need to register?'}
        </button>
      </div>
    </div>
  );
};

export default Login;
