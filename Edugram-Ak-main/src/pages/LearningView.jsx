import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { marked } from 'marked';
import { BookOpen, HelpCircle, Target, ArrowLeft, CheckCircle, RefreshCcw, FileText, BookMarked } from 'lucide-react';
import { useProgress } from '../context/ProgressContext';
import { generateContent } from '../services/llmService';
import TableOfContents from '../components/TableOfContents';

const LearningView = () => {
  const { topicId, subtopicId } = useParams();
  const index = parseInt(subtopicId, 10);
  const { currentUser, markSubtopicComplete, saveSubtopicContent, updateStreakAndTime } = useProgress();
  const navigate = useNavigate();

  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [customInstructions, setCustomInstructions] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);

  const topic = currentUser.topics?.find((t) => t.id === topicId);
  const subtopic = topic ? topic.syllabus[index] : null;
  const isCompleted = subtopic && topic.completedSubtopics.includes(subtopic.title);

  useEffect(() => {
    if (!topic || !subtopic) {
       navigate('/');
       return;
    }
    
    // Track learning session
    updateStreakAndTime(0); // Log visit without counting time yet
    
    // Check Cache First
    const cached = topic.cachedContent && topic.cachedContent[subtopic.title];
    if (cached) {
      setContent(cached);
      setIsLoading(false);
      return;
    }

    const fetchContent = async () => {
      setIsLoading(true);
      setError('');
      try {
        const text = await generateContent(topic.name, subtopic.title);
        setContent(text);
        saveSubtopicContent(topicId, subtopic.title, text);
      } catch (err) {
        setError("Failed to fetch content from local LLM.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, [topicId, index, topic?.id, subtopic?.title, navigate]); // Intentionally omitting full topic/subtopic object hooks

  const handleRegenerate = async () => {
    if (!customInstructions.trim() || !topic || !subtopic) return;
    
    setIsRegenerating(true);
    setError('');
    try {
      const newText = await generateContent(topic.name, subtopic.title, customInstructions);
      setContent(newText);
      saveSubtopicContent(topicId, subtopic.title, newText);
      setCustomInstructions(''); // clear on success
    } catch (err) {
      setError("Failed to regenerate with custom instructions.");
    } finally {
      setIsRegenerating(false);
    }
  };

  const createMarkup = (markdown) => {
    return { __html: marked(markdown) };
  };

  const handleMarkComplete = () => {
    markSubtopicComplete(topicId, subtopic.title);
  };

  if (!topic || !subtopic) return null;

  return (
    <div className="container animate-fade-in" style={{ maxWidth: '1100px', display: 'flex', gap: '2rem' }}>
      {/* Sidebar Navigation */}
      <aside style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--color-primary)' }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        <TableOfContents topicId={topicId} topic={topic} currentIndex={index} />
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1 }}>
        <div className="glass-panel" style={{ minHeight: '600px' }}>
          <header style={{ marginBottom: '2rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
            <span style={{ color: 'var(--color-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
              {topic.name}
            </span>
            <h1 style={{ fontSize: '2.5rem', marginTop: '0.5rem' }}>{subtopic.title}</h1>
            <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', marginTop: '0.5rem' }}>
              {subtopic.description}
            </p>
          </header>

          {isLoading ? (
             <div style={{ textAlign: 'center', padding: '4rem 0' }}>
               <div style={{ display: 'inline-block', position: 'relative' }}>
                 <BookOpen size={64} color="rgba(124, 58, 237, 0.4)" style={{ position: 'absolute' }} className="animate-pulse" />
                 <BookOpen size={64} color="var(--color-primary)" />
               </div>
               <h3 style={{ marginTop: '2rem', color: 'var(--color-primary)' }}>Generating personalized lesson...</h3>
             </div>
          ) : error ? (
             <div style={{ padding: '2rem', background: 'rgba(244, 63, 94, 0.1)', color: 'var(--color-accent)', borderRadius: 'var(--radius-md)' }}>
               {error}
             </div>
          ) : (
             <div className="animate-fade-in content-area">
               <div 
                 className="markdown-content"
                 dangerouslySetInnerHTML={createMarkup(content)} 
                 style={{ opacity: isRegenerating ? 0.3 : 1, transition: 'opacity 0.3s' }}
               />
               
               {isRegenerating && (
                 <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                   <RefreshCcw size={32} color="var(--color-primary)" className="animate-spin" style={{ marginBottom: '1rem' }} />
                   <p style={{ color: 'var(--color-primary)' }}>Regenerating with your instructions...</p>
                 </div>
               )}
               
               {!isRegenerating && (
                 <div style={{ marginTop: '3rem', padding: '1.5rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                   <h4 style={{ marginBottom: '1rem', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Need a different approach? Try quick prompts:</h4>
                   
                   {/* Quick Prompt Buttons */}
                   <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                     {[
                       'Explain in simple terms',
                       'Give more examples',
                       'Add diagrams/analogies',
                       'Focus on key points',
                       'Make it more technical',
                       'Add practice problems'
                     ].map((prompt) => (
                       <button
                         key={prompt}
                         onClick={() => {
                           setCustomInstructions(prompt);
                           // Auto-regenerate if desired
                         }}
                         style={{
                           padding: '0.5rem 1rem',
                           background: customInstructions === prompt ? 'var(--color-primary)' : 'rgba(124, 58, 237, 0.2)',
                           color: 'var(--color-text-main)',
                           border: 'none',
                           borderRadius: '4px',
                           cursor: 'pointer',
                           fontSize: '0.85rem',
                           transition: 'background 0.2s'
                         }}
                         onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-primary)'}
                         onMouseLeave={(e) => e.currentTarget.style.background = customInstructions === prompt ? 'var(--color-primary)' : 'rgba(124, 58, 237, 0.2)'}
                       >
                         {prompt}
                       </button>
                     ))}
                   </div>

                   {/* Custom Instruction Input */}
                   <div style={{ display: 'flex', gap: '0.5rem' }}>
                     <input
                       type="text"
                       className="input-field"
                       placeholder="Or write your own custom instructions..."
                       value={customInstructions}
                       onChange={(e) => setCustomInstructions(e.target.value)}
                       style={{ flex: 1, padding: '0.75rem', fontSize: '0.95rem' }}
                     />
                     <button onClick={handleRegenerate} disabled={!customInstructions.trim() || isRegenerating} className="btn btn-secondary">
                        <RefreshCcw size={16} /> Regenerate
                     </button>
                   </div>
                 </div>
               )}
             </div>
          )}

          {!isLoading && !error && (
            <footer style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                {!isCompleted ? (
                   <button onClick={handleMarkComplete} className="btn" style={{ background: 'var(--color-bg-base)', border: '1px solid var(--color-secondary)', color: 'var(--color-text-main)' }}>
                     <CheckCircle size={18} /> Mark as Read
                   </button>
                ) : (
                   <span style={{ color: 'var(--color-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                     <CheckCircle size={18} /> Completed
                   </span>
                )}
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <Link to={`/notes/${topicId}/${index}`} className="btn btn-secondary" style={{ padding: '1rem 2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <BookMarked size={18} /> Smart Notes
                </Link>

                <Link to={`/assignment/${topicId}/${index}`} className="btn btn-secondary" style={{ padding: '1rem 2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={18} /> Assignments
                </Link>
                
                <Link to={`/quiz/${topicId}/${index}`} className="btn btn-primary" style={{ padding: '1rem 2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <HelpCircle size={18} /> Take Quiz
                </Link>
              </div>
            </footer>
          )}
        </div>
      </main>
      <style>{`
        .animate-spin { animation: spin 2s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default LearningView;
