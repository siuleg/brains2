import React, { useState, useEffect, useRef } from "react";

type cardInfo = {
    level:      string | null
    path:      string
}

const MainCar = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const slidesToShow = 5;
    const cardsInfo: Array<cardInfo> = [
        {level:"Level 22",path:"/oldSVGs/level-22.svg"},
        {level:"Level 23",path:"/oldSVGs/level-23.svg"},
        {level:"Level 24",path:"/oldSVGs/level-24.svg"},
        {level:"Level 25",path:"/oldSVGs/level-25.svg"},
        {level:"Level 26",path:"/oldSVGs/level-26.svg"},
        {level:"Level 27",path:"/oldSVGs/level-27.svg"},
        {level:"Level 28",path:"/oldSVGs/level-28.svg"},
        {level:"Level 29",path:"/oldSVGs/level-29.svg"},
        {level:"Level 30",path:"/oldSVGs/level-30.svg"},
        {level:"Level 22",path:"/oldSVGs/level-22.svg"}
    ];

    const totalSlides = cardsInfo.length;

    function useAutoSlide(callback: () => void, delay: number) {
        const savedCallback = useRef(callback);
        useEffect(() => {
            savedCallback.current = callback;
        }, [callback]);

        useEffect(() => {
            const tick = () => savedCallback.current();
            if (delay !== null) {
            const id = setInterval(tick, delay);
            return () => clearInterval(id);
            }
        }, [delay]);
    }

    const next = () => {
        setCurrentIndex(
            currentIndex === totalSlides - slidesToShow ? 0 : currentIndex + slidesToShow
        );
    };

  useAutoSlide(next, 5000)

  return (
    <div className="relative w-full">
      <div className="overflow-hidden">
        <div
          className="flex transition-all duration-300 ease-in-out"
          style={{transform: `translateX(-${(currentIndex * 100) / slidesToShow}%)`,}}>
          {cardsInfo.map((slide, index) => (
            <div key={index} className="w-full sm:w-1/2 lg:w-1/5 flex-none p-0.5 pt-4 ">
              <div className="bg-[#1f2937] p-6 rounded-lg">
                <div className="w-full h-40 bg-gray-400 rounded-lg">
                    <img src={slide.path} alt={slide.level} className="w-full h-full" />
                </div>
                <h3 className="text-white mt-2">{slide.level}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MainCar;
