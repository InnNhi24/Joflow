# 🚀 Quick AI Setup Guide for JOFLOW

## 🎯 **Goal**: Enable OpenAI GPT + Hugging Face APIs

### ⏱️ **Time Required**: 10 minutes
### 💰 **Cost**: ~$5 for OpenAI (lasts months), Hugging Face free

---

## 📋 **Step-by-Step Setup**

### **Step 1: OpenAI API Key** (5 minutes)

1. **Go to**: https://platform.openai.com/api-keys
2. **Sign up/Login** with email
3. **Verify phone number** (required)
4. **Click**: "Create new secret key"
5. **Name**: "JOFLOW-AI"
6. **Copy key** (starts with `sk-...`)
7. **Add billing**: https://platform.openai.com/settings/organization/billing
   - Add $5-10 (will last months)
   - Cost: ~$0.002 per AI analysis

### **Step 2: Hugging Face Token** (2 minutes)

1. **Go to**: https://huggingface.co/settings/tokens
2. **Sign up/Login** with email
3. **Click**: "New token"
4. **Name**: "JOFLOW-AI"
5. **Type**: "Read"
6. **Copy token** (starts with `hf_...`)

### **Step 3: Configure JOFLOW** (1 minute)

**Edit your `.env.local` file**:
```bash
# Replace these lines:
VITE_OPENAI_API_KEY=sk-your-actual-openai-key-here
VITE_HUGGINGFACE_API_KEY=hf_your-actual-huggingface-token-here
```

### **Step 4: Test Setup** (2 minutes)

1. **Restart dev server**:
   ```bash
   npm run dev
   ```

2. **Open**: http://localhost:5174/

3. **Login** → **Dashboard** → **Click 🤖 button** (top right)

4. **Click**: "Check API Status"
   - Should show: ✅ OpenAI: true, ✅ Hugging Face: true

5. **Click**: "Test All APIs"
   - Should get detailed AI analysis with GPT reasoning

---

## 🎉 **Expected Results**

### **Before (Local AI only)**:
```json
{
  "urgencyScore": 4.5,
  "confidence": 0.7,
  "reasoning": "Local AI analysis"
}
```

### **After (With APIs)**:
```json
{
  "urgencyScore": 4.8,
  "confidence": 0.95,
  "reasoning": "Local AI + OpenAI GPT analysis + Emotion Detection",
  "openaiAnalysis": {
    "reasoning": "Indicates immediate family emergency with children in distress",
    "emotionalState": "panic",
    "recommendations": ["Prioritize immediately", "Contact emergency services"]
  },
  "emotionDetection": [
    {"label": "fear", "score": 0.8},
    {"label": "sadness", "score": 0.6}
  ]
}
```

---

## 🔧 **Troubleshooting**

### **OpenAI Issues**:
- ❌ "API key not configured" → Check `.env.local` file
- ❌ "Insufficient credits" → Add billing at platform.openai.com
- ❌ "Rate limit" → Wait 1 minute, try again

### **Hugging Face Issues**:
- ❌ "Token not configured" → Check `.env.local` file
- ❌ "Model loading" → Wait 30 seconds, try again
- ❌ "Rate limit" → Free tier: 1000 requests/month

### **General Issues**:
- 🔄 **Restart dev server** after changing `.env.local`
- 🔍 **Check browser console** for error messages
- 📝 **Ensure no spaces** around `=` in `.env.local`

---

## 🎯 **Test Commands**

**In browser console**:
```javascript
// Check if APIs are configured
console.log('OpenAI:', import.meta.env.VITE_OPENAI_API_KEY?.startsWith('sk-'))
console.log('Hugging Face:', import.meta.env.VITE_HUGGINGFACE_API_KEY?.startsWith('hf_'))
```

---

## ✅ **Success Checklist**

- [ ] OpenAI account created & verified
- [ ] OpenAI API key copied to `.env.local`
- [ ] OpenAI billing added ($5-10)
- [ ] Hugging Face account created
- [ ] Hugging Face token copied to `.env.local`
- [ ] Dev server restarted
- [ ] 🤖 AI Test Panel shows green status
- [ ] "Test All APIs" returns detailed analysis

**🎉 You're ready! JOFLOW now has enterprise-grade AI!**