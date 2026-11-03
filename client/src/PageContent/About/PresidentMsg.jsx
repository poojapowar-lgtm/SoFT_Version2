import React from "react";
import "./leadership.css";

const PresidentMsg = () => {
    return (
        <div className="leadership-container">
            <h2 className="innerpage-title">Executive President's Message</h2>

            {/* Section 2 */}
            <div className="leader-card">
                <div className="leader-section">
                    <div className="leader-image">
                        <img
                            src="/assets/images/home/MK-sir.webp"
                            alt="Prof. Dr. Mangesh T. Karad - Pro-Chancellor, MIT-ADT University"
                            width="240"
                            height="240"
                            loading="lazy"
                            decoding="async"
                        />
                    </div>

                    <div className="leader-content">
                        <h3 className="innerpage-subtitle">
                            Hon. Prof. Dr. Mangesh T. Karad
                        </h3>
                        <h4 className="leader-designation">
                            Pro-Chancellor and Executive President, MIT-ADT Art, Design and
                            Technology University
                        </h4>
                        <p>Dear Students,</p>
                        <p>
                            Today's world economy is driven by innovation-led
                            entrepreneurship. Indian youth aspire to take on this challenge
                            and contribute to India's GDP. MIT Art, Design and Technology
                            University, Pune, is a place for such aspiring innovators and
                            entrepreneurs. MIT-ADT University, a leading, futuristic,
                            multidisciplinary university with a unique blend of art, design,
                            and technology programs, prepares students for the future through
                            its cutting-edge programs and equips them for their prospective
                            workplaces through holistic education. This enhances students'
                            learning agility and resilience, empowering them to meet the
                            ever-evolving needs of the world.
                        </p>
                    </div>
                </div>

                <p>
                    In a short span, the University has been recognized as a distinctive
                    institution delivering unparalleled academic excellence under the
                    dynamic, forward-thinking leadership of Prof. Dr. Vishwanath Karad,
                    Founder of the MIT Group of Institutions. With an extensive corporate
                    network, a strong research focus, and a thoughtful approach, we have
                    designed and customized innovative, specialized undergraduate
                    programs and highly specialized postgraduate programs in keeping
                    with prevailing employment trends and industry demands. Engineering
                    education at the University, in addition to the usual engineering
                    branches, offers a wide range of specializations, including AI,
                    Blockchain, Cybersecurity and Forensics, Cloud Computing, Aerospace,
                    Robotics, Bioengineering, Food Technology, Marine Engineering, and
                    Nautical Science, to name a few.
                </p>

                <p>
                    To produce globally competent technocrats and innovators who can lead
                    and make a greater impact on society, with a core vision of
                    contributing to nation-building, MIT-ADT University has established
                    the School of Holistic Development to transform students into
                    winning personalities; the School of Corporate Innovation and
                    Leadership to build tomorrow's global leaders; the Centre for
                    Research and Innovation for Young Aspirants (CRIYA) to promote
                    innovation and new product development; the Centre for Future Skills
                    Excellence to offer emerging technology courses; and the School of
                    Indian Civil Services, which offers a B.A. in Administration to
                    prepare students for administrative services. MIT-ADT University is
                    committed to empowering its students to lead meaningful and
                    fulfilling lives by fostering an inclination towards innovation, a
                    compassionate attitude towards the world around them, and a passion
                    for becoming risk-takers and entrepreneurs while remaining deeply
                    rooted in human values.
                </p>

                <p>
                    I heartily welcome you to this new-generation university, where your
                    dreams and aspirations can be pursued and where the journey towards
                    excellence begins.
                </p>
            </div>
        </div>
    );
};

export default PresidentMsg;
