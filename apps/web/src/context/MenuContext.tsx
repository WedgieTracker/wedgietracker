"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  type ReactNode,
} from "react";

interface MenuContextType {
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

const BODY_LOCKED_CLASS = "body-locked";
const SCROLL_Y_VAR = "--scroll-y";

function unlockBody() {
  document.body.classList.remove(BODY_LOCKED_CLASS);
  document.body.style.removeProperty(SCROLL_Y_VAR);
}

export function MenuProvider({ children }: { children: ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const scrollPosRef = useRef(0);

  useEffect(() => {
    if (isMenuOpen) {
      scrollPosRef.current = window.scrollY;
      document.body.style.setProperty(
        SCROLL_Y_VAR,
        `${scrollPosRef.current}px`,
      );
      document.body.classList.add(BODY_LOCKED_CLASS);
    } else {
      unlockBody();
      if (scrollPosRef.current !== 0) {
        window.scrollTo(0, scrollPosRef.current);
        scrollPosRef.current = 0;
      }
    }

    return unlockBody;
  }, [isMenuOpen]);

  return (
    <MenuContext.Provider value={{ isMenuOpen, setIsMenuOpen }}>
      {children}
    </MenuContext.Provider>
  );
}

export function useMenu() {
  const context = useContext(MenuContext);
  if (context === undefined) {
    throw new Error("useMenu must be used within a MenuProvider");
  }
  return context;
}
