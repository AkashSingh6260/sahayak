import React from "react";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import HowItWorks from "../components/HowItWorks";
import WhyChooseUs from "../components/WhyChooseUs";
import Cta from "../components/Cta";
import Testimonials from "../components/Testimonials";
import Footer from "../components/Footer";

const Home=()=>{
    return(
        <>
        
        <Hero />
        <HowItWorks />
        <WhyChooseUs />
        <Cta />
        <Testimonials />
        <Footer />
        </>
    );
}

export default Home;