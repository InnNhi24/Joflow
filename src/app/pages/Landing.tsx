import Button from '../components/Button';

interface LandingProps {
  onGetStarted: () => void;
}

export default function Landing({ onGetStarted }: LandingProps) {
  return (
    <div className="min-h-screen relative bg-white">
      {/* Hero */}
      <section className="px-6 py-24 lg:py-32 relative z-10" style={{
        backgroundImage: 'url("/map-background.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}>
        {/* Overlay for text readability */}
        <div className="absolute inset-0 bg-gray-500/60"></div>
        
        <div className="text-center relative z-10 max-w-6xl mx-auto">
          <h1 
            className="text-5xl lg:text-7xl font-bold text-white mb-6 tracking-tight animate-float-in-title"
            style={{
              textShadow: '0 8px 16px rgba(0, 0, 0, 0.4), 0 4px 8px rgba(0, 0, 0, 0.3)',
              WebkitTextStroke: '2px rgba(160, 160, 160, 0.3)',
              filter: 'drop-shadow(0 0 20px rgba(255, 255, 255, 0.3))'
            }}
          >
            JOFLOW
          </h1>
          <p 
            className="text-2xl lg:text-3xl text-white mb-4 font-light animate-float-in-subtitle"
            style={{
              textShadow: '0 4px 8px rgba(0, 0, 0, 0.5), 0 2px 4px rgba(0, 0, 0, 0.3)',
              filter: 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.2))'
            }}
          >
            AI-Powered Community Relief Platform
          </p>
          <p 
            className="text-lg lg:text-xl text-white/90 mb-12 max-w-3xl mx-auto animate-float-in-description"
            style={{
              textShadow: '0 3px 6px rgba(0, 0, 0, 0.4), 0 1px 3px rgba(0, 0, 0, 0.2)',
              filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.15))'
            }}
          >
            Join the flow of giving and receiving. Our intelligent matching system connects donors with those in need using advanced AI and real-time geospatial technology.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-float-in-buttons">
            <Button 
              onClick={onGetStarted} 
              variant="secondary" 
              size="lg" 
              className="whitespace-nowrap !bg-gradient-to-r !from-yellow-700/70 !to-amber-800/70 !text-white !border-yellow-700/70 hover:!from-yellow-700/80 hover:!to-amber-800/80 hover:!border-yellow-700/80"
              style={{
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3), 0 6px 12px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.1) inset'
              }}
            >
              <span>Get Started</span>
            </Button>
            <Button 
              variant="secondary" 
              size="lg"
              className="bg-white/90 text-gray-900 hover:bg-white shadow-xl"
              onClick={() => {
                document.getElementById('how-it-works')?.scrollIntoView({ 
                  behavior: 'smooth' 
                });
              }}
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="how-it-works" className="px-6 py-20 bg-white/90 backdrop-blur-md relative z-10">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl lg:text-4xl font-bold text-center text-gray-900 mb-16">
            How JOFLOW Works
          </h2>
          
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-blue-100 flex items-center justify-center">
                <span className="text-2xl">📍</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Real-time Mapping</h3>
              <p className="text-gray-600">
                See Givers and Receivers on a live map with precise locations
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-purple-100 flex items-center justify-center">
                <span className="text-2xl">🤖</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">AI-Powered Matching</h3>
              <p className="text-gray-600">
                Advanced AI analyzes urgency from text and finds optimal matches using machine learning
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-green-100 flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Safe Connections</h3>
              <p className="text-gray-600">
                Double confirmation system ensures trust and accountability
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* AI Features Section */}
      <section className="px-6 py-20 relative z-10 bg-gradient-to-r from-blue-50/80 via-indigo-50/80 to-purple-50/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl lg:text-4xl font-bold text-center text-gray-900 mb-4">
            🤖 AI-Powered Intelligence
          </h2>
          <p className="text-center text-gray-600 mb-16 max-w-3xl mx-auto">
            JOFLOW uses advanced artificial intelligence to make community relief more efficient and effective
          </p>
          
          <div className="grid md:grid-cols-2 gap-12">
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
              <div className="w-12 h-12 mb-6 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
                <span className="text-white text-xl">🧠</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">NLP Urgency Analysis</h3>
              <p className="text-gray-600 mb-4">
                Our AI reads and understands the emotional context in your messages, automatically detecting critical situations and prioritizing urgent requests.
              </p>
              <div className="text-sm text-blue-600 font-medium">
                ✨ Detects keywords like "emergency", "urgent", "desperate"<br/>
                ✨ Analyzes emotional intensity and family situations<br/>
                ✨ Provides real-time urgency scoring (1-5 scale)
              </div>
            </div>
            
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
              <div className="w-12 h-12 mb-6 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center">
                <span className="text-white text-xl">🎯</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Symmetry Matching Engine</h3>
              <p className="text-gray-600 mb-4">
                Advanced machine learning algorithm that works both ways - suggesting matches for both Givers and Receivers with intelligent scoring.
              </p>
              <div className="text-sm text-purple-600 font-medium">
                ✨ Two-way recommendation system<br/>
                ✨ Semantic category relationships (rice ↔ noodles)<br/>
                ✨ Distance optimization with exponential scoring
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-20 relative z-10 bg-gradient-to-r from-white/70 via-white/80 to-white/70 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto text-center">
          <span className="text-4xl mb-6 block">❤️</span>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
            Our Mission
          </h2>
          <p className="text-lg text-gray-600 leading-relaxed">
            JOFLOW creates a seamless ecosystem where those who have can effortlessly 
            connect with those in need. Through technology, transparency, and trust, 
            we're building bridges of kindness that transform communities.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 bg-gray-900 text-white relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">
            Ready to Make a Difference?
          </h2>
          <p className="text-xl text-gray-300 mb-10">
            Join thousands creating positive impact every day
          </p>
          <Button onClick={onGetStarted} variant="secondary" size="lg">
            Enter the Flow
          </Button>
        </div>
      </section>
    </div>
  );
}
