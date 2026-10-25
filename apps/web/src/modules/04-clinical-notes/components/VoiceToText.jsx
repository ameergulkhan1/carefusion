import React, { useState, useEffect, useRef } from 'react';
import Button from '../../../components/common/Button/Button';
import './VoiceToText.css';

const VoiceToText = ({ onTranscript, onClose }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Check for browser support
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Speech recognition is not supported in your browser');
      return;
    }

    // Initialize speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptPiece = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcriptPiece + ' ';
        } else {
          interim += transcriptPiece;
        }
      }

      if (final) {
        setTranscript(prev => prev + final);
        setInterimTranscript('');
      } else {
        setInterimTranscript(interim);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setError(`Error: ${event.error}`);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startRecording = () => {
    if (recognitionRef.current && !isRecording) {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
        setError(null);
      } catch (err) {
        console.error('Error starting recognition:', err);
        setError('Failed to start recording');
      }
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleInsert = () => {
    if (transcript.trim()) {
      onTranscript(transcript.trim());
      setTranscript('');
      setInterimTranscript('');
    }
  };

  const handleClear = () => {
    setTranscript('');
    setInterimTranscript('');
  };

  return (
    <div className="voice-to-text-panel">
      <div className="voice-header">
        <h4>🎤 Voice Input</h4>
        <button className="close-btn" onClick={onClose}>&times;</button>
      </div>

      {error && (
        <div className="voice-error">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <div className="voice-controls">
        {!isRecording ? (
          <Button 
            variant="primary" 
            icon="microphone"
            onClick={startRecording}
            disabled={!!error}
          >
            Start Recording
          </Button>
        ) : (
          <Button 
            variant="danger" 
            icon="stop"
            onClick={stopRecording}
          >
            Stop Recording
          </Button>
        )}
      </div>

      {isRecording && (
        <div className="recording-indicator">
          <span className="pulse"></span>
          <span>Listening...</span>
        </div>
      )}

      <div className="transcript-display">
        <div className="transcript-label">Transcript:</div>
        <div className="transcript-text">
          {transcript}
          {interimTranscript && (
            <span className="interim-text">{interimTranscript}</span>
          )}
          {!transcript && !interimTranscript && (
            <span className="placeholder">Your speech will appear here...</span>
          )}
        </div>
      </div>

      <div className="voice-actions">
        <Button 
          variant="secondary" 
          onClick={handleClear}
          disabled={!transcript}
        >
          Clear
        </Button>
        <Button 
          variant="primary" 
          onClick={handleInsert}
          disabled={!transcript}
        >
          Insert Into Note
        </Button>
      </div>
    </div>
  );
};

export default VoiceToText;