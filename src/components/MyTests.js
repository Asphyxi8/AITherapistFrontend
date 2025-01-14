import React, { useEffect, useState } from "react";
import axios from "axios";
import styles from "./MyTests.module.css";
import { useNavigate } from 'react-router-dom';

const MyTests = () => {
  const [tests, setTests] = useState([]);
  const [recommendedTests, setRecommendedTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/my-tests", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setTests(response.data);
      } catch (err) {
        setError("Failed to fetch your tests. Please try again later.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTests();
  }, []);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const response = await axios.get("http://localhost:5000/recommend", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setRecommendedTests(response.data.recommendations);
      } catch (err) {
        setError("Failed to fetch recommendations. Please try again later.");
        console.error(err);
      }
    };

    // Only fetch recommendations if the tests have been fetched
    if (tests.length > 0) {
      fetchRecommendations();
    }
  }, [tests]);

  if (loading) return <div className={styles.loading}>Loading your tests...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.myTestsContainer}>
      <h1 className={styles.title}>My Tests</h1>
      {tests.length === 0 ? (
        <p className={styles.noTestsMessage}>You haven't taken any tests yet.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Test Name</th>
              <th>Description</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {tests.map((test) => (
              <tr key={test.test_id}>
                <td>{test.test_name}</td>
                <td>{test.test_description}</td>
                <td>{test.score === -1 ? "Not Graded" : test.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Recommendations Section */}
      {recommendedTests.length > 0 && (
        <div className={styles.recommendationsSection}>
          <h2 className={styles.recommendationsTitle}>Recommended Tests</h2>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Test Name</th>
                <th>Description</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {recommendedTests.map((test) => (
                <tr key={test.test_id}>
                  <td>{test.test_name}</td>
                  <td>{test.test_description}</td>
                  <td><button className ="logout-button" onClick={() => navigate(`/tests/${test.test_id}`)}>Take Test</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MyTests;
