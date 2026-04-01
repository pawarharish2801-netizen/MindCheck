import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'

const TRIAGE_STEP = {
  title: "Welcome to MindCheck Triage",
  fields: [
    { key: 'Age', label: 'Age', type: 'number', placeholder: 'e.g. 24' },
    { key: 'Gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'] },
    { key: 'Profile', label: 'Which best describes you?', type: 'select', options: ['Student', 'Working Professional', 'Other / General'] }
  ]
};

// ─── STUDENT questions (matches Student_Depression_Dataset features) ───────────
const STUDENT_STEPS = [
  {
    title: "Academic Life",
    fields: [
      { key: 'Academic Pressure', label: 'How much academic pressure do you feel?', type: 'select', options: [
        {value: '1', label: '1 - Very Low'}, {value: '2', label: '2 - Low'}, {value: '3', label: '3 - Moderate'}, {value: '4', label: '4 - High'}, {value: '5', label: '5 - Severe'}
      ] },
      { key: 'CGPA', label: 'What is your current CGPA (out of 10)?', type: 'number', placeholder: 'e.g. 7.5' },
      { key: 'Study Satisfaction', label: 'Are you satisfied with your academic performance?', type: 'select', options: [
        {value: '1', label: '1 - Highly Dissatisfied'}, {value: '2', label: '2 - Dissatisfied'}, {value: '3', label: '3 - Neutral'}, {value: '4', label: '4 - Satisfied'}, {value: '5', label: '5 - Highly Satisfied'}
      ] },
      { key: 'Work/Study Hours', label: 'How many hours do you actively study or work each day?', type: 'number', placeholder: 'e.g. 6' },
    ]
  },
  {
    title: "Lifestyle & Health",
    fields: [
      { key: 'Sleep Duration', label: 'How many hours do you usually sleep at night?', type: 'select', options: ['Less than 5 hours', '5-6 hours', '6-7 hours', '7-8 hours', 'More than 8 hours'] },
      { key: 'Dietary Habits', label: 'How would you describe your daily eating habits?', type: 'select', options: ['Healthy', 'Moderate', 'Unhealthy'] },
      { key: 'Financial Stress', label: 'How stressed are you about your personal finances?', type: 'select', options: [
        {value: '1', label: '1 - Very Low (Secure)'}, {value: '2', label: '2 - Low'}, {value: '3', label: '3 - Moderate'}, {value: '4', label: '4 - High'}, {value: '5', label: '5 - Severe (Struggling)'}
      ] },
      { key: 'Family History of Mental Illness', label: 'Is there a history of mental health conditions in your family?', type: 'select', options: ['Yes', 'No'] },
    ]
  },
  {
    title: "Mental Wellbeing",
    fields: [
      { key: 'Have you ever had suicidal thoughts ?', label: 'Have you ever experienced suicidal thoughts?', type: 'select', options: ['Yes', 'No'] },
      { key: 'Work Pressure', label: 'How much pressure do you feel at your job? (If applicable)', type: 'select', options: [
        {value: '0', label: '0 - Not Applicable'}, {value: '1', label: '1 - Very Low'}, {value: '2', label: '2 - Low'}, {value: '3', label: '3 - Moderate'}, {value: '4', label: '4 - High'}, {value: '5', label: '5 - Severe'}
      ] },
      { key: 'Job Satisfaction', label: 'Are you satisfied with your current job? (If applicable)', type: 'select', options: [
        {value: '0', label: '0 - Not Applicable'}, {value: '1', label: '1 - Highly Dissatisfied'}, {value: '2', label: '2 - Dissatisfied'}, {value: '3', label: '3 - Neutral'}, {value: '4', label: '4 - Satisfied'}, {value: '5', label: '5 - Highly Satisfied'}
      ] },
    ]
  }
];

