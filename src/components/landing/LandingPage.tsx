import { useState } from 'react';
import { Languages, Menu, X, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { SignInButton } from '@clerk/clerk-react';
import { useApp } from '@/contexts/AppContext';
import { Hero } from './Hero';
import { Features } from './Features';
import { Testimonials } from './Testimonials';
import { Pricing } from './Pricing';
import { Footer } from './Footer';

function LandingHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { language, setLanguage } = useApp();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Gestfin</h1>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">
              {language === 'pt' ? 'Recursos' : 'Features'}
            </a>
            <a href="#testimonials" className="text-gray-600 hover:text-gray-900 transition-colors">
              {language === 'pt' ? 'Depoimentos' : 'Testimonials'}
            </a>
            <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">
              {language === 'pt' ? 'Preços' : 'Pricing'}
            </a>
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            {/* Language Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 px-3 border-gray-300 text-gray-700 hover:bg-gray-50">
                  <Languages className="h-4 w-4 mr-2" />
                  {language === 'pt' ? 'PT' : 'EN'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white border border-gray-200">
                <DropdownMenuItem 
                  onClick={() => setLanguage('pt')}
                  className={language === 'pt' ? 'bg-gray-100' : ''}
                >
                  🇵🇹 Português
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setLanguage('en')}
                  className={language === 'en' ? 'bg-gray-100' : ''}
                >
                  🇬🇧 English
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Sign In Button */}
            <SignInButton mode="modal">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                {language === 'pt' ? 'Entrar' : 'Sign In'}
              </Button>
            </SignInButton>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden text-gray-700 hover:bg-gray-100"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <nav className="flex flex-col space-y-4">
              <a 
                href="#features" 
                className="text-gray-600 hover:text-gray-900 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {language === 'pt' ? 'Recursos' : 'Features'}
              </a>
              <a 
                href="#testimonials" 
                className="text-gray-600 hover:text-gray-900 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {language === 'pt' ? 'Depoimentos' : 'Testimonials'}
              </a>
              <a 
                href="#pricing" 
                className="text-gray-600 hover:text-gray-900 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {language === 'pt' ? 'Preços' : 'Pricing'}
              </a>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <LandingHeader />
      <div className="pt-16">
        <Hero />
        <div id="features">
          <Features />
        </div>
        <div id="testimonials">
          <Testimonials />
        </div>
        <div id="pricing">
          <Pricing />
        </div>
        <Footer />
      </div>
    </div>
  );
}