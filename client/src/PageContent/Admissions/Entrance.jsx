import React from "react";

const Entrance = () => {
    return (
        <div>
            <h2 className="innerpage-title">
                Admission Entrance Examinations
            </h2>

            <p>
                Admissions may be based on valid scores in the following
                entrance examinations, as applicable to the program:
            </p>

            <ul className="page-list">
                <li>MHT-CET (PCM/PCB)</li>
                <li>JEE</li>
                <li>NEET</li>
                <li>CUET</li>
                <li>PERA CET</li>
                <li>GATE</li>
            </ul>
        </div>
    );
};

export default Entrance;
