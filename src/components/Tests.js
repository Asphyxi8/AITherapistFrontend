import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Tests.module.css';

function Tests() {
  const [tests, setTests] = useState([]);
  const [activeCard, setActiveCard] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost:5000/get_tests')
      .then((response) => response.json())
      .then((data) => setTests(data))
      .catch((error) => console.error('Error fetching tests:', error));
  }, []);

  const handleCardClick = (testId) => {
    setActiveCard((prev) => (prev === testId ? null : testId));
  };

  return (
    <div className={styles.testsContainer}>
      <h1 className={styles.title}>Available Tests</h1>
      <div className={styles.testsList}>
        {tests.map((test) => (
          <div
            key={test.id}
            className={`${styles.testCard} ${activeCard === test.id ? styles.activeCard : ''}`}
          >
            <div className={styles.cardHeader} onClick={() => handleCardClick(test.id)}>
              <h2>{test.name}</h2>
            </div>
            {activeCard === test.id && (
              <div className={styles.testDescription}>
                <p>{test.description}</p>
                <button onClick={() => navigate(`/tests/${test.id}`)}>Take Test</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Tests;
