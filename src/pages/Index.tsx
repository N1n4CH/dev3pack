import React from 'react';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import HowItWorks from '@/components/HowItWorks';
import HabitCommitment from '@/components/HabitCommitment';
import Dashboard from '@/components/Dashboard';
import RewardsSection from '@/components/RewardsSection';
import Footer from '@/components/Footer';

const Index: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main>
        <HeroSection />
        <HowItWorks />
        <HabitCommitment />
        <Dashboard />
        <RewardsSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
