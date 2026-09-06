import { useRef, useState } from "react";
import { navigation } from "../data/companyData";
import { Brand } from "./Icon";

export function Navbar() {
  const [open, setOpen] = useState(false);
  // Return keyboard focus to the menu button when Escape closes the menu.
  const menuButton = useRef<HTMLButtonElement>(null);

  return (
    <header
      className="site-header"
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          setOpen(false);
          menuButton.current?.focus();
        }
      }}
    >
      <div className="container nav-wrap">
        <a href="#home" aria-label="Nuvra home" onClick={() => setOpen(false)}>
          <Brand />
        </a>
        <button
          ref={menuButton}
          className="menu-toggle"
          aria-expanded={open}
          aria-controls="main-navigation"
          onClick={() => setOpen(!open)}
        >
          {open ? "Close" : "Menu"}
        </button>
        <nav
          id="main-navigation"
          className={open ? "navigation is-open" : "navigation"}
          aria-label="Main navigation"
        >
          {navigation.map((item) => (
            <a key={item.href} href={item.href} onClick={() => setOpen(false)}>
              {item.label}
            </a>
          ))}
          <a
            className="button button-small"
            href="#contact"
            onClick={() => setOpen(false)}
          >
            Contact us
          </a>
        </nav>
      </div>
    </header>
  );
}
