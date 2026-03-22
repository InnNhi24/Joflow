/**
 * AI Test Panel - Test OpenAI and Hugging Face APIs
 */

import { useState } from 'react';
import { analyzeUrgencyWithGPT, analyzeWithHuggingFace, comprehensiveAIAnalysis, loadAIConfigs } from '../utils/externalAI';

export default function AITestPanel() {
  const [testText, setTestText] = useState("Emergency! My family is starving, 3 kids crying, need rice ASAP!!!");
  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTest, setActiveTest] = useState<string>('');

  const testOpenAI = async () => {
    setIsLoading(true);
    setActiveTest('openai');
    try {
      const configs = loadAIConfigs();
      if (!configs.openai) {
        setResults({ error: 'OpenAI API key not configured' });
        return;
      }
      
      const result = await analyzeUrgencyWithGPT(testText, configs.openai);
      setResults({ type: 'OpenAI GPT', data: result });
    } catch (error) {
      setResults({ error: error.message });
    } finally {
      setIsLoading(false);
      setActiveTest('');
    }
  };

  const testHuggingFace = async () => {
    setIsLoading(true);
    setActiveTest('huggingface');
    try {
      const configs = loadAIConfigs();
      if (!configs.huggingface) {
        setResults({ error: 'Hugging Face API key not configured' });
        return;
      }
      
      const result = await analyzeWithHuggingFace(testText, 'emotion-detection', configs.huggingface);
      setResults({ type: 'Hugging Face Emotions', data: result });
    } catch (error) {
      setResults({ error: error.message });
    } finally {
      setIsLoading(false);
      setActiveTest('');
    }
  };

  const testComprehensive = async () => {
    setIsLoading(true);
    setActiveTest('comprehensive');
    try {
      const configs = loadAIConfigs();
      const result = await comprehensiveAIAnalysis(testText, configs);
      setResults({ type: 'Comprehensive AI Analysis', data: result });
    } catch (error) {
      setResults({ error: error.message });
    } finally {
      setIsLoading(false);
      setActiveTest('');
    }
  };

  const checkAPIStatus = () => {
    const configs = loadAIConfigs();
    const status = {
      openai: !!configs.openai?.apiKey && configs.openai.apiKey !== 'your_openai_api_key_here',
      huggingface: !!configs.huggingface?.apiKey && configs.huggingface.apiKey !== 'your_huggingface_api_key_here',
      google: !!configs.google?.apiKey && configs.google.apiKey !== 'your_google_api_key_here'
    };
    setResults({ type: 'API Status', data: status });
  };

  return (
    <div className="fixed top-4 right-4 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 z-[10000]">
      <h3 className="text-lg font-bold text-gray-900 mb-4">🤖 AI API Tester</h3>
      
      {/* Test Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Test Text:</label>
        <textarea
          value={testText}
          onChange={(e) => setTestText(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          rows={3}
        />
      </div>

      {/* Test Buttons */}
      <div className="space-y-2 mb-4">
        <button
          onClick={checkAPIStatus}
          className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm"
        >
          Check API Status
        </button>
        
        <button
          onClick={testOpenAI}
          disabled={isLoading}
          className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 text-sm flex items-center justify-center gap-2"
        >
          {isLoading && activeTest === 'openai' && (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          )}
          Test OpenAI GPT
        </button>
        
        <button
          onClick={testHuggingFace}
          disabled={isLoading}
          className="w-full px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:bg-gray-300 text-sm flex items-center justify-center gap-2"
        >
          {isLoading && activeTest === 'huggingface' && (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          )}
          Test Hugging Face
        </button>
        
        <button
          onClick={testComprehensive}
          disabled={isLoading}
          className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:bg-gray-300 text-sm flex items-center justify-center gap-2"
        >
          {isLoading && activeTest === 'comprehensive' && (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          )}
          Test All APIs
        </button>
      </div>

      {/* Results */}
      {results && (
        <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
          <h4 className="font-semibold text-gray-900 mb-2">{results.type}</h4>
          
          {results.error ? (
            <div className="text-red-600 text-sm">
              ❌ Error: {results.error}
            </div>
          ) : (
            <pre className="text-xs text-gray-700 whitespace-pre-wrap">
              {JSON.stringify(results.data, null, 2)}
            </pre>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="mt-4 text-xs text-gray-500">
        <p>💡 Add API keys to .env.local:</p>
        <p>• VITE_OPENAI_API_KEY=sk-...</p>
        <p>• VITE_HUGGINGFACE_API_KEY=hf_...</p>
      </div>
    </div>
  );
}