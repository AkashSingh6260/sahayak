import React from "react";
import Hero from "../components/Hero";
import HowItWorks from "../components/HowItWorks";
import WhyChooseUs from "../components/WhyChooseUs";
import LanguageCarousel from "../components/LanguageCarousel";
import Cta from "../components/Cta";
import Testimonials from "../components/Testimonials";
import Footer from "../components/Footer";

const Home = () => {
  return (
    <>
      <Hero />
      <HowItWorks />
      <WhyChooseUs />
      <Cta />
      <Testimonials />
      <LanguageCarousel />
      <Footer />
    </>
  );
};

export default Home;