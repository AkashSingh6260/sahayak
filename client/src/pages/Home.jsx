import React from 'react'
import Hero from '../components/Hero'
import HowItWorks from '../components/HowItWorks'
import WhyChooseUs from '../components/WhyChooseUs'
import Cta from '../components/cta'
import Testimonials from '../components/Testimonials'
import LanguageCarousel from '../components/LanguageCarousel'
import Footer from '../components/Footer'

const Home = () => {
  return (
    <>
    <Hero/>
    <HowItWorks/>
    <WhyChooseUs/>
    <Cta/>
    <Testimonials/>
    <LanguageCarousel/>
    <Footer/>

    </>
  )
}

export default Home