import { navigation } from "../data/companyData";
import { Brand } from "./Icon";
export function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-top">
          <div>
            <a href="#home" aria-label="Nuvra home">
              <Brand />
            </a>
            <p>
              Thoughtful technology.
              <br />
              Lasting possibilities.
            </p>
          </div>
          <nav aria-label="Footer navigation">
            {navigation
              .filter((item) => item.href !== "#home")
              .map((item) => (
                <a key={item.href} href={item.href}>
                  {item.label}
                </a>
              ))}
          </nav>
          <div className="footer-contact">
            <span>HAVE SOMETHING IN MIND?</span>
            <a href="#contact">
              hello@nuvra.example <span aria-hidden="true">↗</span>
            </a>
            <small>Illustrative contact address</small>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Nuvra. All rights reserved.</span>
          <span>Fictional company · Built for an internship portfolio</span>
          <a href="#home">Back to top ↑</a>
        </div>
      </div>
    </footer>
  );
}
