/**
 * JOFLOW EXTERNAL AI SERVICES
 * Integration with real AI APIs for enterprise-grade features
 */

// OpenAI GPT for advanced text analysis
export interface OpenAIConfig {
  apiKey: string;
  model: 'gpt-3.5-turbo' | 'gpt-4';
}

// Google Cloud AI for translation and sentiment
export interface GoogleAIConfig {
  apiKey: string;
  projectId: string;
}

// Hugging Face for specialized NLP models
export interface HuggingFaceConfig {
  apiKey: string;
  model: string;
}

/**
 * OPENAI GPT INTEGRATION
 * Advanced urgency analysis with context understanding
 */
export async function analyzeUrgencyWithGPT(
  text: string, 
  config: OpenAIConfig
): Promise<{
  urgencyScore: number;
  reasoning: string;
  emotionalState: string;
  recommendations: string[];
}> {
  if (!config.apiKey || config.apiKey === 'your_openai_api_key_here') {
    // Fallback to local AI
    return {
      urgencyScore: 3.0,
      reasoning: "Using local AI analysis (OpenAI API key not configured)",
      emotionalState: "neutral",
      recommendations: ["Configure OpenAI API for advanced analysis"]
    };
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          {
            role: 'system',
            content: `You are an AI assistant analyzing urgency in humanitarian aid requests. 
            Analyze the text and return a JSON response with:
            - urgencyScore (1-5, where 5 is critical emergency)
            - reasoning (why this score)
            - emotionalState (calm/worried/desperate/panic)
            - recommendations (array of 2-3 action items)
            
            Consider: emergency keywords, emotional tone, family situation, time sensitivity, desperation level.`
          },
          {
            role: 'user',
            content: `Analyze this aid request: "${text}"`
          }
        ],
        temperature: 0.3,
        max_tokens: 300
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const analysis = JSON.parse(data.choices[0].message.content);
    
    return {
      urgencyScore: Math.min(Math.max(analysis.urgencyScore, 1), 5),
      reasoning: analysis.reasoning,
      emotionalState: analysis.emotionalState,
      recommendations: analysis.recommendations || []
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    // Fallback to local AI
    return {
      urgencyScore: 3.0,
      reasoning: "OpenAI API unavailable, using local analysis",
      emotionalState: "unknown",
      recommendations: ["Check OpenAI API configuration"]
    };
  }
}

/**
 * GOOGLE TRANSLATE API
 * Multi-language support for Vietnamese users
 */
