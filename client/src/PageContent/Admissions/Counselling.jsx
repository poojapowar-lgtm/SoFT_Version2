import React from "react";

const Counselling = () => {
    return (
        <div>
            <h2 className="innerpage-title">
                Counselling and Seat Allotment
            </h2>

            <p>Seat allotment is based on the following criteria:</p>

            <ul className="page-list">
                <li>Merit ranking</li>
                <li>Availability of seats</li>
                <li>Candidate preferences</li>
            </ul>

            <p>
                The applicable reservation policy will be followed in
                accordance with university norms.
            </p>
        </div>
    );
};

export default Counselling;
