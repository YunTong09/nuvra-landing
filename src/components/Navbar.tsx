import { useEffect, useRef, useState } from "react";
import { navigation } from "../data/companyData";
import { Brand } from "./Icon";
import { currentUser, spacePath } from "../auth";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [spaceHref, setSpaceHref] = useState("/login");
  // Return keyboard focus to the menu button when Escape closes the menu.
  const menuButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    let active = true;
    currentUser().then(user => { if (active) setSpaceHref(spacePath(user)); });
    return () => { active = false; };
  }, []);

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
          <a href={spaceHref} onClick={(event) => {
            event.preventDefault();
            setOpen(false);
            currentUser().then(user => window.location.assign(spacePath(user)));
          }}>My space</a>
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
