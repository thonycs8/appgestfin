import { Hero } from './Hero';
import { Features } from './Features';
import { Testimonials } from './Testimonials';
import { Pricing } from './Pricing';
import { Footer } from './Footer';

export function LandingPage() {
  return (
    <div className="min-h-screen">
      <Hero />
      <Features />
      <Testimonials />
      <Pricing />
      <Footer />
    </div>
  );
}