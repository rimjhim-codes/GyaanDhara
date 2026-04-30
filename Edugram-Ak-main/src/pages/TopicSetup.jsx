import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Loader } from 'lucide-react';
import { useProgress } from '../context/ProgressContext';
import { generateSyllabus } from '../services/llmService';

const TopicSetup = () => {
  const [topic, setTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { addTopic } = useProgress();
  const navigate = useNavigate();

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      const syllabus = await generateSyllabus(topic);
      if (!Array.isArray(syllabus) || syllabus.length === 0) {
         throw new Error("Invalid syllabus generated.");
      }
      
      addTopic(topic, syllabus);
      
      // Navigate back to dashboard to see the new topic
      navigate('/');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to generate syllabus. Ensure Ollama is running.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container animate-fade-in" style={{ maxWidth: '800px', marginTop: '4rem' }}>
      <div className="glass-panel">
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ display: 'inline-flex', padding: '1rem', background: 'rgba(14, 165, 233, 0.2)', borderRadius: '50%', marginBottom: '1rem' }}>
            <Sparkles size={48} color="var(--color-secondary)" />
          </div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>What do you want to learn?</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '1.2rem' }}>
            Enter any subject, and DeepSeek AI will instantly generate a structured curriculum customized for you.
          </p>
        </div>

        <form onSubmit={handleGenerate}>
          <div style={{ position: 'relative', marginBottom: '2rem' }}>
            <input
              type="text"
              className="input-field"
              placeholder="e.g., Quantum Computing, React.js, World History"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={isLoading}
              style={{ fontSize: '1.2rem', padding: '1.5rem', paddingRight: '150px' }}
              autoFocus
            />
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={isLoading || !topic.trim()}
              style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)' }}
            >
              {isLoading ? (
                <>Generating <Loader size={18} className="animate-spin" /></>
              ) : (
                <>Build Now <ArrowRight size={18} /></>
              )}
            </button>
          </div>
          
          {error && (
             <div style={{ padding: '1rem', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid var(--color-accent)', borderRadius: 'var(--radius-md)', color: 'var(--color-accent)', marginBottom: '2rem' }}>
               {error}
             </div>
          )}

          {isLoading && (
            <div className="animate-pulse" style={{ marginTop: '2rem', padding: '2rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--color-primary)', opacity: '0.5' }}></div>
                <div>
                  <div style={{ height: '15px', width: '200px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '8px', marginBottom: '8px' }}></div>
                  <div style={{ height: '10px', width: '150px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px' }}></div>
                </div>
              </div>
              <p style={{ textAlign: 'center', color: 'var(--color-primary)', fontStyle: 'italic' }}>
                Brainstorming structure with DeepSeek R1...
              </p>
            </div>
          )}
        </form>
      </div>

      <style>{`
        .animate-spin { animation: spin 2s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default TopicSetup;
