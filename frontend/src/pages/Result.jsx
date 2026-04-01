import { useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts'

export default function Result() {
  const { state }   = useLocation()
  const navigate    = useNavigate()
  const [score, setScore] = useState(0)
  const [locationStr, setLocationStr] = useState('')

  const result = state?.result
  const risk_score = Number(result?.risk_score ?? 0)
  const risk_tier = result?.risk_tier ?? 'Low Risk'
  const referral = result?.referral ?? 'Please consult a licensed mental health professional if needed.'

  const handleFindTherapist = () => {
    if (!locationStr.trim()) return;
    const searchUrl = `https://www.google.com/maps/search/mental+health+therapist+near+${encodeURIComponent(locationStr.trim())}`;
    window.open(searchUrl, '_blank');
  }

  useEffect(() => {
    if (!result) navigate('/')
  }, [result, navigate])

  // Animate score
  useEffect(() => {
    let start = 0
    const end = risk_score
    const timer = setInterval(() => {
      start += 2
      if (start >= end) { setScore(end); clearInterval(timer) }
      else setScore(start)
    }, 20)
    return () => clearInterval(timer)
  }, [risk_score])

  const tierKey = risk_tier.toLowerCase().includes('high') ? 'high'
                : risk_tier.toLowerCase().includes('moderate') ? 'moderate' : 'low'

  const tierColor = { high: '#ff3d00', moderate: '#ffb300', low: '#00e676' }[tierKey]
  const glowShadow = `0 0 20px ${tierColor}40`

  const chartData = [{ value: risk_score, fill: tierColor }]

  if (!result) return null

  const recommendations = {
    high: [
      '🏥 Seek professional mental health support immediately',
      '📞 Contact a mental health helpline if in crisis',
      '👥 Talk to a trusted person about how you feel',
      '📋 Ask your employer about mental health leave options',
    ],
    moderate: [
      '🗣️ Consider speaking with a counselor or therapist',
      '🧘 Practice stress-reduction techniques daily',
      '💬 Have an open conversation with your supervisor',
      '📚 Explore mental health resources at your workplace',
    ],
    low: [
      '✅ Continue maintaining healthy work-life balance',
      '🌱 Stay proactive about mental wellness',
      '👫 Stay connected with supportive colleagues',
      '📖 Learn more about mental health awareness',
    ]
  }

  return (
    <div className="gradient-bg" style={{ minHeight: '100vh', padding: '60px 0' }}>
      <div className="container" style={{ maxWidth: 1000 }}>

        {/* Header */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 40, cursor: 'pointer' }} onClick={() => navigate('/')}>
          <span style={{ fontSize: 24, filter: 'drop-shadow(0 4px 8px rgba(167, 191, 255, 0.4))' }}>🌸</span>
          <span className="heading-font" style={{ fontSize: 22, fontWeight: 700, letterSpacing: '0.5px' }}>MindCheck</span>
        </div>

        <h2 className="fade-up" style={{ fontSize: '3rem', marginBottom: 16, color: 'var(--text)' }}>
          Your <span className="text-gradient">Triage Result</span>
        </h2>
        <p className="fade-up" style={{ color: 'var(--muted)', marginBottom: 40, fontSize: 16, maxWidth: 600, lineHeight: 1.6, animationDelay: '0.1s' }}>
          This score is the model&apos;s estimated AI probability (0–100%) that someone with your
          contextual profile would report needing focused mental health treatment.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24, marginBottom: 24 }}>

          {/* Score Card */}
          <div className="card fade-up" style={{ textAlign: 'center', animationDelay: '0.2s', borderColor: `${tierColor}40`, boxShadow: `0 20px 40px -10px rgba(0, 0, 0, 0.05), ${glowShadow}` }}>
            <p className="heading-font" style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 20, letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 600 }}>Risk Probability Score</p>

            <div style={{ height: 240, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 240, height: 240, position: 'absolute' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    cx="50%" cy="50%"
                    innerRadius="80%" outerRadius="100%"
                    startAngle={90} endAngle={-270}
                    data={chartData}
                  >
                    <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                    <RadialBar dataKey="value" cornerRadius={20} background={{ fill: 'rgba(0,0,0,0.05)' }} />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>

              {/* Centered Text inside the Ring */}
              <div style={{ zIndex: 10, textAlign: 'center', marginTop: 10 }}>
                <div className="heading-font" style={{ fontSize: 72, fontWeight: 700, color: tierColor, lineHeight: 1, filter: `drop-shadow(0 4px 8px ${tierColor}40)` }}>
                  {Math.round(score)}
                </div>
                <div style={{ fontSize: 14, color: 'var(--muted)', marginTop: 4, letterSpacing: '1px', textTransform: 'uppercase' }}>out of 100</div>
              </div>
            </div>

            <span className={`risk-badge risk-badge-${tierKey}`} style={{ marginTop: 24, fontSize: 16, padding: '10px 24px', filter: `drop-shadow(0 4px 8px ${tierColor}20)` }}>
              {risk_tier}
            </span>

            <div style={{ marginTop: 24, fontSize: 13, color: 'var(--muted)', background: 'var(--bg2)', padding: '16px', borderRadius: '16px', textAlign: 'left', border: '1px solid var(--border)' }}>
              <p style={{ marginBottom: 8, fontWeight: 600, color: 'var(--text)' }}>Triage Bands Overview:</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span style={{color: 'var(--red)'}}>● High Risk</span> <span>≥ 75</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span style={{color: 'var(--yellow)'}}>● Moderate Risk</span> <span>45 – 74</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{color: 'var(--green)'}}>● Low Risk</span> <span>&lt; 45</span></div>
            </div>
          </div>

          {/* Referral Card */}
          <div className="card fade-up" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', animationDelay: '0.3s' }}>
            <div>
              <p className="heading-font" style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 16, letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 600 }}>Clinical Recommendation</p>
              <p style={{ fontSize: 20, lineHeight: 1.6, marginBottom: 32, color: 'var(--text)', fontWeight: 600, borderLeft: `4px solid ${tierColor}`, paddingLeft: '16px' }}>{referral}</p>

              <p className="heading-font" style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 16, letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 600 }}>Recommended Steps</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {recommendations[tierKey].map((r, i) => (
                  <div key={i} style={{
                    background: 'var(--bg2)', borderRadius: 12, border: '1px solid var(--border)',
                    padding: '12px 16px', fontSize: 14, lineHeight: 1.5, display: 'flex', alignItems: 'flex-start', gap: 12
                  }}>
                    {r}
                  </div>
                ))}
              </div>

              {/* Local Support Search Block */}
              <div style={{ marginTop: 32, padding: '20px', background: 'rgba(167, 191, 255, 0.15)', borderRadius: '16px', border: '1px solid rgba(167, 191, 255, 0.4)' }}>
                <p style={{ color: 'var(--accent)', fontSize: 13, marginBottom: 12, fontWeight: 700, letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: 8 }}>
                   📍 LOCAL SUPPORT 
                </p>
                <div style={{ display: 'flex', gap: 12 }}>
                  <input 
                    type="text" 
                    placeholder="Enter city or zip code..." 
                    value={locationStr}
                    onChange={(e) => setLocationStr(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleFindTherapist()}
                    style={{ flex: 1, padding: '12px 16px', fontSize: 14 }}
                  />
                  <button 
                    className="btn-primary" 
                    onClick={handleFindTherapist}
                    style={{ padding: '12px 24px', fontSize: 14, borderRadius: '12px' }}
                  >
                    Search
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How it works + Disclaimer */}
        <div className="fade-up" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24, marginBottom: 40, animationDelay: '0.4s' }}>
          {/* Simple Explanation */}
          <div className="card" style={{ padding: '24px 32px' }}>
            <h3 style={{ fontSize: 20, marginBottom: 16, color: 'var(--text)' }}>MindCheck Analysis</h3>
            <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 12 }}>
              We compute your embedding against robust vectorized models trained on distinct global health datasets.
            </p>
            <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.7 }}>
              Our ML infrastructure dynamically ranks feature importance (like your daily stress, sleep quality, and academic/corporate coping habits) using SHAP values to predict clinically actionable triage states.
            </p>
          </div>
          
          {/* Highlighted Disclaimer */}
          <div style={{ background: 'rgba(254, 203, 110, 0.1)', border: '1px solid rgba(254, 203, 110, 0.3)', padding: '24px 32px', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h3 style={{ fontSize: 18, color: '#e69100', display: 'flex', alignItems: 'center', gap: 8 }}>
              ⚠️ Medical Disclaimer 
            </h3>
            <p style={{ fontSize: 14, color: 'var(--text)', opacity: 0.8, lineHeight: 1.6 }}>
              This risk score is a <strong>MindCheck triage prediction</strong> and <strong>NOT</strong> a clinical diagnosis.
            </p>
            <p style={{ fontSize: 14, color: 'var(--text)', opacity: 0.8, lineHeight: 1.6 }}>
              Only a licensed mental health professional can provide a formal medical evaluation and treatment plan. Please consult them directly.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="fade-up" style={{ display: 'flex', gap: 16, justifyContent: 'center', animationDelay: '0.5s' }}>
          <button className="btn-primary" onClick={() => navigate('/assessment')}>
            Retake Assessment
          </button>
          <button className="btn-outline" onClick={() => navigate('/')}>
            ← Exit to Dashboard
          </button>
        </div>

      </div>
    </div>
  )
}
