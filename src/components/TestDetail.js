import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import styles from "./TestDetail.module.css";

const TestDetail = () => {
  const { testId } = useParams();
  const [test, setTest] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [wikiData, setWikiData] = useState(null); // State for Wikipedia data

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
              // Fetch detailed info about the top result
              const topResult = data.query.search[0];
              const title = topResult.title;
  
              fetch(
                `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
                  title
                )}`
              )
                .then((res) => res.json())
                .then((summaryData) => setWikiData(summaryData))
                .catch((error) =>
                  console.error("Error fetching detailed Wikipedia data:", error)
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

      {wikiData && (
        <div className={styles.wikiSection}>
          <h2>Learn More: {wikiData.title}</h2>
          {wikiData.thumbnail && (
            <img
              src={wikiData.thumbnail.source}
              alt={wikiData.title}
              className={styles.wikiImage}
            />
          )}
          <p>{wikiData.extract}</p>
          {wikiData.content_urls?.desktop && (
            <a
              href={wikiData.content_urls.desktop.page}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.readMoreLink}
            >
              Read more on Wikipedia
            </a>
          )}
        </div>
      )}
    </div>
  );
};

export default TestDetail;
