import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { marked } from 'marked';
import { X, Play, Pause, RotateCcw, AlertCircle, CheckCircle } from 'lucide-react';
import { useProgress } from '../context/ProgressContext';

const FocusMode = () => {
  const { topicId, subtopicId } = useParams();
  const index = parseInt(subtopicId, 10);
  const { currentUser, updateStreakAndTime } = useProgress();
  const navigate = useNavigate();

  const [workDuration, setWorkDuration] = useState(25); // 25 minutes default (Pomodoro)
  const [breakDuration, setBreakDuration] = useState(5); // 5 minutes default
  const [timeLeft, setTimeLeft] = useState(25 * 60); // in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [totalFocusTime, setTotalFocusTime] = useState(0);

  const topic = currentUser.topics?.find((t) => t.id === topicId);
  const subtopic = topic ? topic.syllabus[index] : null;
  const content = topic?.cachedContent[subtopic?.title] || '';

  // Timer logic
  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            playNotification();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  // Auto switch between work and break
  useEffect(() => {
    if (timeLeft === 0 && isRunning) {
      if (!isBreak) {
        setSessionsCompleted(s => s + 1);
        setTotalFocusTime(t => t + workDuration);
        updateStreakAndTime(workDuration);
        setIsBreak(true);
        setTimeLeft(breakDuration * 60);
        setIsRunning(true);
      } else {
        setIsBreak(false);
        setTimeLeft(workDuration * 60);
        // Auto-start next session
        setIsRunning(true);
      }
    }
  }, [timeLeft, isRunning, isBreak]);

  const playNotification = () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gain.gain.setValueAtTime(0.3, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  const toggleTimer = () => setIsRunning(!isRunning);
  const resetTimer = () => {
    setIsRunning(false);
    setIsBreak(false);
    setTimeLeft(workDuration * 60);
    setTotalFocusTime(0);
    setSessionsCompleted(0);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (!topic || !subtopic || !content) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <p style={{ color: 'var(--color-accent)' }}>Content not found. Please read the lesson first.</p>
        <Link to={`/learn/${topicId}/${index}`} style={{ color: 'var(--color-primary)' }}>
          Go back to lesson
        </Link>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, rgba(20, 20, 35, 0.95), rgba(10, 10, 25, 0.95))',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '2rem',
      fontFamily: 'var(--font-body)'
    }}>
      {/* Minimalist Header */}
      <div style={{ alignSelf: 'flex-end', marginBottom: '2rem' }}>
        <Link
          to={`/learn/${topicId}/${index}`}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-text-muted)',
            cursor: 'pointer',
            fontSize: '2rem',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <X size={24} />
        </Link>
      </div>

      <div style={{ maxWidth: '900px', width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', alignItems: 'start' }}>
        {/* Left: Pomodoro Timer */}
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '2rem' }}>
            {isBreak ? 'Break Time' : 'Focus Time'}
          </h2>

          {/* Timer Display */}
          <div style={{
            fontSize: '120px',
            fontWeight: 'bold',
            color: isBreak ? 'var(--color-secondary)' : 'var(--color-primary)',
            fontFamily: 'monospace',
            marginBottom: '3rem',
            letterSpacing: '10px'
          }}>
            {formatTime(timeLeft)}
          </div>

          {/* Status Bar */}
          <div style={{ marginBottom: '3rem' }}>
            <div style={{ height: '4px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '2px', overflow: 'hidden', marginBottom: '1rem' }}>
              <div style={{
                height: '100%',
                width: `${(isBreak ? breakDuration * 60 - timeLeft : workDuration * 60 - timeLeft) / (isBreak ? breakDuration * 60 : workDuration * 60) * 100}%`,
                background: isBreak ? 'var(--color-secondary)' : 'var(--color-primary)',
                transition: 'width 0.1s linear'
              }} />
            </div>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', margin: 0 }}>
              Session {sessionsCompleted + 1} • {totalFocusTime} min focused
            </p>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '2rem' }}>
            <button
              onClick={toggleTimer}
              style={{
                padding: '1rem 2rem',
                background: 'var(--color-primary)',
                border: 'none',
                color: 'white',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              {isRunning ? <Pause size={18} /> : <Play size={18} />}
              {isRunning ? 'Pause' : 'Start'}
            </button>
            <button
              onClick={resetTimer}
              style={{
                padding: '1rem 2rem',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid var(--color-border)',
                color: 'white',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <RotateCcw size={18} /> Reset
            </button>
          </div>

          {/* Settings */}
          <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '1.5rem', borderRadius: '8px', marginTop: '2rem' }}>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>Pomodoro Settings</p>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ fontSize: '0.9rem', color: 'var(--color-text-main)' }}>Work: {workDuration} min</label>
                <input
                  type="range"
                  min="5"
                  max="60"
                  value={workDuration}
                  onChange={(e) => {
                    setWorkDuration(parseInt(e.target.value));
                    if (!isBreak) setTimeLeft(parseInt(e.target.value) * 60);
                  }}
                  disabled={isRunning}
                  style={{ flex: 1, marginLeft: '1rem' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ fontSize: '0.9rem', color: 'var(--color-text-main)' }}>Break: {breakDuration} min</label>
                <input
                  type="range"
                  min="1"
                  max="15"
                  value={breakDuration}
                  onChange={(e) => {
                    setBreakDuration(parseInt(e.target.value));
                    if (isBreak) setTimeLeft(parseInt(e.target.value) * 60);
                  }}
                  disabled={isRunning}
                  style={{ flex: 1, marginLeft: '1rem' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Content */}
        <div style={{
          maxHeight: '80vh',
          overflowY: 'auto',
          padding: '2rem',
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h3 style={{ marginTop: 0, color: 'var(--color-primary)', marginBottom: '1rem' }}>
            {subtopic.title}
          </h3>
          <div className="markdown-content" style={{
            color: 'var(--color-text-main)',
            fontSize: '0.95rem',
            lineHeight: '1.6'
          }}>
            {marked(content)}
          </div>
        </div>
      </div>

      {/* Tips */}
      <div style={{
        marginTop: '3rem',
        padding: '1.5rem',
        background: 'rgba(14, 165, 233, 0.1)',
        border: '1px solid rgba(14, 165, 233, 0.3)',
        borderRadius: '8px',
        maxWidth: '900px',
        width: '100%'
      }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          <AlertCircle size={20} color="var(--color-secondary)" style={{ marginTop: '0.25rem', flexShrink: 0 }} />
          <div>
            <p style={{ margin: 0, fontWeight: 'bold', color: 'var(--color-secondary)', marginBottom: '0.5rem' }}>Focus Mode Tips</p>
            <ul style={{ margin: 0, paddingLeft: '1.5rem', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
              <li>Minimize distractions during focus sessions</li>
              <li>Use break time to stretch and rest your eyes</li>
              <li>Track your productivity with Pomodoro sessions</li>
              <li>After 4 sessions, take a longer 15-30 min break</li>
            </ul>
          </div>
        </div>
      </div>

      <style>{`
        input[type="range"] {
          cursor: pointer;
          background: linear-gradient(to right, var(--color-primary) 0%, var(--color-primary) 50%, rgba(255, 255, 255, 0.2) 50%, rgba(255, 255, 255, 0.2) 100%);
          -webkit-appearance: none;
          appearance: none;
          height: 6px;
          border-radius: 3px;
          outline: none;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--color-primary);
          cursor: pointer;
        }
        input[type="range"]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--color-primary);
          cursor: pointer;
          border: none;
        }
        input[type="range"]:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default FocusMode;
