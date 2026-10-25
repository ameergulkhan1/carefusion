import React, { useState } from 'react';
import Button from '../../../../components/common/Button/Button';
import './NoteEditor.css';

const NoteEditor = ({ note, onSave }) => {
  const [content, setContent] = useState(note?.content || '');
  const [title, setTitle] = useState(note?.title || '');

  const handleSave = () => {
    onSave({ title, content });
  };

  return (
    <div className="note-editor">
      <input 
        type="text" 
        placeholder="Note Title" 
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="note-title-input"
      />
      <textarea 
        placeholder="Write clinical notes here..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={15}
        className="note-content-textarea"
      />
      <Button onClick={handleSave}>Save Note</Button>
    </div>
  );
};

export default NoteEditor;