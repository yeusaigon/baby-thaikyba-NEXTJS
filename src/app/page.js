"use client";

import { useState, useEffect } from "react";

export default function Home() {
  // Navbar scroll effect
  const [isScrolled, setIsScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Dashboard active tab
  const [activeTab, setActiveTab] = useState("ai-workspace");
  
  // Dashboard mock metrics dynamic data based on active tab
  const getDashboardData = () => {
    switch (activeTab) {
      case "ai-workspace":
        return {
          metric1: "Speedup", value1: "4.8x",
          metric2: "AI Suggestions", value2: "1,248",
          metric3: "Token Economy", value3: "88%",
          chartHeights: [65, 80, 45, 90, 75, 95, 88]
        };
      case "analytics":
        return {
          metric1: "Monthly Visits", value1: "42.5K",
          metric2: "Bounce Rate", value2: "32.4%",
          metric3: "Conversion", value3: "3.8%",
          chartHeights: [30, 45, 55, 60, 75, 85, 98]
        };
      case "content-calendar":
        return {
          metric1: "Scheduled", value1: "18 Posts",
          metric2: "Published", value2: "142",
          metric3: "Social Reach", value3: "+24%",
          chartHeights: [70, 60, 65, 50, 80, 75, 60]
        };
      case "team-collab":
        return {
          metric1: "Active Users", value1: "12 / 15",
          metric2: "Open Comments", value2: "4",
          metric3: "Collab Score", value3: "99.2",
          chartHeights: [90, 85, 88, 92, 95, 90, 99]
        };
      default:
        return {
          metric1: "Speedup", value1: "4.8x",
          metric2: "AI Suggestions", value2: "1,248",
          metric3: "Token Economy", value3: "88%",
          chartHeights: [65, 80, 45, 90, 75, 95, 88]
        };
    }
  };

  const dbData = getDashboardData();

  // Interactive Simulator States
  const [wordCount, setWordCount] = useState(1200);
  const [optLevel, setOptLevel] = useState(3);
  
  // Simulated Math
  const timeSavedMinutes = Math.round((wordCount / 200) * 15 * (optLevel / 2));
  const seoScoreBoost = Math.min(98, Math.round(55 + (optLevel * 8.5) + (wordCount / 1000)));

  // Contact / Newsletter Form States
  const [email, setEmail] = useState("");
  const [formStatus, setFormStatus] = useState({ state: "idle", message: "" });

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email) return;

    setFormStatus({ state: "submitting", message: "" });
    
    // Simulate API request
    setTimeout(() => {
      setFormStatus({
        state: "success",
        message: "Welcome aboard! Check your inbox for exclusive early access instructions."
      });
      setEmail("");
    }, 1200);
  };

  // Scroll animations fallback for Firefox/Older Safari
  useEffect(() => {
    if (!CSS.supports("(animation-timeline: view()) and (animation-range: entry)")) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("revealed");
            }
          });
        },
        { threshold: 0.15 }
      );

      document.querySelectorAll(".scroll-reveal").forEach((el) => {
        el.classList.add("reveal-fallback");
        observer.observe(el);
      });

      return () => observer.disconnect();
    }
  }, []);

  return (
    <>
      {/* Background Glowing Ambient Orbs */}
      <div className="bg-glow-container">
        <div className="glow-orb orb-1"></div>
        <div className="glow-orb orb-2"></div>
        <div className="glow-orb orb-3"></div>
      </div>

      {/* Navigation Bar */}
      <header className={`navbar ${isScrolled ? "navbar-scrolled" : ""}`}>
        <div className="container">
          <div className="logo" id="nav-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            AuraAI <span className="logo-dot"></span>
          </div>
          <nav>
            <ul className="nav-links">
              <li><a className="nav-link" href="#features">Features</a></li>
              <li><a className="nav-link" href="#simulator">Live Demo</a></li>
              <li><a className="nav-link" href="#testimonials">Testimonials</a></li>
              <li><a className="btn btn-outline" href="#cta" id="nav-cta-btn">Join Waitlist</a></li>
            </ul>
          </nav>
        </div>
      </header>

      <main style={{ position: "relative" }}>
        
        {/* HERO SECTION */}
        <section className="hero">
          <div className="container">
            <div className="hero-tag">
              <span className="hero-tag-dot"></span> Introducing Aura Workspace 2.0
            </div>
            
            <h1 className="hero-title">
              Supercharge Your Workflow With <span className="gradient-text">Ambient Intelligence</span>
            </h1>
            
            <p className="hero-desc">
              AuraAI synthesizes your writing, codes widgets, and orchestrates your team projects in a stunning, high-performance workspace running directly at the edge.
            </p>
            
            <div className="hero-actions">
              <a className="btn btn-primary" href="#cta" id="hero-primary-btn">
                Get Started Free 
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              </a>
              <a className="btn btn-secondary" href="#simulator" id="hero-secondary-btn">Try Interactive Demo</a>
            </div>

            {/* Floating Mockup Dashboard */}
            <div className="mockup-container scroll-reveal">
              <div className="mockup-wrapper">
                <div className="mockup-bar">
                  <div className="mockup-dot red"></div>
                  <div className="mockup-dot yellow"></div>
                  <div className="mockup-dot green"></div>
                  <span className="mockup-title">aura-workspace-dashboard // auraai.com</span>
                </div>
                
                <div className="mockup-body">
                  <div className="mockup-sidebar">
                    <button 
                      id="db-tab-ai"
                      className={`sidebar-item btn ${activeTab === "ai-workspace" ? "active" : ""}`}
                      onClick={() => setActiveTab("ai-workspace")}
                      style={{ border: "none", width: "100%", justifyContent: "flex-start", cursor: "pointer" }}
                    >
                      <span className="sidebar-circle" style={{ color: "var(--primary)" }}></span>
                      AI Workspace
                    </button>
                    <button 
                      id="db-tab-analytics"
                      className={`sidebar-item btn ${activeTab === "analytics" ? "active" : ""}`}
                      onClick={() => setActiveTab("analytics")}
                      style={{ border: "none", width: "100%", justifyContent: "flex-start", cursor: "pointer" }}
                    >
                      <span className="sidebar-circle" style={{ color: "var(--accent-cyan)" }}></span>
                      Analytics
                    </button>
                    <button 
                      id="db-tab-calendar"
                      className={`sidebar-item btn ${activeTab === "content-calendar" ? "active" : ""}`}
                      onClick={() => setActiveTab("content-calendar")}
                      style={{ border: "none", width: "100%", justifyContent: "flex-start", cursor: "pointer" }}
                    >
                      <span className="sidebar-circle" style={{ color: "var(--accent-purple)" }}></span>
                      Content Calendar
                    </button>
                    <button 
                      id="db-tab-collab"
                      className={`sidebar-item btn ${activeTab === "team-collab" ? "active" : ""}`}
                      onClick={() => setActiveTab("team-collab")}
                      style={{ border: "none", width: "100%", justifyContent: "flex-start", cursor: "pointer" }}
                    >
                      <span className="sidebar-circle" style={{ color: "#10b981" }}></span>
                      Team Collab
                    </button>
                  </div>

                  <div className="mockup-content">
                    <div className="mockup-header-box">
                      <h3 style={{ fontSize: "18px", fontWeight: "600" }}>Workspace Overview</h3>
                      <span style={{ fontSize: "12px", color: "var(--text-muted)", background: "rgba(255,255,255,0.03)", padding: "4px 10px", borderRadius: "4px" }}>Edge Node: CF-SGN-1</span>
                    </div>

                    <div className="mockup-grid">
                      <div className="mockup-card">
                        <h4>{dbData.metric1}</h4>
                        <div className="value">{dbData.value1}</div>
                      </div>
                      <div className="mockup-card">
                        <h4>{dbData.metric2}</h4>
                        <div className="value">{dbData.value2}</div>
                      </div>
                      <div className="mockup-card">
                        <h4>{dbData.metric3}</h4>
                        <div className="value">{dbData.value3}</div>
                      </div>
                    </div>

                    <div className="mockup-chart-container">
                      {dbData.chartHeights.map((height, idx) => (
                        <div 
                          key={idx} 
                          className="chart-bar" 
                          style={{ height: `${height}%` }}
                        ></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES GRID SECTION */}
        <section id="features" style={{ background: "rgba(7, 9, 19, 0.5)" }}>
          <div className="container">
            <div className="section-header scroll-reveal">
              <span className="section-tag">Core Architecture</span>
              <h2 className="section-title">Engineered For Visual Speed</h2>
              <p className="section-desc">
                Everything you need to write, iterate, and deploy dynamic campaigns without the baggage of monolithic legacy platforms.
              </p>
            </div>

            <div className="features-grid">
              <div className="glass-card feature-card scroll-reveal">
                <div className="feature-icon-box">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path></svg>
                </div>
                <h3 className="feature-title">Ambient AI Copilot</h3>
                <p className="feature-desc">
                  An AI model running contextually as you write. Autocomplete templates, generate graphics, and summarize articles with zero round-trip latency.
                </p>
              </div>

              <div className="glass-card feature-card scroll-reveal">
                <div className="feature-icon-box">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                </div>
                <h3 className="feature-title">Cloudflare Edge Deploy</h3>
                <p className="feature-desc">
                  Next-generation delivery. Compiled to static assets and deployed natively to Cloudflare's network, ensuring 100ms load times worldwide.
                </p>
              </div>

              <div className="glass-card feature-card scroll-reveal">
                <div className="feature-icon-box">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                </div>
                <h3 className="feature-title">Realtime Multiplayer</h3>
                <p className="feature-desc">
                  Co-author content in real-time. Cloudflare Durable Objects keep teams fully synced with perfect conflict resolution.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* INTERACTIVE SIMULATOR SECTION */}
        <section id="simulator" className="interactive-section">
          <div className="container">
            <div className="simulator-grid">
              <div className="scroll-reveal">
                <span className="section-tag">Interactive Simulator</span>
                <h2 className="section-title">Calculate Your Time Savings</h2>
                <p className="section-desc" style={{ marginBottom: "30px" }}>
                  Adjust the sliders to simulate the impact of AuraAI's content processing pipeline on your marketing and publishing workflows.
                </p>
                
                <div className="glass-card simulator-card">
                  <div className="sim-control-group">
                    <div className="sim-control-label">
                      <span>AVERAGE ARTICLE LENGTH</span>
                      <span style={{ fontWeight: "700", color: "var(--accent-cyan)" }}>{wordCount.toLocaleString()} Words</span>
                    </div>
                    <input 
                      id="sim-length-input"
                      type="range" 
                      min="500" 
                      max="5000" 
                      step="100" 
                      value={wordCount} 
                      onChange={(e) => setWordCount(Number(e.target.value))}
                      className="sim-slider" 
                    />
                  </div>

                  <div className="sim-control-group">
                    <div className="sim-control-label">
                      <span>AI REWRITING DEPTH</span>
                      <span style={{ fontWeight: "700", color: "var(--primary)" }}>Level {optLevel}x</span>
                    </div>
                    <input 
                      id="sim-level-input"
                      type="range" 
                      min="1" 
                      max="5" 
                      step="1" 
                      value={optLevel} 
                      onChange={(e) => setOptLevel(Number(e.target.value))}
                      className="sim-slider" 
                    />
                  </div>

                  <div className="sim-result-box">
                    <div className="sim-stat">
                      <div className="sim-stat-label">Time Saved</div>
                      <div className="sim-stat-value" style={{ color: "var(--accent-cyan)" }}>
                        {timeSavedMinutes}m
                      </div>
                    </div>
                    <div className="sim-stat">
                      <div className="sim-stat-label">Est. SEO Score</div>
                      <div className="sim-stat-value" style={{ color: "var(--accent-purple)" }}>
                        {seoScoreBoost}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="scroll-reveal">
                <h3 style={{ fontSize: "28px", marginBottom: "20px", fontFamily: "var(--font-heading)" }}>Under the Hood</h3>
                <p style={{ color: "var(--text-secondary)", lineHeight: "1.6", marginBottom: "24px" }}>
                  AuraAI automatically breaks down your drafts into semantic chunks, processes them through specialized local edge-models, and optimizes them for SEO, readability, and engagement in parallel.
                </p>
                
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "16px" }}>
                  <li style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                    <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "rgba(6, 182, 212, 0.15)", color: "var(--accent-cyan)", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "bold", flexShrink: 0 }}>✓</div>
                    <div>
                      <strong style={{ color: "#fff", display: "block" }}>Parallelized Prompt Chaining</strong>
                      <span style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Processes multiple sections simultaneously to shave minutes off compilation.</span>
                    </div>
                  </li>
                  <li style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                    <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "rgba(168, 85, 247, 0.15)", color: "var(--accent-purple)", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "bold", flexShrink: 0 }}>✓</div>
                    <div>
                      <strong style={{ color: "#fff", display: "block" }}>Context-Aware Cache</strong>
                      <span style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Remembers previous content structures, cutting AI tokens by up to 60%.</span>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* TESTIMONIALS SECTION */}
        <section id="testimonials" style={{ background: "rgba(7, 9, 19, 0.3)" }}>
          <div className="container">
            <div className="stats-bar scroll-reveal">
              <div className="stat-item">
                <div className="stat-num" style={{ color: "var(--primary)" }}>150M+</div>
                <div className="stat-label">Words Generated</div>
              </div>
              <div className="stat-item">
                <div className="stat-num" style={{ color: "var(--accent-cyan)" }}>99.99%</div>
                <div className="stat-label">Edge Uptime</div>
              </div>
              <div className="stat-item">
                <div className="stat-num" style={{ color: "var(--accent-purple)" }}>12K+</div>
                <div className="stat-label">Active Creators</div>
              </div>
              <div className="stat-item">
                <div className="stat-num" style={{ color: "#10b981" }}>4.9/5</div>
                <div className="stat-label">User Rating</div>
              </div>
            </div>

            <div className="testimonial-card glass-card scroll-reveal">
              <div className="quote-icon">“</div>
              <blockquote className="quote-text">
                "We migrated all of our landing page creation and marketing copies to AuraAI. The performance boost from hosting static exports on Cloudflare Pages, combined with edge AI rewriting, has cut our cycle time from days to minutes."
              </blockquote>
              <div className="quote-author">Sarah Jenkins</div>
              <div className="quote-title">VP of Growth, HyperScale Interactive</div>
            </div>
          </div>
        </section>

        {/* CALL TO ACTION SECTION */}
        <section id="cta">
          <div className="container">
            <div className="cta-card glass-card scroll-reveal">
              <h2 className="cta-title">Ready to Experience the Speed?</h2>
              <p className="cta-desc">
                Join our private waitlist today. Get early access to the edge-computing platform that is redesigning modern workspaces.
              </p>
              
              <form onSubmit={handleSubscribe} className="form-group" id="waitlist-form">
                <input 
                  id="newsletter-email-input"
                  type="email" 
                  className="form-input" 
                  placeholder="Enter your professional email..." 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={formStatus.state === "submitting"}
                  required
                />
                <button 
                  id="newsletter-submit-btn"
                  type="submit" 
                  className="btn btn-primary"
                  disabled={formStatus.state === "submitting"}
                  style={{ minWidth: "140px" }}
                >
                  {formStatus.state === "submitting" ? (
                    <span className="spinner" style={{ display: "inline-block", width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }}></span>
                  ) : "Request Access"}
                </button>
              </form>
              
              {formStatus.message && (
                <div className={`form-status ${formStatus.state === "success" ? "success" : ""}`} id="form-status-msg">
                  {formStatus.message}
                </div>
              )}
            </div>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="logo" style={{ cursor: "default" }}>
              AuraAI <span className="logo-dot"></span>
            </div>
            
            <ul className="footer-links">
              <li><a className="footer-link" href="#features">Features</a></li>
              <li><a className="nav-link footer-link" href="#simulator">Calculator</a></li>
              <li><a className="footer-link" href="#testimonials">Testimonials</a></li>
            </ul>
          </div>
          
          <div className="footer-copyright">
            &copy; {new Date().getFullYear()} AuraAI Technologies Inc. All rights reserved. Deployed on Cloudflare.
          </div>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