// ─── CORPORATE questions (matches survey.csv features) ────────────────────────
const CORPORATE_STEPS = [
  {
    title: "About Your Role (Risk Factors)",
    fields: [
      { key: 'family_history', label: 'Does anyone in your family have a history of mental health conditions?', type: 'select', options: ['Yes', 'No'] },
      { key: 'work_interfere', label: 'Do you ever feel like your mental health affects your focus or performance at work?', type: 'select', options: ['Never','Rarely','Sometimes','Often'] },
      { key: 'tech_company', label: 'Is your primary employer a tech company?', type: 'select', options: ['Yes', 'No'] },
      { key: 'benefits', label: 'Does your company provide specific mental health benefits or insurance?', type: 'select', options: ['Yes', 'No', "Don't know"] },
    ]
  },
  {
    title: "Workplace Support & Benefits",
    fields: [
      { key: 'care_options', label: 'Do you know how to access mental health care options provided by your employer?', type: 'select', options: ['Yes', 'No', 'Not sure'] },
      { key: 'wellness_program', label: 'Does your employer offer a structured wellness program?', type: 'select', options: ['Yes', 'No', "Don't know"] },
      { key: 'seek_help', label: 'Does your employer provide resources to learn more about mental health?', type: 'select', options: ['Yes', 'No', "Don't know"] },
      { key: 'anonymity', label: 'If you use your employer’s mental health resources, is your anonymity protected?', type: 'select', options: ['Yes', 'No', "Don't know"] },
    ]
  },
  {
    title: "Workplace Culture & Safety",
    fields: [
      { key: 'leave', label: 'How easy is it for you to request medical leave for a mental health condition?', type: 'select', options: ["Very easy","Somewhat easy","Somewhat difficult","Very difficult","Don't know"] },
      { key: 'coworkers', label: 'Would you feel comfortable discussing a personal mental health issue with your coworkers?', type: 'select', options: ['Yes', 'No', 'Some of them'] },
      { key: 'mental_health_interview', label: 'Would you bring up a mental health issue with a potential employer in a job interview?', type: 'select', options: ['Yes', 'No', 'Maybe'] },
      { key: 'phys_health_interview', label: 'Would you bring up a physical health issue with a potential employer in a job interview?', type: 'select', options: ['Yes', 'No', 'Maybe'] },
      { key: 'mental_vs_physical', label: 'Do you feel that your employer treats mental health as seriously as physical health?', type: 'select', options: ['Yes', 'No', "Don't know"] },
      { key: 'obs_consequence', label: 'Have you ever seen coworkers face negative consequences for taking mental health leave?', type: 'select', options: ['Yes', 'No'] },
    ]
  }
];

// ─── GENERAL questions (matches Mental_Health_Dataset features) ────────────────
const GENERAL_STEPS = [
  {
    title: "Background",
    fields: [
      { key: 'Occupation', label: 'What is your current occupation?', type: 'select', options: ['Corporate', 'Student', 'Business', 'Housewife', 'Others'] },
      { key: 'self_employed', label: 'Are you completely self-employed?', type: 'select', options: ['Yes', 'No'] },
      { key: 'family_history', label: 'Does anyone in your family have a history of mental health conditions?', type: 'select', options: ['Yes', 'No'] },
      { key: 'Days_Indoors', label: 'How many days have you spent completely indoors over the last few weeks?', type: 'select', options: ['1-14 days', 'Go out Every day', '15-30 days', '31-60 days', 'More than 2 months'] },
    ]
  },
  {
    title: "Mental Wellbeing",
    fields: [
      { key: 'Growing_Stress', label: 'Have you been feeling unusually stressed lately?', type: 'select', options: ['Yes', 'No'] },
      { key: 'Mental_Health_History', label: 'Have you ever been formally diagnosed with a mental health condition?', type: 'select', options: ['Yes', 'No'] },
      { key: 'Mood_Swings', label: 'How often do you experience sudden mood swings?', type: 'select', options: ['Low', 'Medium', 'High'] },
      { key: 'Coping_Struggles', label: 'Are you currently struggling to cope with daily life or challenges?', type: 'select', options: ['Yes', 'No'] },
      { key: 'Work_Interest', label: 'Have you lost interest in your work, hobbies, or daily activities?', type: 'select', options: ['Yes', 'No'] },
      { key: 'mental_health_interview', label: 'Would you feel safe discussing mental health in a formal job interview?', type: 'select', options: ['Yes', 'No', 'Maybe'] },
      { key: 'care_options', label: 'Do you know what local or employer care options are available to you?', type: 'select', options: ['Yes', 'No', 'Not sure'] },
    ]
  }
];

