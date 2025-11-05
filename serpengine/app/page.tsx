'use client'
import React, { useState, useRef } from 'react'
import { CornerDownLeft, Moon, Sun, ArrowLeft } from 'lucide-react'


function cn(...inputs: any[]) { return inputs.filter(Boolean).join(' '); }


interface SearchResult {
  title: string;
  link: string;
  description: string;
}


function extractGoogleUrl(link: string) {
  try {
    const match = link.match(/[?&]uddg=([^&]+)/);
    if (match) {
      const decoded = decodeURIComponent(match[1]);
      return decoded;
    }
    return link;
  } catch {
    return link;
  }
}


export default function Page() {
  const [input, setInput] = useState('')
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [summary, setSummary] = useState<string | null>(null)
  const [showResults, setShowResults] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const BACKEND_URL = 'https://455db55c4f14.ngrok-free.app'

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return;
    setIsLoading(true)
    setShowResults(false)
    setSummary(null)
    setSummaryLoading(true)
    setResults([])
    setHasSearched(true)
    try {
      const response = await fetch(`${BACKEND_URL}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: input }),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const data = await response.json()
      setResults(data.results)
      setShowResults(true)
      setInput('')
      const res2 = await fetch(`${BACKEND_URL}/overview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ results: data.results.slice(0, 4) }) 
      })
      if (res2.ok) {
        const s = await res2.json()
        setSummary(s.overview)
      } else {
        setSummary('Unable to generate overview')
      }
    } catch (error) {
      console.error('Error fetching:', error)
      alert('Error connecting to backend. Make sure Python server is running and ngrok tunnel is active')
    } finally {
      setIsLoading(false)
      setSummaryLoading(false)
    }
  }


  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }


  const handleBack = () => {
    setShowResults(false)
    setResults([])
    setSummary(null)
    setInput('')
    setSummaryLoading(false)
    setHasSearched(false)
  }


  const isActive = !!input.trim();


  function SummaryOverviewBox() {
    if (!hasSearched) return null;
    const hasSummary = !!summary;
    return (
      <div
        className={cn(
          "w-full max-w-xl mx-auto my-6 transition-colors duration-300",
          "rounded-md border shadow-2xl flex flex-col",
          isDarkMode
            ? "bg-zinc-900/70 backdrop-blur-md border-zinc-800 shadow-zinc-950/70"
            : "bg-white/90 backdrop-blur border-zinc-200"
        )}
        style={{
          boxShadow: undefined,
        }}
      >
        <div className="mx-4 my-2">
          <h2 className={cn("text-lg font-semibold mb-4",
            isDarkMode ? "text-zinc-100" : "text-zinc-900")}>
            Local LLM Overview (tinyllama)
          </h2>
          <div className="min-h-[42px] flex items-start justify-start transition-opacity duration-300">
            {summaryLoading && !hasSummary && (
              <div className="flex items-center gap-2">
                <span className="inline-flex h-6 w-6 relative">
                  <span className="animate-spin absolute inline-flex h-full w-full rounded-full border-4 border-solid border-zinc-500 border-t-transparent" />
                </span>
                <span className={cn("text-sm", isDarkMode ? "text-zinc-400" : "text-zinc-500")}>
                  Generating overview…
                </span>
              </div>
            )}
            {!summaryLoading && !hasSummary && (
              <span className={cn("text-sm", isDarkMode ? "text-zinc-500" : "text-zinc-400")}>
                Overview will appear here.
              </span>
            )}
            {hasSummary && (
              <span
                className={cn(
                  "text-sm font-medium leading-relaxed transition-all duration-500",
                  isDarkMode ? "text-zinc-100" : "text-zinc-900"
                )}
                style={{ textAlign: 'left', lineHeight: '1.8' }}
              >
                {summary}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className={cn(
      "min-h-screen w-full flex flex-col items-center justify-center transition-colors duration-300 p-4",
      isDarkMode ? "bg-zinc-950 text-white" : "bg-zinc-100 text-zinc-900"
    )}>
      <SummaryOverviewBox />


      {!showResults ? (
        <form
          className={cn(
            "w-full max-w-xl rounded-md border shadow-2xl flex flex-col items-stretch transition-colors duration-300",
            isDarkMode
              ? "bg-zinc-900/70 backdrop-blur-md border-zinc-800 shadow-zinc-950/70"
              : "bg-white/90 backdrop-blur border-zinc-200"
          )}
          onSubmit={handleSubmit}
          autoComplete="off"
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className={cn(
              "w-full max-h-40 bg-transparent resize-none p-4 focus:outline-none transition-colors duration-300 rounded-md",
              isDarkMode ? "text-white placeholder-zinc-500" : "text-zinc-900 placeholder-zinc-400",
              isLoading && "opacity-50"
            )}
            rows={1}
            placeholder={isLoading ? "Searching…" : "Ask anything…"}
            spellCheck={false}
          />
          <div className="flex items-center justify-end gap-2 px-4 pb-3 pt-0 w-full">
            <button
              type="submit"
              className={cn(
                "p-2 rounded-lg flex items-center gap-1.5 transition-all duration-200",
                isActive && !isLoading
                  ? "bg-indigo-600 text-white enabled:hover:bg-indigo-700 enabled:shadow-lg"
                  : isDarkMode
                    ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                    : "bg-zinc-100 text-zinc-400 cursor-not-allowed"
              )}
              aria-label="Send"
              tabIndex={-1}
              disabled={!isActive || isLoading}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <CornerDownLeft className="w-5 h-5" />
              )}
            </button>
            <button
              type="button"
              className={cn(
                "p-2 ml-1 rounded-md transition-all duration-200",
                isDarkMode
                  ? "bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
                  : "bg-white text-zinc-600 shadow hover:text-indigo-600 hover:bg-zinc-50"
              )}
              aria-label="Toggle dark mode"
              onClick={() => setIsDarkMode(v => !v)}
            >
              {isDarkMode ? <Sun size={18}/> : <Moon size={17}/>}
            </button>
          </div>
        </form>
      ) : (
        <div className={cn(
          "w-full max-w-xl rounded-md border shadow-2xl transition-colors duration-300 flex flex-col",
          isDarkMode
            ? "bg-zinc-900/70 backdrop-blur-md border-zinc-800 shadow-zinc-950/70"
            : "bg-white/90 backdrop-blur border-zinc-200"
        )}>
          <div className="flex justify-between items-center p-2">
            <button
              type="button"
              className={cn(
                "p-2 rounded-lg flex items-center gap-1.5 transition-all duration-200 bg-indigo-600 text-white enabled:hover:bg-indigo-700 enabled:shadow-lg"
              )}
              aria-label="Back"
              onClick={handleBack}
              tabIndex={-1}
            >
              <ArrowLeft className="w-5 h-5" /> 
            </button>
            <button
              type="button"
              className={cn(
                "p-2 rounded-md transition-all duration-200",
                isDarkMode
                  ? "bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
                  : "bg-white text-zinc-600 shadow hover:text-indigo-600 hover:bg-zinc-50"
              )}
              aria-label="Toggle dark mode"
              onClick={() => setIsDarkMode(v => !v)}
            >
              {isDarkMode ? <Sun size={18}/> : <Moon size={17}/>}
            </button>
          </div>
          <div className="mx-4 my-2">
            <h2 className={cn("text-lg font-semibold mb-4", 
              isDarkMode ? "text-zinc-100" : "text-zinc-900")}>
              Top Results
            </h2>
            {results.map((result, index) => {
              const displayLink = extractGoogleUrl(result.link);
              return (
                <div key={index} className={cn(
                  "mb-6 pb-6",
                  index !== results.length - 1 && "border-b",
                  isDarkMode ? "border-zinc-800" : "border-zinc-200"
                )}>
                  <h3 className={cn("font-medium hover:underline",
                    isDarkMode ? "text-indigo-600" : "text-indigo-600"
                  )}>
                    <a href={displayLink} target="_blank" rel="noopener noreferrer">
                      {result.title}
                    </a>
                  </h3>
                  <p className={cn("text-sm mt-1 truncate",
                    isDarkMode ? "text-blue-400" : "text-blue-600"
                  )}>
                    {displayLink.replace(/^https?:\/\//, '')}
                  </p>
                  <p className={cn(
                    "text-sm mt-2",
                    isDarkMode ? "text-zinc-400" : "text-zinc-600"
                  )}>
                    {result.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <style jsx global>{`
        body {
          background: ${isDarkMode ? '#09090b' : '#f4f4f5'};
        }
      `}</style>
    </div>
  )
}