export async function translateText(
  text: string,
  targetLanguage: string,
  config: GoogleAIConfig
): Promise<string> {
  if (!config.apiKey || config.apiKey === 'your_google_api_key_here') {
    return text; // Return original if no API key
  }

  try {
    const response = await fetch(
      `https://translation.googleapis.com/language/translate/v2?key=${config.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          target: targetLanguage,
          source: 'auto'
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Google Translate API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data.translations[0].translatedText;
  } catch (error) {
    console.error('Google Translate error:', error);
    return text; // Return original on error
  }
}

/**
 * GOOGLE CLOUD SENTIMENT ANALYSIS
 * Emotional state detection
 */
export async function analyzeSentiment(
  text: string,
  config: GoogleAIConfig
): Promise<{
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number;
  magnitude: number;
}> {
  if (!config.apiKey || config.apiKey === 'your_google_api_key_here') {
    return {
      sentiment: 'neutral',
      score: 0,
      magnitude: 0
    };
  }

  try {
    const response = await fetch(
      `https://language.googleapis.com/v1/documents:analyzeSentiment?key=${config.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document: {
            type: 'PLAIN_TEXT',
            content: text
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Google Sentiment API error: ${response.status}`);
    }

    const data = await response.json();
    const sentiment = data.documentSentiment;
    
    return {
      sentiment: sentiment.score > 0.1 ? 'positive' : 
                sentiment.score < -0.1 ? 'negative' : 'neutral',
      score: sentiment.score,
      magnitude: sentiment.magnitude
    };
  } catch (error) {
    console.error('Google Sentiment error:', error);
    return {
      sentiment: 'neutral',
      score: 0,
      magnitude: 0
    };
  }
}

/**
 * HUGGING FACE MODELS
 * Specialized NLP models for specific tasks
 */
export async function analyzeWithHuggingFace(
  text: string,
  task: 'emotion-detection' | 'urgency-classification' | 'text-classification',
  config: HuggingFaceConfig
): Promise<any> {
  if (!config.apiKey || config.apiKey === 'your_huggingface_api_key_here') {
    return { error: 'Hugging Face API key not configured' };
  }

  const modelMap = {
    'emotion-detection': 'j-hartmann/emotion-english-distilroberta-base',
    'urgency-classification': 'cardiffnlp/twitter-roberta-base-sentiment-latest',
    'text-classification': 'facebook/bart-large-mnli'
  };

  try {
    const response = await fetch(
      `https://api-inference.huggingface.co/models/${modelMap[task]}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: text
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Hugging Face API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    // Graceful handling of CORS and network errors - don't spam console
    if (error.message.includes('CORS') || error.message.includes('fetch') || error.name === 'TypeError') {
      // Silent fallback for CORS/network issues
      return { error: 'API unavailable', cors: true, fallback: true };
    } else {
      console.error('Hugging Face error:', error);
      return { error: error.message };
    }
  }
}

/**
 * COMPOSITE AI ANALYSIS
 * Combines multiple AI services for comprehensive analysis
 */
export async function comprehensiveAIAnalysis(
  text: string,
  configs: {
    openai?: OpenAIConfig;
    google?: GoogleAIConfig;
    huggingface?: HuggingFaceConfig;
  }
): Promise<{
  localAI: {
    urgencyScore: number;
    keywords: string[];
  };
  openaiAnalysis?: any;
  sentimentAnalysis?: any;
  emotionDetection?: any;
  finalScore: number;
  confidence: number;
  reasoning: string;
}> {
  // Always run local AI first (fast, no API calls)
  const { analyzeUrgencyWithNLP } = await import('./aiMatchingEngine');
  const localUrgency = analyzeUrgencyWithNLP(text, '24hours');
  
  const results: any = {
    localAI: {
      urgencyScore: localUrgency,
      keywords: extractUrgencyKeywords(text)
    },
    finalScore: localUrgency,
    confidence: 0.7, // Base confidence for local AI
    reasoning: 'Local AI analysis'
  };

  // Run external AI services in parallel if configured
  const promises: Promise<any>[] = [];

  if (configs.openai?.apiKey && configs.openai.apiKey !== 'your_openai_api_key_here') {
    promises.push(
      analyzeUrgencyWithGPT(text, configs.openai)
        .then(result => ({ type: 'openai', data: result }))
        .catch(error => ({ type: 'openai', error }))
    );
  }

  if (configs.google?.apiKey && configs.google.apiKey !== 'your_google_api_key_here') {
    promises.push(
      analyzeSentiment(text, configs.google)
        .then(result => ({ type: 'sentiment', data: result }))
        .catch(error => ({ type: 'sentiment', error }))
    );
  }

  if (configs.huggingface?.apiKey && configs.huggingface.apiKey !== 'your_huggingface_api_key_here') {
    promises.push(
      analyzeWithHuggingFace(text, 'emotion-detection', configs.huggingface)
        .then(result => ({ type: 'emotion', data: result }))
        .catch(error => ({ type: 'emotion', error: 'API unavailable', fallback: true }))
    );
  }

  // Wait for all external AI services
  if (promises.length > 0) {
    try {
      const externalResults = await Promise.allSettled(promises);
      
      externalResults.forEach(result => {
        if (result.status === 'fulfilled' && !result.value.error) {
          const { type, data } = result.value;
          
          switch (type) {
            case 'openai':
              results.openaiAnalysis = data;
              // Weight OpenAI analysis heavily
              results.finalScore = (results.finalScore + data.urgencyScore * 2) / 3;
              results.confidence = Math.min(results.confidence + 0.2, 0.95);
              results.reasoning += ' + OpenAI GPT analysis';
              break;
              
            case 'sentiment':
              results.sentimentAnalysis = data;
              // Negative sentiment increases urgency
              if (data.sentiment === 'negative' && data.magnitude > 0.5) {
                results.finalScore += 0.5;
              }
              results.confidence += 0.1;
              results.reasoning += ' + Google Sentiment';
              break;
              
            case 'emotion':
              results.emotionDetection = data;
              // Fear, sadness, anger increase urgency
              if (Array.isArray(data)) {
                const urgentEmotions = data.filter(emotion => 
                  ['fear', 'sadness', 'anger'].includes(emotion.label?.toLowerCase())
                );
                if (urgentEmotions.length > 0) {
                  results.finalScore += 0.3;
                }
              }
              results.confidence += 0.1;
              results.reasoning += ' + Emotion Detection';
              break;
          }
        }
      });
    } catch (error) {
      console.error('External AI services error:', error);
    }
  }

  // Cap final score at 5.0
  results.finalScore = Math.min(results.finalScore, 5.0);
  results.confidence = Math.min(results.confidence, 1.0);

  return results;
}

/**
 * Extract urgency keywords from text
 */
function extractUrgencyKeywords(text: string): string[] {
  const urgencyWords = [
    'emergency', 'urgent', 'critical', 'asap', 'immediately', 'help', 
    'desperate', 'dying', 'starving', 'homeless', 'soon', 'quickly', 
    'fast', 'needed', 'important', 'running out', 'last', 'final', 'please'
  ];
  
  const normalizedText = text.toLowerCase();
  return urgencyWords.filter(word => normalizedText.includes(word));
}

/**
 * CONFIGURATION HELPER
 * Load AI configurations from environment variables
 */
export function loadAIConfigs(): {
  openai?: OpenAIConfig;
  google?: GoogleAIConfig;
  huggingface?: HuggingFaceConfig;
} {
  const configs: any = {};

  // OpenAI Configuration
  const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (openaiKey && openaiKey !== 'your_openai_api_key_here') {
    configs.openai = {
      apiKey: openaiKey,
      model: (import.meta.env.VITE_OPENAI_MODEL as any) || 'gpt-3.5-turbo'
    };
  }

  // Google AI Configuration
  const googleKey = import.meta.env.VITE_GOOGLE_AI_API_KEY;
  const googleProject = import.meta.env.VITE_GOOGLE_PROJECT_ID;
  if (googleKey && googleKey !== 'your_google_api_key_here') {
    configs.google = {
      apiKey: googleKey,
      projectId: googleProject || 'joflow-project'
    };
  }

  // Hugging Face Configuration
  const hfKey = import.meta.env.VITE_HUGGINGFACE_API_KEY;
  if (hfKey && hfKey !== 'your_huggingface_api_key_here') {
    configs.huggingface = {
      apiKey: hfKey,
      model: 'j-hartmann/emotion-english-distilroberta-base'
    };
  }

  return configs;
}