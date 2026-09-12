import { Admin } from "./components/Admin";
import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { About } from "./components/About";
import { Services } from "./components/Services";
import { Benefits } from "./components/Benefits";
import { Stats } from "./components/Stats";
import { CTA } from "./components/CTA";
import { Footer } from "./components/Footer";
export default function App() {
  if (window.location.pathname.replace(/\/+$/, "") === "/admin")
    return <Admin />;
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Navbar />
      <main id="main-content">
        <Hero />
        <About />
        <Services />
        <Benefits />
        <Stats />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
