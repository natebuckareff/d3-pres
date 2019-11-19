import { useEffect } from "react";
import { useLocation, useRoute } from "wouter";

export function useKeyDown(callback: (key: string) => void) {
    const handleKeyDown = (e: KeyboardEvent) => callback(e.key);
    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    });
}

export function useSlide() {
    const [, setLocation] = useLocation();
    const [, params] = useRoute("/slide/:slide");
    useKeyDown(key => {
        if (key === "ArrowRight" || key === " ") {
            setLocation(`/slide/${+params.slide + 1}`);
        } else if (key === "ArrowLeft") {
            setLocation(`/slide/${+params.slide - 1}`);
        }
    });
}
