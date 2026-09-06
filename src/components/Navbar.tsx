import { useEffect, useRef, useState } from "react";
import { navigation } from "../data/companyData";
import { Brand, Icon } from "./Icon";
export function Navbar() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("#home");
  const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting) setActive(`#${entry.target.id}`);
      },
      { rootMargin: "-15% 0px -60% 0px", threshold: 0 },
    );
    navigation.forEach((item) => {
      const section = document.querySelector(item.href);
      if (section) observer.observe(section);
    });
    const media = window.matchMedia("(min-width: 769px)");
    const close = () => setOpen(false);
    media.addEventListener("change", close);
    return () => {
      observer.disconnect();
      media.removeEventListener("change", close);
    };
  }, []);
  return (
    <header
      className="site-header"
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          setOpen(false);
          toggle.current?.focus();
        }
      }}
    >
      <div className="container nav-wrap">
        <a href="#home" aria-label="Nuvra home" onClick={() => setOpen(false)}>
          <Brand />
        </a>
        <button
          ref={toggle}
          className="menu-toggle"
          aria-expanded={open}
          aria-controls="main-navigation"
          aria-label={open ? "Close navigation" : "Open navigation"}
          onClick={() => setOpen(!open)}
        >
          <span /> <span /> <span />
        </button>
        <nav
          id="main-navigation"
          className={open ? "navigation is-open" : "navigation"}
          aria-label="Main navigation"
        >
          {navigation.map((item) => (
            <a
              key={item.href}
              href={item.href}
              aria-current={active === item.href ? "location" : undefined}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </a>
          ))}
          <a
            className="button button-small"
            href="#contact"
            onClick={() => setOpen(false)}
          >
            Let’s talk <Icon name="arrow" />
          </a>
        </nav>
      </div>
    </header>
  );
}