export default function Assessment() {
  const navigate   = useNavigate()
  const { currentUser } = useAuth()
  const [step, setStep]       = useState(0)
  const [form, setForm]       = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  // Determine which steps to show based on profile
  let activeSteps    = [TRIAGE_STEP];
  let assessmentType = 'corporate';

  if (form.Profile === 'Student') {
    activeSteps    = [...activeSteps, ...STUDENT_STEPS];
    assessmentType = 'student';
  } else if (form.Profile === 'Other / General') {
    activeSteps    = [...activeSteps, ...GENERAL_STEPS];
    assessmentType = 'general';
  } else if (form.Profile === 'Working Professional') {
    activeSteps    = [...activeSteps, ...CORPORATE_STEPS];
    assessmentType = 'corporate';
  }

  const current = activeSteps[step]

  const handleChange = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const isStepComplete = () =>
    current.fields.every(f => form[f.key] !== undefined && form[f.key] !== '')

  const handleNext = () => {
    if (step < activeSteps.length - 1) setStep(s => s + 1)
    else handleSubmit()
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      // Lowercase text fields that need it for the model encoders
      const payload = { 
        ...form, 
        assessment_type: assessmentType,
        user_email: currentUser?.email || 'anonymous',
        user_name: currentUser?.displayName || 'anonymous',
        user_uid: currentUser?.uid || 'anonymous'
      }
      const res = await axios.post('http://127.0.0.1:8013/api/predict/', payload)
      navigate('/result', { state: { result: res.data, form: payload } })
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="gradient-bg" style={{ minHeight: '100vh', padding: '60px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div className="container" style={{ width: '100%', maxWidth: 760 }}>

        {/* Header */}
        <div style={{ marginBottom: 40, textAlign: 'center' }} className="fade-up">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 24, cursor: 'pointer' }} onClick={() => navigate('/')}>
            <span style={{ fontSize: 28, filter: 'drop-shadow(0 4px 8px rgba(167, 191, 255, 0.4))' }}>🌸</span>
            <span className="heading-font" style={{ fontSize: 24, fontWeight: 700, letterSpacing: '0.5px' }}>MindCheck</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, alignItems: 'flex-end' }}>
            <span style={{ fontSize: 14, color: 'var(--muted)', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>Step {step + 1} of {activeSteps.length}</span>
            <span className="heading-font" style={{ fontSize: 20, color: 'var(--text)', fontWeight: 700 }}>{Math.round(((step+1)/activeSteps.length)*100)}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{
              width: `${((step+1)/activeSteps.length)*100}%`,
              background: 'linear-gradient(90deg, #a7bfff, #ffaecd)'
            }} />
          </div>
        </div>

        {/* Card */}
        <div className="card fade-up" key={step} style={{ animationDelay: '0.1s' }}>
          <h2 style={{ fontSize: 32, marginBottom: 12, color: 'var(--text)' }}>{current.title}</h2>
          <p style={{ color: 'var(--muted)', marginBottom: 36, fontSize: 16, lineHeight: 1.6, fontWeight: 400 }}>
            MindCheck uses your answers to estimate how likely it is that someone with a similar
            profile would need mental health treatment. Please answer honestly for a meaningful score.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            {current.fields.map(field => (
              <div key={field.key} style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ marginBottom: 10, fontSize: 14, color: 'var(--text)', fontWeight: 600, letterSpacing: '0.3px' }}>
                  {field.label}
                </label>
                {field.type === 'select' ? (
                  <select value={form[field.key] || ''} onChange={e => handleChange(field.key, e.target.value)}>
                    <option value="" disabled>Select an option...</option>
                    {field.options.map(o => {
                      const val = typeof o === 'object' ? o.value : o;
                      const label = typeof o === 'object' ? o.label : o;
                      return <option key={val} value={val}>{label}</option>
                    })}
                  </select>
                ) : (
                  <input
                    type={field.type}
                    placeholder={field.placeholder}
                    value={form[field.key] || ''}
                    onChange={e => handleChange(field.key, e.target.value)}
                  />
                )}
              </div>
            ))}
          </div>

          {error && (
            <div style={{ background: 'rgba(243, 143, 143, 0.1)', border: '1px solid rgba(243, 143, 143, 0.3)', color: 'var(--red)', padding: '16px', borderRadius: '12px', marginTop: 32, fontSize: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>⚠️</span> {error}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 48, alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
            <button className="btn-outline"
              onClick={() => setStep(s => s - 1)}
              style={{ visibility: step === 0 ? 'hidden' : 'visible' }}>
              ← Back
            </button>

            <div style={{ display: 'flex', gap: 8 }}>
              {activeSteps.map((_, i) => (
                <div key={i} className={`step-dot ${i <= step ? 'active' : ''}`} />
              ))}
            </div>

            <button className="btn-primary"
              onClick={handleNext}
              disabled={!isStepComplete() || loading}
              style={{ minWidth: 140 }}>
                  {loading ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                       <svg style={{ animation: 'spin 1s linear infinite', height: 16, width: 16 }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                       Analyzing...
                    </span>
                  ) : step === activeSteps.length - 1 ? 'Get Results' : 'Continue →'}
            </button>
          </div>
        </div>

      </div>
      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
