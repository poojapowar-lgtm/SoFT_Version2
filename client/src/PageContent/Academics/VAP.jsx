import React from "react";
import { useState, useEffect } from "react";
import useHorizontalScroll from "../useHorizontalScroll";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import "./vap.css";

const VAP = () => {
    const [current, setCurrent] = useState(0);

    const {
        scrollRef,
        scrollLeft,
        scrollRight,
    } = useHorizontalScroll(300);

    const images = [
        "/assets/images/vap/vap1.webp",
        "/assets/images/vap/vap2.webp",
        "/assets/images/vap/vap3.webp",
        "/assets/images/vap/vap4.webp",
        "/assets/images/vap/vap5.webp",
        "/assets/images/vap/vap6.webp",
        "/assets/images/vap/vap7.webp",
        "/assets/images/vap/vap5.webp",
    ];

    const getSlidesToShow = () => {
        if (window.innerWidth <= 768) return 1;
        if (window.innerWidth <= 1024) return 2;
        return 3;
    };

    const [slidesToShow, setSlidesToShow] = useState(getSlidesToShow());

    useEffect(() => {
        const handleResize = () => setSlidesToShow(getSlidesToShow());
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return (
        <div>
            <h2 className="innerpage-title">Village Adoption Program (VAP)</h2>
            {/* <h3 className="innerpage-subtitle">PREAMBLE</h3> */}

            <p>
                The Village Adoption Program (VAP), an initiative by MIT School of Food
                Technology, is a credit-bearing course offered in the eighth semester of
                B.Tech. (Food Technology). The program aims to familiarize students with
                the diverse village ecosystem and encourage the younger generation to
                develop entrepreneurial skills through innovative food preservation and
                processing technologies. The VAP was organized from 28 February to
                6 March 2022 for students and villagers in Wade Bolhai, Taluka Haveli,
                Pune. Ten groups of students, comprising 10 to 14 students each, were
                assigned ten mentors to familiarize them with the VAP and its planned
                activities.
            </p>

            <p>
                The Village Adoption Program 2022 was inaugurated in Wade Bolhai village
                on 28 February 2022 in the presence of Mr. Deepak Gawade, Sarpanch of
                Wade Bolhai; Mr. Ganesh Surwase, Agricultural Officer, Wagholi;
                Dr. Anjali Bhoite, In-Charge Principal, MIT School of Food Technology
                (MITSoFT), MIT-ADT University, Pune; Mrs. Sujata Ghodke, VAP Convenor;
                Dr. Ganesh Bhavsar, VAP Coordinator; Dr. Nilesh Kardile; Dr. Sandip
                Gaikwad; Dr. Anupama Devkatte; Mrs. K. A. Mane; and participating
                students, farmers, and villagers.
            </p>

            <p>
                Mr. Ganesh Surwase highlighted the importance of the primary processing
                of local agricultural produce and the need for such programs to
                facilitate technology transfer, improve the overall well-being of
                villagers and farmers, and encourage entrepreneurship among students.
                On 2 March 2022, guest speaker Mr. Balasaheb Khemnar from Biocert
                delivered a talk on organic farming for farmers and villagers in Wade
                Bolhai. A guest lecture was also organized for the women of a Self-Help
                Group associated with Mrs. Manisha Lahoti, founder of Nutristreak Foods,
                Pune. The session aimed to encourage and motivate participants regarding
                food product development and marketing opportunities.
            </p>

            <p>
                Dr. Ashok Jadhav, Mycologist at AICRP on Mushroom, School of Agriculture,
                Pune, demonstrated mushroom cultivation to students, farmers, and
                villagers. During the seven-day program, student groups conducted
                assigned village surveys under the guidance of their respective mentors.
                The surveys covered agricultural cropping patterns, primary food
                processing, post-harvest losses, small-scale entrepreneurship, literacy
                levels, healthcare facilities, drinking water availability, food
                outlets, household sanitation and food safety, school facilities,
                sources of income, and gender-based discrimination.
            </p>

            <p>
                The student groups analyzed the survey data and, under their mentors'
                guidance, recommended strategies to improve socioeconomic conditions,
                hygiene, and agricultural practices for villagers, farmers, and small
                entrepreneurs. Students also demonstrated the preparation of simple
                food products using locally available produce, including grapes,
                pomegranates, and tomatoes. These demonstrations aimed to familiarize
                farmers with the value addition of fruits and vegetables through
                primary-level processing.
            </p>

            <p>
                The VAP 2022 program concluded on 6 March 2022 with a valedictory
                function in Wade Bolhai. The function was attended by Mr. Deepak Gawade,
                Sarpanch; Mrs. Surekhatai Bhorade, Deputy Sarpanch; Dr. Anjali Bhoite,
                In-Charge Principal, MITSoFT, MIT-ADT University, Pune; Mrs. Sujata
                Ghodke, VAP Convenor; Dr. Ganesh Bhavsar, VAP Coordinator; Dr. Nilesh
                Kardile; and participating students, villagers, and farmers.
            </p>

            <div className="vap-gallery">
                <div className="scroll-wrapper">

                    {/* Left Arrow */}
                    <button
                        type="button"
                        className="scroll-btn left"
                        onClick={() =>
                            setCurrent((prev) => Math.max(0, prev - 1))
                        }
                        aria-label="Previous images"
                    >
                        <FaChevronLeft />
                    </button>

                    {/* Existing Slider */}
                    <div className="vap-gallery">
                        <div
                            className="vap-slider"
                            style={{
                                transform: `translateX(-${current * (100 / slidesToShow)}%)`,
                            }}
                        >
                            {images.map((img, index) => (
                                <img
                                    src={img}
                                    key={index}
                                    alt={`Village Adoption Program 2022 - activity ${index + 1}`}
                                    width="400"
                                    height="250"
                                    loading={index < slidesToShow ? "eager" : "lazy"}
                                    decoding="async"
                                />
                            ))}
                        </div>

                        {/* Existing Dots */}
                        <div className="dots">
                            {images.map((_, index) => (
                                <span
                                    key={index}
                                    className={current === index ? "dot active" : "dot"}
                                    onClick={() => setCurrent(index)}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Right Arrow */}
                    <button
                        type="button"
                        className="scroll-btn right"
                        onClick={() =>
                            setCurrent((prev) =>
                                Math.min(images.length - slidesToShow, prev + 1)
                            )
                        }
                        aria-label="Next images"
                    >
                        <FaChevronRight />
                    </button>

                </div>

            </div>
        </div>

    );
};

export default VAP;
