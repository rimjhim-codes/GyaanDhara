import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Award, Loader } from 'lucide-react';
import { useProgress } from '../context/ProgressContext';
import { generateQuiz } from '../services/llmService';

const QuizView = () => {
  const { topicId, subtopicId } = useParams();
  const index = parseInt(subtopicId, 10);
  const { currentUser, markSubtopicComplete, saveQuizResult } = useProgress();
  const navigate = useNavigate();

  const [difficulty, setDifficulty] = useState(null); // null = selection, 'easy'|'medium'|'hard' = selected
  const [questions, setQuestions] = useState([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const topic = currentUser.topics?.find((t) => t.id === topicId);
  const subtopic = topic ? topic.syllabus[index] : null;

  useEffect(() => {
    if (!topic || !subtopic) {
       navigate('/');
       return;
    }

    // Only fetch quiz when difficulty is selected
    if (!difficulty) return;

    const fetchQuiz = async () => {
      setIsLoading(true);
      setError('');
      try {
        const quizData = await generateQuiz(topic.name, subtopic.title, difficulty);
        if (!Array.isArray(quizData) || quizData.length === 0) {
           throw new Error("Invalid quiz generated.");
        }
        setQuestions(quizData);
      } catch (err) {
        setError(err.message || "Failed to fetch custom quiz from regular LLM.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuiz();
  }, [topicId, index, topic, subtopic, navigate, difficulty]);

  const handleAnswerClick = (optIndex) => {
    if (selectedAnswer !== null) return; // Prevent double clicking
    setSelectedAnswer(optIndex);
    
    if (optIndex === questions[currentQIndex].correctAnswer) {
      setScore(s => s + 1);
    }
  };

  const nextQuestion = () => {
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex(currentQIndex + 1);
      setSelectedAnswer(null);
    } else {
      setIsFinished(true);
      markSubtopicComplete(topicId, subtopic.title);
      saveQuizResult(topicId, subtopic.title, score, questions.length);
    }
  };

  if (!topic || !subtopic) return null;

  return (
    <div className="container animate-fade-in" style={{ maxWidth: '800px', marginTop: '3rem' }}>
      <header style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to={`/learn/${topicId}/${index}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)' }}>
          <ArrowLeft size={16} /> Back to Lesson
        </Link>
        <span style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text-muted)' }}>
          Quiz: {subtopic.title}
        </span>
      </header>

      {!difficulty ? (
        // Difficulty Selection Screen
        <div className="glass-panel animate-fade-in" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <Award size={80} color="var(--color-primary)" style={{ marginBottom: '2rem' }} />
          <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Choose Difficulty</h1>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '3rem', fontSize: '1.1rem' }}>
            Select your preferred difficulty level for this quiz
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', maxWidth: '600px', margin: '0 auto' }}>
            {[
              { level: 'easy', label: 'Easy', description: 'Basic concepts', color: 'var(--color-secondary)' },
              { level: 'medium', label: 'Medium', description: 'Application of concepts', color: 'var(--color-primary)' },
              { level: 'hard', label: 'Hard', description: 'Deep analysis', color: 'var(--color-accent)' }
            ].map(opt => (
              <button
                key={opt.level}
                onClick={() => setDifficulty(opt.level)}
                style={{
                  padding: '2rem 1rem',
                  background: `rgba(${opt.color === 'var(--color-secondary)' ? '14, 165, 233' : opt.color === 'var(--color-primary)' ? '124, 58, 237' : '244, 63, 94'}, 0.15)`,
                  border: `2px solid ${opt.color}`,
                  borderRadius: 'var(--radius-md)',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `rgba(${opt.color === 'var(--color-secondary)' ? '14, 165, 233' : opt.color === 'var(--color-primary)' ? '124, 58, 237' : '244, 63, 94'}, 0.25)`;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = `rgba(${opt.color === 'var(--color-secondary)' ? '14, 165, 233' : opt.color === 'var(--color-primary)' ? '124, 58, 237' : '244, 63, 94'}, 0.15)`;
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <h3 style={{ margin: '0 0 0.5rem 0', color: opt.color }}>{opt.label}</h3>
                <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>{opt.description}</p>
              </button>
            ))}
          </div>
        </div>
      ) : isLoading ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '5rem 0' }}>
          <Award size={64} color="var(--color-primary)" className="animate-pulse" style={{ marginBottom: '2rem' }} />
          <h3>Generating interactive quiz...</h3>
          <p style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>Testing your knowledge on {subtopic.title}</p>
        </div>
      ) : error ? (
        <div className="glass-panel" style={{ padding: '2rem', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid var(--color-accent)', color: 'var(--color-accent)', textAlign: 'center' }}>
          <h4>Error Generating Quiz</h4>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="btn btn-secondary" 
            style={{ marginTop: '1rem' }}
          >
            Try Again
          </button>
        </div>
      ) : isFinished ? (
        <div className="glass-panel animate-fade-in" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <Award size={80} color="var(--color-primary)" style={{ marginBottom: '2rem' }} />
          <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>Quiz Results</h1>
          <h2 style={{ fontSize: '2rem', color: score === questions.length ? 'var(--color-secondary)' : 'white' }}>
            {score} / {questions.length}
          </h2>
          <p style={{ margin: '2rem 0', color: 'var(--color-text-muted)', fontSize: '1.2rem' }}>
            {score === questions.length ? "Perfect! You've mastered this subtopic." : "Good effort! Review the material to improve your score."}
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link to={`/learn/${topicId}/${index}`} className="btn btn-secondary" style={{ padding: '1rem 2rem' }}>
              Review Lesson
            </Link>
            {index < topic.syllabus.length - 1 && (
              <Link to={`/learn/${topicId}/${index + 1}`} className="btn btn-primary" style={{ padding: '1rem 2rem' }}>
                Next Topic <ArrowLeft size={16} style={{ transform: 'rotate(180deg)' }} />
              </Link>
            )}
            {index === topic.syllabus.length - 1 && (
              <Link to="/" className="btn btn-primary" style={{ padding: '1rem 2rem' }}>
                Complete Curriculum
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="glass-panel animate-fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', color: 'var(--color-text-muted)' }}>
            <span>Question {currentQIndex + 1} of {questions.length}</span>
            <span>Score: {score}</span>
          </div>

          <h2 style={{ fontSize: '1.5rem', marginBottom: '2rem', lineHeight: '1.4' }}>
            {questions[currentQIndex]?.question}
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {questions[currentQIndex]?.options.map((option, i) => {
              const isSelected = selectedAnswer === i;
              const isCorrect = i === questions[currentQIndex].correctAnswer;
              
              let bgColor = 'rgba(0, 0, 0, 0.2)';
              let borderColor = 'var(--color-border)';
              
              if (selectedAnswer !== null) {
                if (isCorrect) {
                  bgColor = 'rgba(14, 165, 233, 0.2)';
                  borderColor = 'var(--color-secondary)';
                } else if (isSelected) {
                  bgColor = 'rgba(244, 63, 94, 0.2)';
                  borderColor = 'var(--color-accent)';
                }
              }

              return (
                <button
                  key={i}
                  onClick={() => handleAnswerClick(i)}
                  disabled={selectedAnswer !== null}
                  style={{
                    padding: '1.25rem',
                    background: bgColor,
                    border: `1px solid ${borderColor}`,
                    borderRadius: 'var(--radius-md)',
                    color: 'white',
                    fontFamily: 'var(--font-body)',
                    fontSize: '1.1rem',
                    textAlign: 'left',
                    cursor: selectedAnswer === null ? 'pointer' : 'default',
                    transition: 'all var(--transition-fast)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <span>{option}</span>
                  {selectedAnswer !== null && isCorrect && <CheckCircle color="var(--color-secondary)" />}
                  {selectedAnswer === i && !isCorrect && <XCircle color="var(--color-accent)" />}
                </button>
              );
            })}
          </div>

          {selectedAnswer !== null && (
            <div className="animate-fade-in" style={{ marginTop: '2rem' }}>
              <div style={{ 
                padding: '1.5rem', 
                background: 'rgba(255, 255, 255, 0.05)', 
                borderRadius: 'var(--radius-md)',
                marginBottom: '2rem'
              }}>
                <h4 style={{ marginBottom: '0.5rem', color: selectedAnswer === questions[currentQIndex].correctAnswer ? 'var(--color-secondary)' : 'var(--color-accent)' }}>
                  {selectedAnswer === questions[currentQIndex].correctAnswer ? "Correct!" : "Incorrect"}
                </h4>
                <p style={{ color: 'var(--color-text-muted)' }}>
                  {questions[currentQIndex].explanation}
                </p>
              </div>
              
              <button 
                onClick={nextQuestion} 
                className="btn btn-primary" 
                style={{ width: '100%', padding: '1.25rem' }}
              >
                {currentQIndex < questions.length - 1 ? "Next Question" : "See Results"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QuizView;
