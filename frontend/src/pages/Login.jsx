import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  async function handleGoogleSignIn() {
    try {
      setError('');
      setLoading(true);
      await loginWithGoogle();
      navigate('/');
    } catch (err) {
      console.error(err);
      setError(`Auth Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="gradient-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="container" style={{ padding: '40px 24px', maxWidth: 460 }}>
        <div className="card fade-up" style={{ textAlign: 'center', padding: '48px 32px' }}>
          
          <div style={{
            width: 60, height: 60, borderRadius: 16,
            background: '#fff', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px', fontSize: 28
          }}>🧠</div>
          
          <h2 style={{ fontSize: 28, marginBottom: 8, color: 'var(--text)' }}>Welcome to MindCheck</h2>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 32 }}>
            Sign in to start your personalized mental health assessment. Your results are 100% confidential.
          </p>

          {error && (
            <div style={{ background: '#fdecec', color: 'var(--red)', padding: '12px', borderRadius: 8, fontSize: 13, marginBottom: 24, border: '1px solid #f5caca' }}>
              {error}
            </div>
          )}

          <button 
            className="btn-primary" 
            onClick={handleGoogleSignIn} 
            disabled={loading}
            style={{ 
              width: '100%', 
              padding: '16px', 
              fontSize: 16, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: 12,
              background: '#fff',
              color: 'var(--text)',
              border: '1px solid var(--border)'
            }}
          >
            <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google Logo" style={{ width: 20, height: 20 }} />
            {loading ? 'Connecting...' : 'Continue with Google'}
          </button>
          
          <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 24, lineHeight: 1.6 }}>
            By continuing, you agree to MindCheck's anonymous data processing policy for diagnostic evaluation.
          </p>

        </div>
      </div>
    </div>
  );
}
