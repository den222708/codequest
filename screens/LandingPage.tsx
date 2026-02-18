import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeFeature, setActiveFeature] = useState(0);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState<Record<string, boolean>>({});
  const [typedText, setTypedText] = useState('');
  const [currentStatIndex, setCurrentStatIndex] = useState(0);

  const codeSnippet = `def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []

# Test: two_sum([2,7,11,15], 9)
# Output: [0, 1]`;

  const highlightCodeLine = (line: string) => {
    if (line.trim().startsWith('#')) {
      return <span className="text-emerald-600">{line}</span>;
    }

    const parts = line.split(/(\bdef\b|\bfor\b|\bin\b|\bif\b|\breturn\b|\benumerate\b|\bseen\b|\bcomplement\b|\bnums\b|\btarget\b|\bi\b|\bnum\b|\{|\}|\[|\]|\(|\)|:|,|=|\+|-)/g);

    return parts.map((part, idx) => {
      if (!part) return null;
      if (['def', 'for', 'in', 'if', 'return'].includes(part)) {
        return <span key={idx} className="text-indigo-600 font-semibold">{part}</span>;
      }
      if (['enumerate'].includes(part)) {
        return <span key={idx} className="text-amber-600 font-medium">{part}</span>;
      }
      if (['seen', 'complement', 'nums', 'target', 'i', 'num'].includes(part)) {
        return <span key={idx} className="text-teal-700">{part}</span>;
      }
      if (/^-?\d+$/.test(part)) {
        return <span key={idx} className="text-rose-600">{part}</span>;
      }
      if (['{', '}', '[', ']', '(', ')', ':', ',', '=', '+', '-'].includes(part)) {
        return <span key={idx} className="text-slate-500">{part}</span>;
      }
      return <span key={idx} className="text-slate-700">{part}</span>;
    });
  };

  // Typing animation for hero code preview
  useEffect(() => {
    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setTypedText(codeSnippet.slice(0, index));
      if (index >= codeSnippet.length) {
        window.clearInterval(timer);
      }
    }, 16);

    return () => window.clearInterval(timer);
  }, [codeSnippet]);

  // Intersection observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible((prev) => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('[data-animate]').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // Auto-rotate features
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 4);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Stats counter animation
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStatIndex((prev) => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const features = [
    {
      icon: 'RT',
      title: 'Real-Time Code Execution',
      description: 'Execute code in Python, JavaScript, Java, and C++ with instant feedback. Our secure sandboxed environment runs your code in milliseconds.',
      gradient: 'from-amber-500 to-orange-600',
    },
    {
      icon: 'IA',
      title: 'Intelligent Assessment',
      description: 'Create adaptive assessments with randomized questions, anti-cheating measures, and automated grading powered by comprehensive test suites.',
      gradient: 'from-emerald-500 to-teal-600',
    },
    {
      icon: 'DA',
      title: 'Deep Analytics',
      description: 'Track student performance with detailed insights. Identify knowledge gaps, monitor progress trends, and generate comprehensive reports.',
      gradient: 'from-violet-500 to-purple-600',
    },
    {
      icon: 'PD',
      title: 'Plagiarism Detection',
      description: 'Advanced similarity detection using MOSS algorithms. Automatically flag suspicious submissions and maintain academic integrity.',
      gradient: 'from-rose-500 to-pink-600',
    },
  ];

  const stats = [
    { value: '50K+', label: 'Students Assessed', icon: 'Students' },
    { value: '1M+', label: 'Code Submissions', icon: 'Submissions' },
    { value: '99.9%', label: 'Uptime', icon: 'Uptime' },
    { value: '<2s', label: 'Execution Time', icon: 'Speed' },
  ];

  const testimonials = [
    {
      quote: "CodeQuest transformed how we conduct programming assessments. The real-time monitoring and plagiarism detection saved us countless hours while maintaining academic integrity.",
      author: "Dr. Sarah Chen",
      role: "CS Department Head, Stanford University",
      avatar: "SC",
      rating: 5,
    },
    {
      quote: "The instant feedback system has dramatically improved student engagement. They can iterate on their solutions immediately, leading to deeper understanding of concepts.",
      author: "Prof. Michael Torres",
      role: "Lead Instructor, MIT",
      avatar: "MT",
      rating: 5,
    },
    {
      quote: "Finally, a platform that understands the needs of large-scale programming courses. Managing 500+ students has never been easier.",
      author: "Dr. Emily Watson",
      role: "Associate Professor, UC Berkeley",
      avatar: "EW",
      rating: 5,
    },
  ];

  const faqs = [
    {
      question: "How does the code execution work?",
      answer: "CodeQuest uses secure Docker containers to execute student code in an isolated environment. Each submission runs with strict time and memory limits, ensuring fair evaluation and system security. We support Python, JavaScript, Java, and C++ with more languages coming soon.",
    },
    {
      question: "What plagiarism detection methods are used?",
      answer: "We employ multiple detection algorithms including tokenization-based comparison, N-gram analysis, and integration with Stanford's MOSS system. Our system can detect code similarity even when variable names are changed or code structure is reorganized.",
    },
    {
      question: "Can I integrate CodeQuest with my existing LMS?",
      answer: "Yes! CodeQuest supports LTI integration for seamless connection with Canvas, Blackboard, Moodle, and other popular learning management systems. Grade sync and single sign-on are fully supported.",
    },
    {
      question: "How do you ensure exam security?",
      answer: "CodeQuest offers multiple security features including IP whitelisting, browser lockdown mode, tab-switch detection, copy-paste monitoring, and optional webcam proctoring. All activities are logged for post-exam review.",
    },
    {
      question: "What kind of support do you provide?",
      answer: "We offer 24/7 technical support via chat and email, dedicated account managers for enterprise clients, comprehensive documentation, and regular training webinars for instructors.",
    },
  ];

  const pricingPlans = [
    {
      name: "Starter",
      price: "Free",
      period: "forever",
      description: "Perfect for individual instructors",
      features: [
        "Up to 50 students",
        "Basic code execution",
        "5 assessments/month",
        "Community support",
        "Basic analytics",
      ],
      cta: "Get Started",
      popular: false,
    },
    {
      name: "Professional",
      price: "$49",
      period: "/month",
      description: "For growing departments",
      features: [
        "Up to 500 students",
        "Advanced code execution",
        "Unlimited assessments",
        "Plagiarism detection",
        "Priority support",
        "Advanced analytics",
        "LMS integration",
      ],
      cta: "Get Started",
      popular: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      description: "For large institutions",
      features: [
        "Unlimited students",
        "Custom deployment",
        "Dedicated support",
        "SLA guarantee",
        "Custom integrations",
        "White-labeling",
        "On-premise option",
      ],
      cta: "Contact Sales",
      popular: false,
    },
  ];

  return (
    <div className="landing-page min-h-screen bg-slate-50 text-slate-900 overflow-x-hidden leading-relaxed">

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/25">
                <span className="text-xl font-bold">&lt;/&gt;</span>
              </div>
              <span className="text-xl font-bold tracking-tight">
                Code<span className="text-teal-400">Quest</span>
              </span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-slate-600 hover:text-slate-900 transition-colors text-sm font-medium">Features</a>
              <a href="#testimonials" className="text-slate-600 hover:text-slate-900 transition-colors text-sm font-medium">Testimonials</a>
              <a href="#pricing" className="text-slate-600 hover:text-slate-900 transition-colors text-sm font-medium">Pricing</a>
              <a href="#faq" className="text-slate-600 hover:text-slate-900 transition-colors text-sm font-medium">FAQ</a>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white transition-colors text-sm font-semibold leading-[1.3]"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        {/* Animated background grid */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(rgba(32,128,144,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(32,128,144,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }} />
        </div>

        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '2s' }} />

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <div className="space-y-8 lg:-ml-4 max-w-[680px]">
              {/* Headline */}
              <h1 className="hero-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight mb-5">
                <span className="block whitespace-nowrap">Assess Code.</span>
                <span className="inline-block whitespace-nowrap bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                  Empower Learning.
                </span>
              </h1>

              {/* Subheadline */}
              <p className="mt-6 text-xl text-slate-600 leading-relaxed max-w-xl">
                The modern platform for programming education. Create assessments, execute code in real-time, and gain deep insights into student performance.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap items-center gap-4">
                <button
                  onClick={() => navigate('/demo')}
                  className="inline-flex items-center justify-center px-8 py-4 rounded-xl text-lg font-semibold bg-emerald-500 hover:bg-emerald-400 text-white transition-all gap-2 leading-[1.3]"
                >
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  Try Demo
                </button>
              </div>

            </div>

            {/* Right Content - Code Editor Mock */}
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute -inset-4 bg-gradient-to-r from-teal-500/20 via-purple-500/20 to-teal-500/20 rounded-3xl blur-2xl opacity-50" />
              
              {/* Code Editor */}
              <div className="relative bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden h-[560px] flex flex-col">
                {/* Editor Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-slate-100 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-slate-500">two_sum.py</span>
                    <select className="bg-white text-xs text-slate-600 px-2 py-1 rounded border border-slate-200">
                      <option>Python</option>
                      <option>JavaScript</option>
                      <option>Java</option>
                      <option>C++</option>
                    </select>
                  </div>
                </div>

                {/* Code Content */}
                <div className="p-6 font-mono text-sm flex-1 overflow-y-auto">
                  <pre className="text-slate-700 leading-relaxed">
                    <code>
                      {(typedText || '').split('\n').map((line, i) => (
                        <div key={i} className="flex">
                          <span className="w-8 text-slate-500 select-none">{i + 1}</span>
                          <span>{highlightCodeLine(line)}</span>
                        </div>
                      ))}
                      {typedText.length < codeSnippet.length && (
                        <div className="flex">
                          <span className="w-8 text-slate-500 select-none">&nbsp;</span>
                          <span className="text-teal-500 animate-pulse">|</span>
                        </div>
                      )}
                    </code>
                  </pre>
                </div>

                {/* Output Panel */}
                <div className="border-t border-slate-200 bg-slate-100 p-4 h-36 overflow-y-auto">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs text-slate-500 uppercase tracking-wider">Test Results</span>
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-xs font-medium">4/4 Passed</span>
                  </div>
                  <div className="space-y-2">
                    {['Test 1: [2,7,11,15], 9 → [0,1]', 'Test 2: [3,2,4], 6 → [1,2]', 'Test 3: [3,3], 6 → [0,1]'].map((test, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <span className="text-emerald-500 font-semibold">OK</span>
                        <span className="text-slate-600 font-mono">{test}</span>
                        <span className="text-gray-600 ml-auto">12ms</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 px-4 py-3 bg-slate-100 border-t border-slate-200">
                  <button className="flex-1 py-2.5 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-lg text-sm font-medium text-emerald-800 transition-colors flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Run Code
                  </button>
                  <button className="flex-1 py-2.5 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 rounded-lg text-sm font-semibold transition-colors">
                    Submit Solution
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-20 border-y border-slate-200 bg-gradient-to-b from-slate-50 via-slate-100 to-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div
                key={i}
                className={`text-center p-6 rounded-2xl transition-all duration-500 ${
                  currentStatIndex === i ? 'bg-gradient-to-br from-teal-500/10 to-purple-500/10 border border-teal-500/20 scale-105' : 'bg-white'
                }`}
              >
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-slate-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-white to-slate-50" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-6">
          {/* Section Header */}
          <div className="text-center mb-20" id="features-header" data-animate>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 border border-slate-200 mb-6">
              <span className="text-teal-400">Feature Set</span>
              <span className="text-sm text-slate-600">Powerful Features</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Everything You Need to
              <span className="block bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
                Assess Programming Skills
              </span>
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              A comprehensive platform designed by educators, for educators. Streamline your coding assessments from creation to grading.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Feature Cards */}
            <div className="space-y-4">
              {features.map((feature, i) => (
                <div
                  key={i}
                  onClick={() => setActiveFeature(i)}
                  className={`p-6 rounded-2xl border cursor-pointer transition-all duration-300 ${
                    activeFeature === i
                      ? 'bg-gradient-to-r from-white/5 to-white/[0.02] border-teal-500/30 shadow-lg shadow-teal-500/10'
                      : 'bg-white border-slate-200 hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-2xl shadow-lg`}>
                      {feature.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                      <p className={`text-slate-600 leading-relaxed transition-all duration-300 ${activeFeature === i ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                        {feature.description}
                      </p>
                    </div>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                      activeFeature === i ? 'bg-teal-500 rotate-180' : 'bg-slate-200'
                    }`}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Feature Preview */}
            <div className="relative lg:h-[500px] rounded-2xl overflow-hidden border border-slate-200 bg-gradient-to-br from-white/5 to-transparent">
              {/* Dynamic content based on active feature */}
              <div className="absolute inset-0 p-8 flex items-center justify-center">
                {activeFeature === 0 && (
                  <div className="text-center space-y-6 animate-fadeIn">
                    <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-2xl shadow-amber-500/30">
                      <span className="text-3xl font-bold text-white">RT</span>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-center gap-4">
                        {['Python', 'JavaScript', 'Java', 'C++'].map((lang, i) => (
                          <div key={i} className="px-4 py-2 bg-slate-100 rounded-lg border border-slate-200 text-sm">
                            {lang}
                          </div>
                        ))}
                      </div>
                      <div className="w-full h-4 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full w-3/4 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full animate-pulse" />
                      </div>
                      <p className="text-slate-600">Code compiled and executed in under 2 seconds</p>
                    </div>
                  </div>
                )}
                {activeFeature === 1 && (
                  <div className="text-center space-y-6 animate-fadeIn">
                    <div className="grid grid-cols-3 gap-4">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className={`aspect-square rounded-xl ${i <= 4 ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-slate-100 border border-slate-200'} flex items-center justify-center`}>
                          <span className="text-sm font-semibold">{i <= 4 ? 'Pass' : 'Pending'}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-slate-600">Randomized, adaptive question selection</p>
                  </div>
                )}
                {activeFeature === 2 && (
                  <div className="text-center space-y-6 animate-fadeIn">
                    <div className="space-y-3 w-full max-w-sm">
                      {[
                        { label: 'Pass Rate', value: 78, color: 'emerald' },
                        { label: 'Avg Score', value: 85, color: 'teal' },
                        { label: 'Completion', value: 92, color: 'purple' },
                      ].map((stat, i) => (
                        <div key={i} className="flex items-center gap-4">
                          <span className="text-sm text-slate-600 w-24">{stat.label}</span>
                          <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full bg-${stat.color}-500 rounded-full transition-all duration-1000`}
                              style={{ width: `${stat.value}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold w-12">{stat.value}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {activeFeature === 3 && (
                  <div className="text-center space-y-6 animate-fadeIn">
                    <div className="relative">
                      <div className="w-32 h-32 mx-auto rounded-full border-8 border-rose-500/30 flex items-center justify-center">
                        <span className="text-4xl font-bold text-rose-400">78%</span>
                      </div>
                      <div className="absolute top-0 right-1/4 px-3 py-1 bg-rose-500/20 rounded-full text-rose-400 text-xs">
                        Flagged
                      </div>
                    </div>
                    <p className="text-slate-600">Similarity detected with submission #1024</p>
                  </div>
                )}
              </div>

              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-teal-500/10 to-transparent rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-purple-500/10 to-transparent rounded-full blur-3xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-slate-50" />
        
        {/* Decorative grid */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at center, rgba(32,128,144,0.3) 0%, transparent 50%)',
          }} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 border border-slate-200 mb-6">
              <span className="text-amber-400">Trusted</span>
              <span className="text-sm text-slate-600">Testimonials</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Trusted by Leading
              <span className="block bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                Institutions Worldwide
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, i) => (
              <div
                key={i}
                className="group p-8 rounded-2xl bg-gradient-to-br from-white/5 to-transparent border border-slate-200 hover:border-teal-500/30 transition-all duration-300 hover:-translate-y-2"
              >
                <div className="flex items-center gap-1 mb-6 text-amber-400">
                  {[...Array(testimonial.rating)].map((_, j) => (
                    <svg key={j} className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <blockquote className="text-slate-700 leading-relaxed mb-6 text-lg">
                  "{testimonial.quote}"
                </blockquote>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center font-bold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold">{testimonial.author}</div>
                    <div className="text-sm text-slate-500">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Logos */}
          <div className="mt-20 pt-12 border-t border-slate-200">
            <p className="text-center text-slate-500 mb-8">Adopted by top universities and organizations</p>
            <div className="flex flex-wrap justify-center items-center gap-12 opacity-40 grayscale hover:grayscale-0 hover:opacity-70 transition-all">
              {['Stanford', 'MIT', 'Berkeley', 'Harvard', 'Carnegie Mellon', 'Georgia Tech'].map((uni, i) => (
                <div key={i} className="text-2xl font-bold tracking-tight">{uni}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-white to-slate-50" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 border border-slate-200 mb-6">
              <span className="text-teal-400">Pricing</span>
              <span className="text-sm text-slate-600">Simple Pricing</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Choose Your
              <span className="bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent"> Plan</span>
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Start free and scale as you grow. No hidden fees, no surprises.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, i) => (
              <div
                key={i}
                className={`relative p-8 rounded-2xl transition-all duration-300 ${
                  plan.popular
                    ? 'bg-gradient-to-b from-teal-500/20 to-teal-500/5 border-2 border-teal-500/50 scale-105 shadow-2xl shadow-teal-500/20'
                    : 'bg-white border border-slate-200 hover:border-slate-300'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full text-sm font-semibold">
                    Most Popular
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                  <p className="text-slate-500 text-sm">{plan.description}</p>
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-slate-500">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-3 text-slate-700">
                      <svg className="w-5 h-5 text-teal-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate('/signup')}
                  className={`w-full py-3 rounded-xl font-semibold transition-all ${
                    plan.popular
                      ? 'bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 shadow-lg shadow-teal-500/25'
                      : 'bg-slate-100 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="relative py-32">
        <div className="absolute inset-0 bg-slate-50" />
        
        <div className="relative z-10 max-w-3xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 border border-slate-200 mb-6">
              <span className="text-purple-400">?</span>
              <span className="text-sm text-slate-600">FAQ</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Frequently Asked
              <span className="block bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Questions
              </span>
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="rounded-2xl border border-slate-200 overflow-hidden transition-all hover:border-slate-300"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left bg-white hover:bg-slate-50 transition-colors"
                >
                  <span className="font-semibold pr-8">{faq.question}</span>
                  <div className={`w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center transition-transform ${activeFaq === i ? 'rotate-180' : ''}`}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${activeFaq === i ? 'max-h-96' : 'max-h-0'}`}>
                  <div className="px-6 py-5 text-slate-600 leading-relaxed border-t border-slate-200">
                    {faq.answer}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50 to-slate-100" />
        
        {/* Animated gradient background */}
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-teal-500/30 via-purple-500/20 to-teal-500/30 rounded-full blur-[120px] animate-pulse" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Ready to Transform Your
            <span className="block bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
              Programming Education?
            </span>
          </h2>
          <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
            Join thousands of educators who have revolutionized their coding assessments. Start your rollout today.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button onClick={() => navigate('/demo')} className="inline-flex items-center justify-center px-10 py-5 rounded-xl text-lg font-semibold bg-emerald-500 hover:bg-emerald-400 text-white transition-all leading-[1.3]">
              Try Demo
            </button>
          </div>
          <p className="mt-6 text-slate-500 text-sm">
            No credit card required • Free 14-day trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-slate-200 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid md:grid-cols-5 gap-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/25">
                  <span className="text-xl font-bold">&lt;/&gt;</span>
                </div>
                <span className="text-xl font-bold">
                  Code<span className="text-teal-400">Quest</span>
                </span>
              </div>
              <p className="text-slate-500 leading-relaxed mb-6">
                The modern platform for programming education. Empowering educators to assess, analyze, and elevate coding skills.
              </p>
              <div className="flex gap-4">
                {['twitter', 'github', 'linkedin', 'youtube'].map((social) => (
                  <a key={social} href="#" className="w-10 h-10 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
                    <span className="text-slate-600 capitalize text-xs">{social.charAt(0).toUpperCase()}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Links */}
            {[
              { title: 'Product', links: ['Features', 'Pricing', 'Integrations', 'Changelog', 'Roadmap'] },
              { title: 'Resources', links: ['Documentation', 'API Reference', 'Blog', 'Community', 'Support'] },
              { title: 'Company', links: ['About', 'Careers', 'Press', 'Partners', 'Contact'] },
            ].map((column, i) => (
              <div key={i}>
                <h4 className="font-semibold mb-4">{column.title}</h4>
                <ul className="space-y-3">
                  {column.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-slate-500 hover:text-slate-900 transition-colors text-sm">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between mt-16 pt-8 border-t border-slate-200">
            <p className="text-slate-500 text-sm">
              © 2026 CodeQuest. All rights reserved.
            </p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="#" className="text-slate-500 hover:text-slate-900 transition-colors text-sm">Privacy Policy</a>
              <a href="#" className="text-slate-500 hover:text-slate-900 transition-colors text-sm">Terms of Service</a>
              <a href="#" className="text-slate-500 hover:text-slate-900 transition-colors text-sm">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Custom Styles */}
      <style>{`
        .landing-page {
          font-family: 'Inter', 'Plus Jakarta Sans', sans-serif;
          -webkit-font-smoothing: antialiased;
          text-rendering: optimizeLegibility;
          line-height: 1.4;
        }
        .landing-page button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          line-height: 1.4;
          vertical-align: middle;
        }
        .landing-page p,
        .landing-page a,
        .landing-page li {
          line-height: 1.48;
        }
        .landing-page h1,
        .landing-page h2,
        .landing-page h3,
        .landing-page h4 {
          font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
          line-height: 1.1;
        }
        .landing-page .hero-heading {
          padding-bottom: 0.12em;
          overflow: visible;
        }
        .landing-page .hero-heading span {
          line-height: 1.1;
          padding-bottom: 0.08em;
        }
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease forwards;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
