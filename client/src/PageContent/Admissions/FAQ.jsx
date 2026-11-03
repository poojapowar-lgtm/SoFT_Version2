import React, { useEffect, useState } from "react";
import axios from "axios";
import { RiArrowDownSLine } from "react-icons/ri";
import DOMPurify from "dompurify";

const FAQ = () => {
    const [faqList, setFaqList] = useState([]);
    const [activeIndex, setActiveIndex] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const toggleAccordion = (index) => {
        setActiveIndex((prev) => (prev === index ? null : index));
    };

    useEffect(() => {
        const fetchFAQs = async () => {
            try {
                const response = await axios.get(
                    "http://localhost:5000/api/faqs"
                );
                setFaqList(response.data);
            } catch (err) {
                console.error("Error fetching FAQs:", err);
                setError("Unable to load FAQs. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchFAQs();
    }, []);

    return (
        <div>
            <h2 className="innerpage-title">FAQ's</h2>

            <div className="accordion-container">
                {loading ? (
                    <p>Loading FAQs...</p>
                ) : error ? (
                    <p>{error}</p>
                ) : faqList.length === 0 ? (
                    <p>No FAQs available.</p>
                ) : (
                    faqList.map((item, index) => (
                        <div key={item.id} className="accordion-item">
                            <div
                                className={`faq-header ${
                                    activeIndex === index ? "active" : ""
                                }`}
                                onClick={() => toggleAccordion(index)}
                                role="button"
                                tabIndex={0}
                                aria-expanded={activeIndex === index}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        toggleAccordion(index);
                                    }
                                }}
                            >
                                <h4 className="accordion-title">
                                    {item.question}
                                </h4>

                                <span className="faq-icon">
                                    <RiArrowDownSLine />
                                </span>
                            </div>

                            {activeIndex === index && (
                                <div className="accordion-content-wrapper">
                                    <div
                                        className="accordion-content"
                                        dangerouslySetInnerHTML={{
                                            __html: DOMPurify.sanitize(
                                                item.answer || ""
                                            ),
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default FAQ;