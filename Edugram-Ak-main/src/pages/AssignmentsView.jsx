import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Send, RefreshCcw, Award } from 'lucide-react';
import { useProgress } from '../context/ProgressContext';
import { generateAssignment, generateAssignmentFeedback } from '../services/llmService';

const AssignmentsView = () => {
  const { topicId, subtopicId } = useParams();
  const index = parseInt(subtopicId, 10);
  const { currentUser, saveAssignmentSubmission } = useProgress();
  const navigate = useNavigate();

  const [assignment, setAssignment] = useState('');
  const [isLoadingAssignment, setIsLoadingAssignment] = useState(true);
  const [submission, setSubmission] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [error, setError] = useState('');

  const topic = currentUser.topics?.find((t) => t.id === topicId);
  const subtopic = topic ? topic.syllabus[index] : null;
  const existingAssignment = topic && topic.assignments
    ? topic.assignments.find(a => a.subtopicTitle === subtopic?.title)
    : null;

  useEffect(() => {
    if (!topic || !subtopic) {
      navigate('/');
      return;
    }

    const fetchAssignment = async () => {
      setIsLoadingAssignment(true);
      setError('');
      try {
        const text = await generateAssignment(topic.name, subtopic.title);
        setAssignment(text);
        if (existingAssignment && existingAssignment.submission) {
          setSubmission(existingAssignment.submission);
          setFeedback(existingAssignment.feedback || '');
          setScore(existingAssignment.score || 0);
          setShowFeedback(true);
        }
      } catch (err) {
        setError('Failed to generate assignment.');
      } finally {
        setIsLoadingAssignment(false);
      }
    };

    fetchAssignment();
  }, [topicId, index, topic?.id, subtopic?.title, navigate]);

  const handleSubmit = async () => {
    if (!submission.trim()) return;

    setIsEvaluating(true);
    setError('');
    try {
      const feedbackText = await generateAssignmentFeedback(topic.name, subtopic.title, submission);
      
      // Extract score from feedback (look for "Score: X/10" pattern)
      const scoreMatch = feedbackText.match(/Score:\s*(\d+)\/\d+/i);
      const extractedScore = scoreMatch ? parseInt(scoreMatch[1]) : 7;

      setFeedback(feedbackText);
      setScore(extractedScore);
      setShowFeedback(true);
      
      // Save to context
      saveAssignmentSubmission(topicId, subtopic.title, submission, feedbackText, extractedScore);
    } catch (err) {
      setError('Failed to generate feedback. Please try again.');
    } finally {
      setIsEvaluating(false);
    }
  };

  if (!topic || !subtopic) return null;

  return (
    <div className="container animate-fade-in" style={{ maxWidth: '1000px', display: 'flex', gap: '2rem', flexDirection: 'column' }}>
      {/* Header */}
      <div>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--color-primary)' }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <span style={{ color: 'var(--color-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {topic.name}
          </span>
          <h1 style={{ fontSize: '2.5rem', marginTop: '0.5rem' }}>Assignments: {subtopic.title}</h1>
          <p style={{ color: 'var(--color-text-muted)', marginTop: '0.75rem' }}>
            Complete practical exercises to reinforce your learning
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Assignment */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ marginTop: 0 }}>Assignment Tasks</h2>
          {isLoadingAssignment ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <RefreshCcw size={32} color="var(--color-primary)" className="animate-spin" style={{ marginBottom: '1rem' }} />
              <p style={{ color: 'var(--color-primary)' }}>Generating assignment...</p>
            </div>
          ) : error ? (
            <div style={{ padding: '1rem', background: 'rgba(244, 63, 94, 0.1)', color: 'var(--color-accent)', borderRadius: 'var(--radius-md)' }}>
              {error}
            </div>
          ) : (
            <div className="markdown-content" style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>
              {assignment.split('\n').map((line, i) => {
                if (line.startsWith('**')) {
                  return <h3 key={i} style={{ marginTop: '1.5rem', marginBottom: '0.75rem' }}>{line.replace(/\*\*/g, '')}</h3>;
                }
                if (line.startsWith('-')) {
                  return <li key={i} style={{ marginLeft: '1.5rem', marginBottom: '0.5rem' }}>{line.substring(1).trim()}</li>;
                }
                if (line.trim() === '') return null;
                return <p key={i} style={{ marginBottom: '0.5rem' }}>{line}</p>;
              })}
            </div>
          )}
        </div>

        {/* Submission Form or Feedback */}
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ marginTop: 0 }}>Your Submission</h2>
          
          {!showFeedback ? (
            <>
              <textarea
                placeholder="Write your solution/response here..."
                value={submission}
                onChange={(e) => setSubmission(e.target.value)}
                disabled={isEvaluating}
                style={{
                  flex: 1,
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-main)',
                  fontFamily: 'monospace',
                  fontSize: '0.9rem',
                  minHeight: '200px',
                  resize: 'vertical',
                  marginBottom: '1rem'
                }}
              />
              
              <button
                onClick={handleSubmit}
                disabled={!submission.trim() || isEvaluating}
                className="btn btn-primary"
                style={{
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  opacity: !submission.trim() || isEvaluating ? 0.5 : 1,
                  cursor: !submission.trim() || isEvaluating ? 'not-allowed' : 'pointer'
                }}
              >
                {isEvaluating ? (
                  <>
                    <RefreshCcw size={16} className="animate-spin" /> Evaluating...
                  </>
                ) : (
                  <>
                    <Send size={16} /> Submit & Get Feedback
                  </>
                )}
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>
              {/* Score */}
              <div style={{
                padding: '1.5rem',
                background: 'rgba(14, 165, 233, 0.1)',
                borderRadius: 'var(--radius-md)',
                border: `2px solid var(--color-secondary)`,
                textAlign: 'center'
              }}>
                <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Your Score</p>
                <h2 style={{ margin: '0.5rem 0 0 0', fontSize: '2.5rem', color: 'var(--color-secondary)' }}>
                  {score}/10
                </h2>
              </div>

              {/* Feedback */}
              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '1rem',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)'
              }}>
                <h3 style={{ marginTop: 0 }}>Feedback</h3>
                <div className="markdown-content" style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
                  {feedback.split('\n').map((line, i) => {
                    if (line.startsWith('**') && line.endsWith('**')) {
                      return <h4 key={i} style={{ margin: '1rem 0 0.5rem 0' }}>{line.replace(/\*\*/g, '')}</h4>;
                    }
                    if (line.startsWith('-')) {
                      return <li key={i} style={{ marginLeft: '1.5rem' }}>{line.substring(1).trim()}</li>;
                    }
                    if (line.trim() === '') return null;
                    return <p key={i} style={{ marginBottom: '0.5rem' }}>{line}</p>;
                  })}
                </div>
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={() => {
                    setSubmission('');
                    setFeedback('');
                    setShowFeedback(false);
                    setScore(0);
                  }}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  <RefreshCcw size={16} /> Try Again
                </button>
                <Link to={`/learn/${topicId}/${index}`} className="btn btn-primary" style={{ flex: 1, textAlign: 'center' }}>
                  <CheckCircle size={16} /> Back to Content
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssignmentsView;
