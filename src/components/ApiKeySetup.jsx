import { useState } from 'react'

export default function ApiKeySetup({ onSave, onClose, existingKey }) {
  const [value, setValue] = useState(existingKey || '')
  const [error, setError]   = useState(null)

  function handleSave() {
    const trimmed = value.trim()
    if (!trimmed) {
      setError('Please enter an API key')
      return
    }
    if (!trimmed.startsWith('sk-ant-')) {
      setError('Key should start with sk-ant-…')
      return
    }
    localStorage.setItem('pokerlens_api_key', trimmed)
    onSave(trimmed)
  }

  function handleClear() {
    localStorage.removeItem('pokerlens_api_key')
    setValue('')
    setError(null)
    onSave(null)
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-gray-100">Anthropic API Key</h2>
          <p className="text-sm text-gray-400 mt-1">
            Required to analyze poker screenshots with Claude.
          </p>
        </div>

        <div className="space-y-2">
          <input
            type="password"
            value={value}
            onChange={e => { setValue(e.target.value); setError(null) }}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            placeholder="sk-ant-api03-..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            autoFocus
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>

        <div className="bg-yellow-900/30 border border-yellow-800/50 rounded-lg px-3 py-2.5">
          <p className="text-xs text-yellow-400/80 leading-relaxed">
            <strong>Note:</strong> Your key is stored in browser localStorage.
            Do not use this tool on shared or public computers.
          </p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <button
            onClick={handleClear}
            className="text-sm text-gray-500 hover:text-red-400 transition-colors"
          >
            Clear key
          </button>
          <div className="flex gap-2">
            {onClose && existingKey && (
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg font-medium transition-colors"
            >
              Save
            </button>
          </div>
        </div>

        <p className="text-xs text-gray-600">
          Get your key at{' '}
          <span className="text-gray-500">console.anthropic.com</span>
        </p>
      </div>
    </div>
  )
}
