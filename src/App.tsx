/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Search, Loader2, Copy, Check, Sparkles, Terminal } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';

// Initialize Gemini
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export default function App() {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleQuery = useCallback(async (text: string) => {
    if (!text.trim()) return;
    
    setIsLoading(true);
    setError(null);
    setResponse('');

    try {
      const response = await genAI.models.generateContent({
        model: "gemini-2.0-flash",
        contents: text,
      });

      const result = response.text;
      if (result) {
        setResponse(result);
      } else {
        setError("No response received from Gemini.");
      }
    } catch (err: any) {
      console.error("Gemini Error:", err);
      setError(err.message || "An error occurred while fetching the response.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle URL parameters on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlQuery = params.get('query');
    if (urlQuery) {
      setQuery(urlQuery);
      handleQuery(urlQuery);
    }
  }, [handleQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleQuery(query);
    // Update URL without refreshing
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('query', query);
    window.history.pushState({}, '', newUrl);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(response);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#1a1a1a] font-sans selection:bg-emerald-100">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <header className="mb-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
              <Sparkles size={20} />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Gemini Bridge</h1>
              <p className="text-xs text-gray-500 font-mono uppercase tracking-wider">v1.0.0 // API Proxy</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-gray-200 shadow-sm">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs font-medium text-gray-600">System Ready</span>
          </div>
        </header>

        {/* Input Section */}
        <section className="mb-8">
          <form onSubmit={handleSubmit} className="relative group">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter your query or use ?query=... in URL"
              className="w-full h-16 pl-14 pr-6 bg-white border border-gray-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-lg placeholder:text-gray-400"
            />
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" size={22} />
            <button 
              type="submit"
              disabled={isLoading}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-10 px-6 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {isLoading ? <Loader2 className="animate-spin" size={18} /> : 'Run'}
            </button>
          </form>
        </section>

        {/* Response Section */}
        <main className="space-y-6">
          <AnimatePresence mode="wait">
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col items-center justify-center py-20 text-gray-400"
              >
                <Loader2 className="animate-spin mb-4" size={32} />
                <p className="text-sm font-medium animate-pulse">Consulting Gemini...</p>
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-6 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm flex items-start gap-3"
              >
                <div className="mt-0.5">⚠️</div>
                <div>
                  <p className="font-semibold mb-1">Execution Error</p>
                  <p className="opacity-90">{error}</p>
                </div>
              </motion.div>
            )}

            {response && !isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden"
              >
                <div className="px-6 py-4 border-bottom border-gray-100 flex items-center justify-between bg-gray-50/50">
                  <div className="flex items-center gap-2 text-xs font-mono text-gray-500 uppercase tracking-widest">
                    <Terminal size={14} />
                    <span>Response Output</span>
                  </div>
                  <button
                    onClick={copyToClipboard}
                    className="p-2 hover:bg-white rounded-lg transition-colors text-gray-400 hover:text-emerald-600 border border-transparent hover:border-gray-200"
                    title="Copy to clipboard"
                  >
                    {copied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
                  </button>
                </div>
                <div className="p-8 prose prose-emerald max-w-none">
                  <div className="markdown-body">
                    <ReactMarkdown>{response}</ReactMarkdown>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!response && !isLoading && !error && (
            <div className="py-20 text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl border border-gray-100 shadow-sm text-gray-300">
                <Search size={32} />
              </div>
              <div className="max-w-xs mx-auto">
                <p className="text-gray-500 text-sm">
                  Ready for input. You can also append <code className="bg-gray-100 px-1.5 py-0.5 rounded text-emerald-600">?query=...</code> to the URL for direct access.
                </p>
              </div>
            </div>
          )}
        </main>

        {/* Footer / Info */}
        <footer className="mt-20 pt-8 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Python Integration</h3>
              <div className="bg-[#151619] rounded-xl p-4 font-mono text-[11px] text-emerald-400/80 overflow-x-auto shadow-xl">
                <pre>{`# Real Python Usage (Works with requests.get)
import requests

query = "what is the color of an apple"
# You can use ?query=... or just ?...
url = f"{window.location.origin}/?{query}"
response = requests.get(url)

print(response.text) # Returns plain text from Gemini`}</pre>
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">About</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                This bridge allows you to trigger Gemini queries directly via URL parameters. 
                The response is rendered in real-time using the Gemini 2.0 Flash model.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
