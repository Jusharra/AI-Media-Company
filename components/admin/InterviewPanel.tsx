'use client';

import { useState } from 'react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface InterviewPanelProps {
  taskId: string;
  onComplete: () => void;
}

export function InterviewPanel({ taskId, onComplete }: InterviewPanelProps) {
  const [mode, setMode] = useState<'select' | 'A' | 'B'>('select');
  const [transcript, setTranscript] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [questions, setQuestions] = useState<null | {
    intro_message: string;
    sections: Array<{ section_name: string; questions: Array<{ id: string; question: string }> }>;
    closing_message: string;
  }>(null);

  const { data, mutate } = useSWR(`/api/signal/interview?taskId=${taskId}`, fetcher);
  const existingOutput = data?.output;

  const handleModeA = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/signal/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, mode: 'A' }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setQuestions(json.questions);
      setMode('A');
      mutate();
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleModeB = async () => {
    if (!transcript.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/signal/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, mode: 'B', transcript }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      onComplete();
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const displayQuestions = questions || (existingOutput?.content?.sections ? existingOutput.content : null);

  return (
    <div className="bg-zinc-900 border border-amber-900/40 rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
        <h3 className="text-amber-400 font-mono text-sm uppercase tracking-wider">Interview Required</h3>
      </div>
      <p className="text-zinc-500 text-xs font-mono leading-relaxed">
        This pipeline is waiting for interview content. Generate AI questions to send to the founder (Mode A),
        or paste an existing transcript to parse immediately (Mode B).
      </p>

      {error && (
        <div className="bg-red-950 border border-red-800 text-red-400 rounded px-3 py-2 text-xs font-mono">
          {error}
        </div>
      )}

      {/* Mode selection */}
      {!displayQuestions && mode !== 'B' && (
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleModeA}
            disabled={loading}
            className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-xs font-mono px-3 py-2 rounded transition-colors disabled:opacity-40 text-left space-y-1"
          >
            <div className="text-amber-400 font-medium">Mode A — Generate Questions</div>
            <div className="text-zinc-500">AI creates 12–15 tailored questions for this founder</div>
          </button>
          <button
            onClick={() => setMode('B')}
            disabled={loading}
            className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-xs font-mono px-3 py-2 rounded transition-colors disabled:opacity-40 text-left space-y-1"
          >
            <div className="text-amber-400 font-medium">Mode B — Submit Transcript</div>
            <div className="text-zinc-500">Paste call transcript or written Q&A answers</div>
          </button>
        </div>
      )}

      {loading && (
        <div className="text-amber-400 text-xs font-mono animate-pulse">
          {mode === 'A' ? 'Generating questions with Claude...' : 'Parsing transcript and running backgrounder...'}
        </div>
      )}

      {/* Mode A: show generated questions */}
      {displayQuestions && !loading && (
        <div className="space-y-3">
          <div className="bg-zinc-800 rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
            <p className="text-zinc-400 text-xs font-mono">{displayQuestions.intro_message}</p>
            {displayQuestions.sections?.map((s: { section_name: string; questions: Array<{ id: string; question: string }> }, si: number) => (
              <div key={si}>
                <p className="text-amber-400 text-xs font-mono uppercase mt-2 mb-1">{s.section_name}</p>
                {s.questions.map((q: { id: string; question: string }, qi: number) => (
                  <p key={qi} className="text-zinc-400 text-xs font-mono mb-1">
                    <span className="text-zinc-600">{qi + 1}. </span>{q.question}
                  </p>
                ))}
              </div>
            ))}
          </div>
          <p className="text-zinc-600 text-xs font-mono">
            Questions generated. Send these to the founder, then submit their responses using Mode B below.
          </p>
          <button
            onClick={() => setMode('B')}
            className="text-amber-400 hover:text-amber-300 text-xs font-mono underline"
          >
            Submit founder answers (Mode B) →
          </button>
        </div>
      )}

      {/* Mode B: transcript input */}
      {mode === 'B' && !loading && (
        <div className="space-y-2">
          <label className="text-zinc-400 text-xs font-mono uppercase tracking-wider block">
            Founder transcript / answers
          </label>
          <textarea
            value={transcript}
            onChange={e => setTranscript(e.target.value)}
            placeholder="Paste interview transcript, call recording text, or written Q&A responses here..."
            rows={8}
            className="w-full bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-mono rounded px-3 py-2 focus:outline-none focus:border-amber-500 transition-colors resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={handleModeB}
              disabled={loading || transcript.trim().length < 50}
              className="bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-mono px-4 py-2 rounded transition-colors disabled:opacity-40"
            >
              Parse & Run Backgrounder →
            </button>
            <button
              onClick={() => setMode(displayQuestions ? 'A' : 'select')}
              className="text-zinc-600 hover:text-zinc-400 text-xs font-mono px-3 py-2 transition-colors"
            >
              Back
            </button>
          </div>
          {transcript.trim().length > 0 && transcript.trim().length < 50 && (
            <p className="text-zinc-600 text-xs font-mono">Transcript must be at least 50 characters.</p>
          )}
        </div>
      )}
    </div>
  );
}
