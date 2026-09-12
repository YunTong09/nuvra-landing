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
              Simple tools
              <br />
              for everyday organisation.
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
            <span>CONTACT</span>
            <span>hello@nuvra.example</span>
            <small>Placeholder email address</small>
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
