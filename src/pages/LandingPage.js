import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentFeature, setCurrentFeature] = useState(0);

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: '📱',
      title: 'Gestion Mobile',
      description: 'Gérez votre restaurant depuis votre téléphone'
    },
    {
      icon: '📊',
      title: 'Analytics Avancés',
      description: 'Suivez vos performances en temps réel'
    },
    {
      icon: '🚀',
      title: 'Croissance Rapide',
      description: 'Développez votre business efficacement'
    }
  ];

  const testimonials = [
    {
      name: 'Marie Kouassi',
      business: 'Restaurant Abidjan',
      text: 'LikaFood a transformé ma façon de gérer mon restaurant. Mes ventes ont augmenté de 40% !',
      rating: 5
    },
    {
      name: 'Jean Baptiste',
      business: 'Maquis du Plateau',
      text: 'Interface simple et efficace. Je recommande vivement à tous les restaurateurs.',
      rating: 5
    },
    {
      name: 'Fatou Diallo',
      business: 'Café des Arts',
      text: 'Le support client est exceptionnel. Une solution complète pour mon business.',
      rating: 5
    }
  ];

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className={`hero ${isVisible ? 'fade-in' : ''}`}>
        <div className="hero-background">
          <div className="floating-elements">
            <div className="floating-icon">🍽️</div>
            <div className="floating-icon">📱</div>
            <div className="floating-icon">💰</div>
            <div className="floating-icon">📊</div>
          </div>
        </div>
        
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              <span className="gradient-text">LikaFood</span>
              <br />
              Révolutionnez votre restaurant
            </h1>
            <p className="hero-subtitle">
              La plateforme tout-en-un pour gérer, analyser et développer votre business culinaire en Côte d'Ivoire
            </p>
            <div className="hero-buttons">
              <Link to="/login" className="btn btn-primary pulse">
                Commencer Gratuitement
                <span className="btn-icon">🚀</span>
              </Link>
              <button className="btn btn-secondary">
                Voir la Démo
                <span className="btn-icon">▶️</span>
              </button>
            </div>
            <div className="hero-stats">
              <div className="stat">
                <span className="stat-number">500+</span>
                <span className="stat-label">Restaurants</span>
              </div>
              <div className="stat">
                <span className="stat-number">50K+</span>
                <span className="stat-label">Commandes</span>
              </div>
              <div className="stat">
                <span className="stat-number">98%</span>
                <span className="stat-label">Satisfaction</span>
              </div>
            </div>
          </div>
          
          <div className="hero-visual">
            <div className="phone-mockup">
              <div className="phone-screen">
                <div className="app-interface">
                  <div className="app-header">
                    <div className="app-logo">🍽️ LikaFood</div>
                    <div className="notification-badge">3</div>
                  </div>
                  <div className="dashboard-preview">
                    <div className="metric-card">
                      <span className="metric-value">125,000 FCFA</span>
                      <span className="metric-label">Ventes du jour</span>
                    </div>
                    <div className="metric-card">
                      <span className="metric-value">42</span>
                      <span className="metric-label">Commandes</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <h2 className="section-title">Pourquoi choisir LikaFood ?</h2>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className={`feature-card ${currentFeature === index ? 'active' : ''}`}
              >
                <div className="feature-icon">{feature.icon}</div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="benefits">
        <div className="container">
          <div className="benefits-content">
            <div className="benefits-text">
              <h2 className="section-title">Développez votre business</h2>
              <div className="benefit-list">
                <div className="benefit-item">
                  <span className="benefit-icon">✅</span>
                  <div>
                    <h4>Gestion simplifiée</h4>
                    <p>Interface intuitive adaptée aux restaurateurs ivoiriens</p>
                  </div>
                </div>
                <div className="benefit-item">
                  <span className="benefit-icon">📈</span>
                  <div>
                    <h4>Augmentez vos revenus</h4>
                    <p>Optimisez vos ventes avec nos outils d'analyse</p>
                  </div>
                </div>
                <div className="benefit-item">
                  <span className="benefit-icon">⚡</span>
                  <div>
                    <h4>Gain de temps</h4>
                    <p>Automatisez vos tâches répétitives</p>
                  </div>
                </div>
                <div className="benefit-item">
                  <span className="benefit-icon">🎯</span>
                  <div>
                    <h4>Ciblage précis</h4>
                    <p>Atteignez vos clients au bon moment</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="benefits-visual">
              <div className="chart-container">
                <div className="chart">
                  <div className="chart-bar" style={{height: '60%'}}>
                    <span className="chart-value">100K FCFA</span>
                    <span className="chart-label">Avant</span>
                  </div>
                  <div className="chart-bar active" style={{height: '100%'}}>
                    <span className="chart-value">167K FCFA</span>
                    <span className="chart-label">Avec LikaFood</span>
                  </div>
                </div>
                <p className="chart-caption">+70% d'augmentation moyenne des ventes</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials">
        <div className="container">
          <h2 className="section-title">Ce que disent nos clients</h2>
          <div className="testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="testimonial-card">
                <div className="testimonial-rating">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i} className="star">⭐</span>
                  ))}
                </div>
                <p className="testimonial-text">"{testimonial.text}"</p>
                <div className="testimonial-author">
                  <strong>{testimonial.name}</strong>
                  <span>{testimonial.business}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <div className="cta-content">
            <h2 className="cta-title">Prêt à transformer votre restaurant ?</h2>
            <p className="cta-subtitle">
              Rejoignez des centaines de restaurateurs qui ont déjà fait le choix de LikaFood
            </p>
            <div className="cta-buttons">
              <Link to="/login" className="btn btn-primary btn-large">
                Démarrer maintenant
                <span className="btn-icon">🚀</span>
              </Link>
              <button className="btn btn-outline">
                Planifier une démo
                <span className="btn-icon">📅</span>
              </button>
            </div>
            <p className="cta-note">
              ✨ Essai gratuit de 30 jours • Aucune carte de crédit requise
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <h3>🍽️ LikaFood</h3>
              <p>La solution complète pour votre restaurant en Côte d'Ivoire</p>
            </div>
            <div className="footer-links">
              <div className="footer-column">
                <h4>Produit</h4>
                <ul>
                  <li><button>Fonctionnalités</button></li>
                  <li><button>Tarifs</button></li>
                  <li><button>Démo</button></li>
                </ul>
              </div>
              <div className="footer-column">
                <h4>Support</h4>
                <ul>
                  <li><button>Centre d'aide</button></li>
                  <li><button>Contact</button></li>
                  <li><button>Formation</button></li>
                </ul>
              </div>
              <div className="footer-column">
                <h4>Entreprise</h4>
                <ul>
                  <li><button>À propos</button></li>
                  <li><button>Blog</button></li>
                  <li><button>Carrières</button></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 LikaFood. Tous droits réservés.</p>
            <div className="footer-social">
              <button className="social-link">📘</button>
              <button className="social-link">📷</button>
              <button className="social-link">🐦</button>
              <button className="social-link">💼</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;