import React from "react";
import { Link } from "react-router-dom";
import "../styles/Home.css";

function Home() {
  return (
    <div className="home-container">
      <section className="hero">
        <h1>Tibetan Association of Northern California</h1>
        <p>
          Our digital ID system makes it easy to maintain your membership and
          access community services.
        </p>
        <div className="cta-buttons">
          <Link to="/application" className="navbar-button primary-cta">
            Apply for ID
          </Link>
          <Link to="/login" className="navbar-button secondary-cta">
            Member Login
          </Link>
        </div>
      </section>

      <section className="features">
        <div className="feature-card">
          <div className="feature-icon">🆔</div>
          <h3 className="feature-title">Digital ID</h3>
          <p>Access your digital membership ID from anywhere, anytime.</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">✨</div>
          <h3 className="feature-title">Easy Application</h3>
          <p>
            Apply for your membership and ID card in just a few simple steps.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">🔒</div>
          <h3 className="feature-title">Secure System</h3>
          <p>Your information is stored securely and protected.</p>
        </div>
      </section>

      <section className="info-section">
        <h2>Membership Information</h2>
        <p>
          The membership fee is $100 for five years, with an additional $5 for a
          physical ID card.
        </p>
        <p>
          Being a member of TANC gives you access to various community services,
          cultural events, and educational programs.
        </p>
      </section>
    </div>
  );
}

export default Home;
