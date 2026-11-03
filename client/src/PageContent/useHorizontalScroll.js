import { useRef } from "react";
import "./useHorizontalScroll.css";

const useHorizontalScroll = (scrollAmount = 300) => {
    const scrollRef = useRef(null);

    const scrollLeft = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({
                left: -scrollAmount,
                behavior: "smooth",
            });
        }
    };

    const scrollRight = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({
                left: scrollAmount,
                behavior: "smooth",
            });
        }
    };

    return {
        scrollRef,
        scrollLeft,
        scrollRight,
    };
};

export default useHorizontalScroll;
