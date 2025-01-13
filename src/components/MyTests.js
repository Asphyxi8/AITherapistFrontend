import React, { useEffect, useState } from "react";
import axios from "axios";
import styles from "./MyTests.module.css";

const MyTests = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
    </div>
  );
};

export default MyTests;