'use client';

import React, { useState } from 'react';

export default function PromptBox() {
  const [question, setQuestion] = useState('');

  const handleSubmit = () => {
    if (question.trim()) {
      alert(`Question: "${question}"\n\nThis would query the timeline events in a real application.`);
      setQuestion('');
    }
  };

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-3xl bg-zinc-800 rounded-full p-3 border border-zinc-700 flex items-center gap-3">
        <button className="p-2 hover:bg-zinc-700 rounded-full transition-colors flex-shrink-0">
          <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="Ask anything"
          className="flex-1 bg-transparent text-zinc-100 placeholder-zinc-500 focus:outline-none text-base"
        />
        
        {question.trim() ? (
          <button
            onClick={handleSubmit}
            className="p-2 bg-zinc-100 hover:bg-white rounded-full transition-colors flex-shrink-0"
          >
            <svg className="w-5 h-5 text-zinc-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </button>
        ) : (
          <button className="p-2 hover:bg-zinc-700 rounded-full transition-colors flex-shrink-0">
            <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

