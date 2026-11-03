
import { useEffect, useState } from "react";

const CountUp = ({ value = 0, duration = 1000 }) => {
  const target = Math.max(0, Number(value) || 0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (target === 0) {
      setCount(0);
      return;
    }

    if (duration <= 0) {
      setCount(target);
      return;
    }

    let startTime = null;
    let animationFrame;

    const animate = (timestamp) => {
      if (startTime === null) {
        startTime = timestamp;
      }

      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * target));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(target);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [target, duration]);

  return <span>{count.toLocaleString("en-IN")}</span>;
};

export default CountUp;
