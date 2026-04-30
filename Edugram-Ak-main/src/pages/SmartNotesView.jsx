import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, FileText, RefreshCcw, Save, BookMarked, HelpCircle } from 'lucide-react';
import { useProgress } from '../context/ProgressContext';
import { generateSmartNotes, generateStudyGuide, generateFlashcards } from '../services/llmService';

const SmartNotesView = () => {
  const { topicId, subtopicId } = useParams();
  const index = parseInt(subtopicId, 10);
  const { currentUser, saveSmartNotes } = useProgress();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('smart-notes'); // smart-notes, study-guide, flashcards
  const [smartNotes, setSmartNotes] = useState('');
  const [studyGuide, setStudyGuide] = useState('');
  const [flashcards, setFlashcards] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  const topic = currentUser.topics?.find((t) => t.id === topicId);
  const subtopic = topic ? topic.syllabus[index] : null;
  const content = topic?.cachedContent[subtopic?.title] || '';
  const existingNotes = topic?.notes?.find(n => n.subtopicTitle === subtopic?.title);

  useEffect(() => {
    if (!topic || !subtopic) {
      navigate('/');
      return;
    }

    // Load existing notes if available
    if (existingNotes) {
      setSmartNotes(existingNotes.smartNotes || '');
      setStudyGuide(existingNotes.studyGuide || '');
      setFlashcards(existingNotes.flashcards || '');
      setIsSaved(true);
    }
  }, [topicId, index, topic?.id, subtopic?.title, navigate]);

  const generateNotes = async () => {
    if (!content) {
      setError('Please read the content first before generating notes.');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const tasks = [
        generateSmartNotes(content),
        generateStudyGuide(topic.name, subtopic.title, content),
        generateFlashcards(topic.name, subtopic.title, content)
      ];

      const [notes, guide, cards] = await Promise.all(tasks);
      
      setSmartNotes(notes);
      setStudyGuide(guide);
      setFlashcards(cards);
      setIsSaved(false);
    } catch (err) {
      setError('Failed to generate notes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveNotes = () => {
    if (smartNotes || studyGuide || flashcards) {
      saveSmartNotes(topicId, subtopic.title, smartNotes, studyGuide, flashcards);
      setIsSaved(true);
    }
  };

  if (!topic || !subtopic) return null;

  const renderContent = () => {
    let text = '';
    switch (activeTab) {
      case 'smart-notes':
        text = smartNotes;
        break;
      case 'study-guide':
        text = studyGuide;
        break;
      case 'flashcards':
        text = flashcards;
        break;
      default:
        return null;
    }

    return (
      <div className="markdown-content" style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>
        {text.split('\n').map((line, i) => {
          if (line.startsWith('**') && line.endsWith('**')) {
            return <h3 key={i} style={{ marginTop: '1.5rem', marginBottom: '0.75rem' }}>{line.replace(/\*\*/g, '')}</h3>;
          }
          if (line.startsWith('#')) {
            const level = line.match(/^#+/)[0].length;
            const tag = `h${level + 2}`;
            return React.createElement(tag, { key: i, style: { marginTop: '1rem', marginBottom: '0.5rem' } }, line.replace(/^#+\s/, ''));
          }
          if (line.startsWith('-')) {
            return <li key={i} style={{ marginLeft: '1.5rem', marginBottom: '0.5rem' }}>{line.substring(1).trim()}</li>;
          }
          if (line.trim() === '') return null;
          return <p key={i} style={{ marginBottom: '0.5rem' }}>{line}</p>;
        })}
      </div>
    );
  };

  return (
    <div className="container animate-fade-in" style={{ maxWidth: '1000px' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <Link to={`/learn/${topicId}/${index}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--color-primary)' }}>
          <ArrowLeft size={16} /> Back to Content
        </Link>
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <span style={{ color: 'var(--color-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {topic.name}
          </span>
          <h1 style={{ fontSize: '2.5rem', marginTop: '0.5rem' }}>Smart Notes: {subtopic.title}</h1>
          <p style={{ color: 'var(--color-text-muted)', marginTop: '0.75rem' }}>
            Auto-generated study materials for efficient learning
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 250px', gap: '2rem' }}>
        {/* Notes Content */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
            {[
              { id: 'smart-notes', label: 'Smart Notes', icon: <FileText size={16} /> },
              { id: 'study-guide', label: 'Study Guide', icon: <BookMarked size={16} /> },
              { id: 'flashcards', label: 'Flashcards', icon: <HelpCircle size={16} /> }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  background: activeTab === tab.id ? 'var(--color-primary)' : 'transparent',
                  border: 'none',
                  color: activeTab === tab.id ? 'white' : 'var(--color-text-muted)',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'background 0.2s'
                }}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <RefreshCcw size={32} color="var(--color-primary)" className="animate-spin" style={{ marginBottom: '1rem' }} />
              <p style={{ color: 'var(--color-primary)' }}>Generating your notes...</p>
            </div>
          ) : error ? (
            <div style={{ padding: '1rem', background: 'rgba(244, 63, 94, 0.1)', color: 'var(--color-accent)', borderRadius: 'var(--radius-md)' }}>
              {error}
            </div>
          ) : smartNotes || studyGuide || flashcards ? (
            <div style={{ minHeight: '300px' }}>
              {renderContent()}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
              <FileText size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <p>No notes generated yet. Click "Generate Notes" to create study materials.</p>
            </div>
          )}
        </div>

        {/* Sidebar Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <button
            onClick={generateNotes}
            disabled={isLoading || !content}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem',
              opacity: isLoading || !content ? 0.5 : 1,
              cursor: isLoading || !content ? 'not-allowed' : 'pointer'
            }}
          >
            <RefreshCcw size={18} /> {isLoading ? 'Generating...' : 'Generate Notes'}
          </button>

          {(smartNotes || studyGuide || flashcards) && (
            <button
              onClick={handleSaveNotes}
              className="btn btn-secondary"
              style={{
                width: '100%',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem',
                background: isSaved ? 'rgba(14, 165, 233, 0.2)' : undefined
              }}
            >
              <Save size={18} /> {isSaved ? 'Saved' : 'Save Notes'}
            </button>
          )}

          <div className="glass-panel" style={{ padding: '1rem' }}>
            <h4 style={{ margin: '0 0 0.75rem 0', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Available Formats</h4>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              <li style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: 'var(--color-secondary)' }}>✓</span> Smart Notes
              </li>
              <li style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: 'var(--color-secondary)' }}>✓</span> Study Guide
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: 'var(--color-secondary)' }}>✓</span> Flashcards
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartNotesView;
