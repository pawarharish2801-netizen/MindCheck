import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { currentUser, logout } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/user-history/?user_uid=${currentUser.uid}`);
        setHistory(response.data);
      } catch (err) {
        console.error("Failed to fetch history:", err);
      } finally {
        setLoading(false);
      }
    };
    if (currentUser) fetchHistory();
  }, [currentUser]);

  const chartData = [...history].reverse().map(item => ({
    date: new Date(item.timestamp).toLocaleDateString(),
    score: item.risk_score
  }));

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (loading) return <div className="loading">Loading your wellness profile...</div>;

  return (
    <div className="profile-container" style={{ padding: '40px 20px', maxWidth: 1000, margin: '0 auto' }}>
      {/* Header Section */}
      <div className="profile-header" style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 40, background: 'var(--card)', padding: 30, borderRadius: 24,
        boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: '1px solid var(--border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <img src={currentUser?.photoURL || 'https://ui-avatars.com/api/?name=' + currentUser?.displayName}
            alt="Profile"
            style={{ width: 80, height: 80, borderRadius: '50%', border: '4px solid #fff', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
          />
          <div>
            <h1 className="heading-font" style={{ fontSize: 32, margin: 0 }}>{currentUser?.displayName}</h1>
            <p style={{ color: 'var(--muted)', margin: '4px 0 0' }}>{currentUser?.email}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="btn-secondary" style={{ padding: '12px 24px' }}>Sign Out</button>
      </div>

      {/* Stats and Charts */}
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 30, marginBottom: 40 }}>

        {/* Trend Chart */}
        <div className="stat-card" style={{
          background: 'var(--card)', padding: 30, borderRadius: 24, gridColumn: 'span 2',
          border: '1px solid var(--border)', boxShadow: '0 10px 30px rgba(0,0,0,0.05)'
        }}>
          <h2 className="heading-font" style={{ fontSize: 22, marginBottom: 24 }}>Wellness Journey</h2>
          <div style={{ width: '100%', height: 300 }}>
            {chartData.length > 0 ? (
              <ResponsiveContainer>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" hide />
                  <YAxis hide domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
                    itemStyle={{ color: 'var(--accent)', fontWeight: 700 }}
                  />
                  <Area type="monotone" dataKey="score" stroke="var(--accent)" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
                Take your first assessment to see your trend!
              </div>
            )}
          </div>
        </div>

        {/* Recent Score Summary */}
        <div className="stat-card" style={{
          background: 'linear-gradient(135deg, var(--accent), #ff9eb5)', padding: 30, borderRadius: 24,
          color: '#fff', border: 'none', boxShadow: '0 10px 30px rgba(167, 191, 255, 0.4)'
        }}>
          <h2 className="heading-font" style={{ fontSize: 22, marginBottom: 12 }}>Current Status</h2>
          {history.length > 0 ? (
            <>
              <div style={{ fontSize: 64, fontWeight: 800, marginBottom: 4 }}>{history[0].risk_score}%</div>
              <div style={{ fontSize: 18, fontWeight: 600, opacity: 0.9 }}>{history[0].risk_tier}</div>
              <p style={{ fontSize: 14, marginTop: 20, opacity: 0.8, lineHeight: 1.5 }}>
                {history[0].referral}
              </p>
            </>
          ) : (
            <p>No assessment data yet.</p>
          )}
        </div>
      </div>

      {/* History List */}
      <div className="history-section" style={{ background: 'var(--card)', padding: 30, borderRadius: 24, border: '1px solid var(--border)' }}>
        <h2 className="heading-font" style={{ fontSize: 22, marginBottom: 24 }}>Assessment History</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {history.map((item, idx) => (
            <div key={idx} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '16px 20px', background: 'rgba(255,255,255,0.5)', borderRadius: 16,
              border: '1px solid var(--border)'
            }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, textTransform: 'capitalize' }}>{item.assessment_type} Assessment</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{new Date(item.timestamp).toLocaleString()}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  fontWeight: 800, fontSize: 18,
                  color: item.risk_tier === 'High Risk' ? 'var(--red)' : item.risk_tier === 'Moderate Risk' ? 'var(--orange)' : 'var(--green)'
                }}>
                  {item.risk_score}%
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.7 }}>{item.risk_tier}</div>
              </div>
            </div>
          ))}
          {history.length === 0 && <p style={{ textAlign: 'center', color: 'var(--muted)', padding: 40 }}>Your history will appear here.</p>}
        </div>
      </div>
    </div>
  );
}
