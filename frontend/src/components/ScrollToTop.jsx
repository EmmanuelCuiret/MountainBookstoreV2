import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUp } from "@fortawesome/free-solid-svg-icons";

const ScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isScrollable, setIsScrollable] = useState(false);

  useEffect(() => {
    const checkScrollable = () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const innerHeight = window.innerHeight;

      //console.log("scrollHeight:", scrollHeight, "innerHeight:", innerHeight); // Debug
      setIsScrollable(scrollHeight > innerHeight);
    };

    const toggleVisibility = () => {
      //console.log("scrollY:", window.scrollY); // Debug
      if (window.scrollY > 400 && isScrollable) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    checkScrollable(); // Vérifier au premier chargement
    window.addEventListener("resize", checkScrollable);
    window.addEventListener("scroll", toggleVisibility);

    return () => {
      window.removeEventListener("resize", checkScrollable);
      window.removeEventListener("scroll", toggleVisibility);
    };
  }, [isScrollable]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      {isScrollable && (
        <button className={`fixed bottom-5 right-5 bg-blue-500 text-white p-3 rounded-full shadow-lg transition-opacity duration-300 ${isVisible ? "opacity-100" : "opacity-0"}`} onClick={scrollToTop} aria-label="Revenir en haut">
          <FontAwesomeIcon icon={faArrowUp} size="lg" />
        </button>
      )}
    </>
  );
};

export default ScrollToTop;
