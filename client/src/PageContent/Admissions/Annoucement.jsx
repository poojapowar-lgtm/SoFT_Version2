import React from "react";

const Announcement = () => {
    return (
        <div>
            <h2 className="innerpage-title">
                Admission Announcement
            </h2>

            <p>
                Admissions for the academic year 2027–28 at the School of Food
                Technology, MIT-ADT University, Pune, are now open. Eligible
                candidates are invited to apply for undergraduate, postgraduate,
                and doctoral programs in Food Technology and allied fields.
            </p>

            <div className="syllabus-section">
                <p>
                    The application portal is now open. Interested candidates
                    can apply online using the link below.
                </p>

                <a
                    href="https://www.digialm.com/EForms/configuredHtml/176/59974/Registration.html"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <button className="btn" type="button">
                        Apply Online
                    </button>
                </a>
            </div>
        </div>
    );
};

export default Announcement;
