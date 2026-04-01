import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Home() {
  const navigate = useNavigate()
  const { currentUser, logout } = useAuth()

  return (
    <div className="gradient-bg" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Dynamic Navbar */}
      <nav style={{ padding: '24px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--card)', backdropFilter: 'blur(10px)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => navigate('/')}>
          <span style={{ fontSize: 28, filter: 'drop-shadow(0 4px 8px rgba(167, 191, 255, 0.4))' }}>🌸</span>
          <span className="heading-font" style={{ fontSize: 24, fontWeight: 700, letterSpacing: '0.5px' }}>MindCheck</span>
        </div>
        <div>
          {currentUser ? (
             <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
               <span style={{ fontSize: 14, color: 'var(--muted)', fontWeight: 500, cursor: 'pointer' }} onClick={() => navigate('/profile')}>
                 Hey, <strong style={{color: 'var(--text)'}}>{currentUser.displayName || currentUser.email.split('@')[0]}</strong>
               </span>
               <button onClick={() => navigate('/profile')} className="btn-outline" style={{ padding: '8px 20px', fontSize: 13, borderColor: 'var(--accent)', color: 'var(--accent)', background: 'transparent' }}>Profile</button>
               <button onClick={logout} className="btn-outline" style={{ padding: '8px 20px', fontSize: 13, borderColor: 'var(--red)', color: 'var(--red)', background: 'transparent' }}>Sign Out</button>
             </div>
          ) : (
             <button onClick={() => navigate('/login')} className="btn-outline" style={{ padding: '8px 24px', fontSize: 14 }}>Sign In</button>
          )}
        </div>
      </nav>

      <div className="container" style={{ flex: 1, padding: '80px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        
        {/* HERO SECTION */}
        <div className="fade-up" style={{ maxWidth: 840, margin: '0 auto', textAlign: 'center', marginBottom: 80 }}>
          <div className="glass-icon">🧠</div>
          
          <h1 style={{ fontSize: '4.5rem', lineHeight: 1.1, marginBottom: 24, letterSpacing: '-0.03em', color: 'var(--text)' }}>
            Elevate Your <br/> <span className="text-gradient">Mental Wellness</span>
          </h1>
          
          <p style={{ fontSize: 20, color: 'var(--muted)', lineHeight: 1.6, maxWidth: 660, margin: '0 auto 40px', fontWeight: 400 }}>
            An adaptive, context-aware triage system powered by advanced machine learning. Experience personalized mental health insights.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
             <button className="btn-primary" style={{ fontSize: 16, padding: '18px 44px' }}
               onClick={() => navigate(currentUser ? '/assessment' : '/login')}>
               {currentUser ? 'Start Triage Assessment →' : 'Get Started Now'}
             </button>
          </div>
        </div>

        {/* FEATURES SECTION */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, marginBottom: 80 }}>
          
          <div className="card fade-up" style={{ animationDelay: '0.1s' }}>
            <div style={{ fontSize: 32, marginBottom: 20, filter: 'drop-shadow(0 4px 8px rgba(116, 164, 255, 0.4))' }}>🎯</div>
            <h3 style={{ fontSize: 22, marginBottom: 12, color: 'var(--text)' }}>Adaptive Triage</h3>
            <p style={{ fontSize: 15, color: 'var(--muted)', lineHeight: 1.6 }}>
              Dynamic real-time assessments tailored perfectly to your demographic, whether student or professional.
            </p>
          </div>

          <div className="card fade-up" style={{ animationDelay: '0.2s', transform: 'translateY(-10px)', borderColor: 'rgba(167, 191, 255, 0.6)', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.06), 0 0 20px rgba(167, 191, 255, 0.15)' }}>
            <div style={{ fontSize: 32, marginBottom: 20, filter: 'drop-shadow(0 4px 8px rgba(255, 184, 209, 0.5))' }}>🤖</div>
            <h3 style={{ fontSize: 22, marginBottom: 12, color: 'var(--text)' }}>Ensemble ML</h3>
            <p style={{ fontSize: 15, color: 'var(--muted)', lineHeight: 1.6 }}>
              Powered by robust Voting Classifiers combining RF, Gradient Boosting, for clinical-grade precision.
            </p>
          </div>

          <div className="card fade-up" style={{ animationDelay: '0.3s' }}>
            <div style={{ fontSize: 32, marginBottom: 20, filter: 'drop-shadow(0 4px 8px rgba(109, 207, 153, 0.4))' }}>⚡</div>
            <h3 style={{ fontSize: 22, marginBottom: 12, color: 'var(--text)' }}>Actionable Insights</h3>
            <p style={{ fontSize: 15, color: 'var(--muted)', lineHeight: 1.6 }}>
              Receive an immediate, sophisticated risk assessment along with actionable localized referral advice.
            </p>
          </div>

        </div>

        {/* MODEL STATS SECTION */}
        <div className="card fade-up" style={{ animationDelay: '0.4s', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 40, border: '1px solid rgba(255, 184, 209, 0.4)', background: 'rgba(255, 184, 209, 0.1)' }}>
          <div style={{ flex: '1 1 340px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '2px', color: 'var(--text)', opacity: 0.7, textTransform: 'uppercase', marginBottom: 12 }}>Under The Hood</div>
            <h2 style={{ fontSize: 32, marginBottom: 16 }}>Trained on 300,000+ Profiles</h2>
            <p style={{ fontSize: 16, color: 'var(--muted)', lineHeight: 1.7, fontWeight: 400 }}>
              Our multi-model architecture holds distinct pipelines in memory, dynamically extracting only the most statistically significant 
              mental health indicators for your unique life context.
            </p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, flex: '1 1 auto' }}>
            <div style={{ background: 'var(--bg2)', padding: '24px', borderRadius: 16, textAlign: 'center', border: '1px solid var(--border)' }}>
              <div className="heading-font" style={{ fontSize: 36, color: 'var(--text)', marginBottom: 4, fontWeight: 700 }}>3</div>
              <div style={{ fontSize: 13, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Distinct Models</div>
            </div>
            <div style={{ background: 'var(--bg2)', padding: '24px', borderRadius: 16, textAlign: 'center', border: '1px solid var(--border)' }}>
              <div className="heading-font text-gradient" style={{ fontSize: 36, marginBottom: 4, fontWeight: 700 }}>15</div>
              <div style={{ fontSize: 13, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Key Features</div>
            </div>
            <div style={{ background: 'var(--bg2)', padding: '24px', borderRadius: 16, textAlign: 'center', border: '1px solid var(--border)', gridColumn: '1 / -1' }}>
              <div className="heading-font" style={{ fontSize: 48, color: 'var(--green)', marginBottom: 4, fontWeight: 700, filter: 'drop-shadow(0 4px 8px rgba(109, 207, 153, 0.3))' }}>84.5%</div>
              <div style={{ fontSize: 13, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Clinical Peak Accuracy</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
