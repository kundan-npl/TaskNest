import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  RocketLaunchIcon,
  SparklesIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  BellAlertIcon,
  EnvelopeIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  ClockIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  StarIcon,
  PlayIcon,
  CpuChipIcon,
  BoltIcon,
  HeartIcon
} from '@heroicons/react/24/outline';

const Home = () => {
  const navigate = useNavigate();
  const { currentUser, loading } = useAuth();
  const [activeFeature, setActiveFeature] = useState(0);

  const features = [
    {
      icon: <CheckCircleIcon className="h-8 w-8" />,
      title: "Smart Task Management",
      description: "Organize, prioritize, and track tasks with intelligent categorization and automated status updates.",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: <UserGroupIcon className="h-8 w-8" />,
      title: "Team Collaboration",
      description: "Real-time collaboration with your team, shared workspaces, and instant communication tools.",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: <CalendarDaysIcon className="h-8 w-8" />,
      title: "Calendar Integration",
      description: "Seamlessly sync with your calendar, schedule tasks, and never miss important deadlines.",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: <ChartBarIcon className="h-8 w-8" />,
      title: "Progress Analytics",
      description: "Comprehensive insights into team performance, project progress, and productivity metrics.",
      color: "from-orange-500 to-red-500"
    },
    {
      icon: <BellAlertIcon className="h-8 w-8" />,
      title: "Smart Notifications",
      description: "Intelligent alerts that keep you informed without overwhelming your workflow.",
      color: "from-teal-500 to-blue-500"
    },
    {
      icon: <SparklesIcon className="h-8 w-8" />,
      title: "Automation Features",
      description: "Automate repetitive tasks, set up workflows, and boost team efficiency with smart automation.",
      color: "from-indigo-500 to-purple-500"
    }
  ];

  const howItWorks = [
    {
      step: "1",
      title: "Quick Setup",
      description: "Create your account and set up your first project in under 2 minutes",
      icon: <RocketLaunchIcon className="h-12 w-12" />
    },
    {
      step: "2",
      title: "Organize & Collaborate",
      description: "Add tasks, invite team members, and start collaborating immediately",
      icon: <UserGroupIcon className="h-12 w-12" />
    },
    {
      step: "3",
      title: "Track & Deliver",
      description: "Monitor progress, meet deadlines, and deliver exceptional results",
      icon: <CheckCircleIcon className="h-12 w-12" />
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Project Manager at TechCorp",
      avatar: "https://i.pravatar.cc/150?img=1",
      content: "TaskNest revolutionized how our team collaborates. The AI features save us hours every week!",
      rating: 5
    },
    {
      name: "Mike Chen",
      role: "Startup Founder",
      avatar: "https://i.pravatar.cc/150?img=2",
      content: "Finally, a task manager that actually understands our workflow. The email automation is a game-changer.",
      rating: 5
    },
    {
      name: "Emily Rodriguez",
      role: "Marketing Director",
      avatar: "https://i.pravatar.cc/150?img=3",
      content: "TaskNest's smart notifications keep us on track without being overwhelming. Best productivity tool we've used.",
      rating: 5
    }
  ];

  const benefits = [
    {
      icon: <BoltIcon className="h-6 w-6" />,
      title: "3x Faster Project Delivery",
      description: "AI-optimized workflows reduce project completion time significantly"
    },
    {
      icon: <HeartIcon className="h-6 w-6" />,
      title: "95% Less Stress",
      description: "Automated reminders and smart scheduling eliminate deadline anxiety"
    },
    {
      icon: <ChartBarIcon className="h-6 w-6" />,
      title: "40% Better Team Performance",
      description: "Real-time insights help teams identify and fix bottlenecks quickly"
    },
    {
      icon: <ClockIcon className="h-6 w-6" />,
      title: "Save 10+ Hours Weekly",
      description: "AI automation handles routine tasks so you focus on what matters"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Header */}
      <nav className="absolute top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">T</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">TaskNest</span>
            </div>
            
            <div className="flex items-center space-x-4">
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-8 w-20 bg-gray-200 rounded"></div>
                </div>
              ) : currentUser ? (
                <>
                  <span className="text-gray-600">Welcome back, {currentUser.name}</span>
                  <Link 
                    to="/dashboard" 
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
                  >
                    Dashboard
                  </Link>
                </>
              ) : (
                <>
                  <Link 
                    to="/auth/login" 
                    className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link 
                    to="/auth/register" 
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 min-h-[85vh] flex items-center pt-20">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative container mx-auto px-4 py-16">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-8">
              <SparklesIcon className="h-4 w-4 mr-2" />
              Welcome to TaskNest
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Manage Projects
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Like a Pro </span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              The all-in-one project management solution that helps teams organize tasks, 
              collaborate seamlessly, and deliver outstanding results on time, every time.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              {currentUser ? (
                <button
                  onClick={() => navigate('/dashboard')}
                  className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  <span className="flex items-center">
                    Go to Dashboard
                    <ArrowRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
              ) : (
                <button
                  onClick={() => navigate('/auth/register')}
                  className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  <span className="flex items-center">
                    Get Started Free
                    <ArrowRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
              )}
              
              <button className="group flex items-center px-8 py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:border-blue-500 hover:text-blue-600 transition-all duration-300">
                <PlayIcon className="mr-2 h-5 w-5" />
                Watch Demo
              </button>
            </div>
            
            <div className="flex items-center justify-center space-x-8 text-sm text-gray-500">
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                No credit card required
              </div>
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                14-day free trial
              </div>
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                Cancel anytime
              </div>
            </div>
          </div>
        </div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 animate-float">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full opacity-20"></div>
        </div>
        <div className="absolute bottom-20 right-10 animate-float-delayed">
          <div className="w-24 h-24 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full opacity-20"></div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose TaskNest?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features designed to streamline your workflow and boost team productivity.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group p-8 bg-white rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-xl transition-all duration-300 cursor-pointer"
                onMouseEnter={() => setActiveFeature(index)}
              >
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${feature.color} text-white mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Showcase Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium mb-8">
              <CpuChipIcon className="h-4 w-4 mr-2" />
              AI-Powered Automation
            </div>
            
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              The Future of Task Management is Here
            </h2>
            
            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
              Our AI agent doesn't just manage tasks—it learns your patterns, automates communications, 
              and continuously optimizes your workflow for maximum efficiency.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
              <div className="bg-white p-8 rounded-2xl shadow-lg">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg mr-4">
                    <EnvelopeIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold">Smart Email Automation</h3>
                </div>
                <p className="text-gray-600 mb-4">
                  AI agent automatically sends status updates, meeting reminders, and progress reports to stakeholders.
                </p>
                <div className="text-sm text-blue-600 font-medium">Coming Soon</div>
              </div>
              
              <div className="bg-white p-8 rounded-2xl shadow-lg">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-purple-100 rounded-lg mr-4">
                    <SparklesIcon className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold">Intelligent Task Creation</h3>
                </div>
                <p className="text-gray-600 mb-4">
                  AI analyzes project requirements and automatically creates optimized task breakdowns and timelines.
                </p>
                <div className="text-sm text-green-600 font-medium">Available Now</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Get Started in Minutes, Not Hours
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              TaskNest is designed to be intuitive from day one. No complex setup, no steep learning curve.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {howItWorks.map((step, index) => (
              <div key={index} className="text-center relative">
                <div className="mx-auto mb-6 relative">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white mx-auto">
                    {step.icon}
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {step.step}
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-600">
                  {step.description}
                </p>
                {index < howItWorks.length - 1 && (
                  <div className="hidden md:block absolute top-10 right-0 transform translate-x-1/2">
                    <ArrowRightIcon className="h-6 w-6 text-gray-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Real Results for Real Teams
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Join thousands of teams who have transformed their productivity with TaskNest.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center p-6 bg-white rounded-2xl shadow-lg">
                <div className="inline-flex p-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full mb-4">
                  {benefit.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {benefit.title}
                </h3>
                <p className="text-gray-600">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Loved by Teams Worldwide
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              See what our customers are saying about their TaskNest experience.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-50 p-8 rounded-2xl">
                <div className="flex items-center mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <StarIcon key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic">
                  "{testimonial.content}"
                </p>
                <div className="flex items-center">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full mr-4"
                  />
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-gray-600 text-sm">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">
            {currentUser ? "Welcome Back to TaskNest!" : "Ready to Build Your TaskNest?"}
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            {currentUser 
              ? "Continue managing your projects and collaborating with your team." 
              : "Join thousands of teams already using TaskNest to deliver better results, faster."
            }
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {currentUser ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="group px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                <span className="flex items-center">
                  Go to Dashboard
                  <ArrowRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/auth/register')}
                  className="group px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  <span className="flex items-center">
                    Start Free Trial
                    <ArrowRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
                
                <button
                  onClick={() => navigate('/auth/login')}
                  className="px-8 py-4 border-2 border-white text-white font-semibold rounded-xl hover:bg-white hover:text-blue-600 transition-all duration-300"
                >
                  Sign In
                </button>
              </>
            )}
          </div>
          
          <div className="mt-8 text-sm opacity-75">
            No setup fees • Cancel anytime • 14-day free trial
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-4">TaskNest</h3>
              <p className="text-gray-400 mb-4">
                AI-powered task management for modern teams.
              </p>
              <div className="flex space-x-4">
                {/* Social media icons would go here */}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="#" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link to="#" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link to="#" className="hover:text-white transition-colors">API</Link></li>
                <li><Link to="#" className="hover:text-white transition-colors">Integrations</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="#" className="hover:text-white transition-colors">About</Link></li>
                <li><Link to="#" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link to="#" className="hover:text-white transition-colors">Careers</Link></li>
                <li><Link to="#" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="#" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link to="#" className="hover:text-white transition-colors">Documentation</Link></li>
                <li><Link to="#" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link to="#" className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2025 TaskNest. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
