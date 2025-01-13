import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import "./Navbar.css"; // Import complementary styles

const Navbar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        const currentTime = Date.now() / 1000; // Current time in seconds
        if (decodedToken.exp < currentTime) {
          // Token is expired
          localStorage.removeItem("token");
          setIsLoggedIn(false);
          navigate("/"); // Redirect to login page
        } else {
          setIsLoggedIn(true);
        }
      } catch (error) {
        console.error("Error decoding token:", error);
        setIsLoggedIn(false);
        localStorage.removeItem("token");
        navigate("/"); // Redirect to login page
      }
    } else {
      setIsLoggedIn(false);
      navigate("/"); // Redirect to login page
    }
  }, [navigate]);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <h1 className="navbar-logo">Test Portal</h1>
        <ul className="navbar-links">
          {!isLoggedIn && (
            <li>
              <NavLink to="/" className="nav-link" end>
                Login
              </NavLink>
            </li>
          )}
          <li>
            <NavLink to="/tests" className="nav-link">
              Tests
            </NavLink>
          </li>
          <li>
            <NavLink to="/mytests" className="nav-link">
              My Tests
            </NavLink>
          </li>
          <li>
            <NavLink to="/conversations" className="nav-link">
              Conversations
            </NavLink>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
