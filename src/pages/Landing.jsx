import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import TrustBar from "../components/TrustBar";
import Workflow from "../components/Workflow";
import Features from "../components/Features";
import Pricing from "../components/Pricing";
import Testimonials from "../components/Testimonials";
import FAQ from "../components/FAQ";
import CTASection from "../components/CTASection";
import Footer from "../components/Footer";

export default function Landing() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <Hero />
        <TrustBar />
        <Workflow />
        <Features />
        <Pricing />
        <Testimonials />
        <FAQ />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
