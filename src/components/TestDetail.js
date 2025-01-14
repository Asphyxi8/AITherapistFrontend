import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import styles from "./TestDetail.module.css";

const TestDetail = () => {
  const { testId } = useParams();
  const [test, setTest] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [wikiResults, setWikiResults] = useState([]); // State for multiple Wikipedia results

  useEffect(() => {
    console.log(JSON.stringify({ answers: answers }));
  }, [answers]);

  useEffect(() => {
    // Fetch test data
    axios
      .get(`http://localhost:5000/api/test/${testId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      .then((response) => {
        setTest(response.data);

        // Initialize answers array based on number of questions
        const initialAnswers = response.data.format.questions.map(() => ({
          score: 0,
        }));
        setAnswers(initialAnswers);

        // Wikipedia search API call
        const query = response.data.name;
        fetch(
          `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
            query
          )}&utf8=&format=json&origin=*`
        )
          .then((res) => res.json())
          .then((data) => {
            if (data.query?.search?.length) {
              const topResults = data.query.search.slice(0, 1);
              const detailedResultsPromises = topResults.map((result) =>
                fetch(
                  `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
                    result.title
                  )}`
                ).then((res) => res.json())
              );

              // Fetch detailed info for each result
              Promise.all(detailedResultsPromises)
                .then((detailedResults) => setWikiResults(detailedResults))
                .catch((error) =>
                  console.error(
                    "Error fetching detailed Wikipedia data:",
                    error
                  )
                );
            }
          })
          .catch((error) =>
            console.error("Error searching Wikipedia data:", error)
          );
      })
      .catch((error) => {
        console.error("Error fetching test:", error);
      });
  }, [testId]);

  const handleSubmit = async (event) => {
    event.preventDefault(); // Prevent the form from refreshing the page
    try {
      const url = `http://localhost:5000/api/submit/${testId}`;
      const token = localStorage.getItem("token");

      const response = await axios.post(
        url,
        { answers: answers },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        alert("Test submitted successfully. Score: " + response.data.score);
      } else {
        alert(`Error: Received response status: ${response.status}`);
        throw new Error(`Error: ${response.statusText}`);
      }
    } catch (error) {
      alert("Error occurred during test submission: " + error.message);
      console.error("Error submitting test:", error);
    }
  };

  if (!test) return <div className={styles.loading}>Loading test...</div>;

  return (
    <div className={styles.testDetailContainer}>
      <div className={styles.testSection}>
        <h1>{test.name}</h1>
        <p>{test.description}</p>
        <form onSubmit={handleSubmit}>
          {test.format.questions.map((question, index) => (
            <div key={index} className={styles.questionBlock}>
              <h3>{question.text}</h3>
              {question.options.map((option, optionIndex) => (
                <div key={optionIndex} className={styles.option}>
                  <label>
                    <input
                      type="radio"
                      name={`question-${index}`}
                      value={option.score}
                      onChange={() => {
                        const updatedAnswers = [...answers];
                        updatedAnswers[index] = { score: option.score };
                        setAnswers(updatedAnswers);
                      }}
                    />
                    {option.text}
                  </label>
                </div>
              ))}
            </div>
          ))}
          <button type="submit" className={styles.submitButton}>
            Submit
          </button>
        </form>
      </div>

      {wikiResults.length > 0 && (
        <div className={styles.wikiSection}>
          <h2>Learn More:</h2>
          {wikiResults.map((result, index) => (
            <div key={index} className={styles.wikiResult}>
              <h3>{result.title}</h3>
              {result.thumbnail && (
                <img
                  src={result.thumbnail.source}
                  alt={result.title}
                  className={styles.wikiImage}
                />
              )}
              <p>{result.extract}</p>
              {result.content_urls?.desktop && (
                <a
                  href={result.content_urls.desktop.page}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.readMoreLink}
                >
                  Read more on Wikipedia
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TestDetail;
