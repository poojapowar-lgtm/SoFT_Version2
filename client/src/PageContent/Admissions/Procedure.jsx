import React from "react";
import { ImArrowDown } from "react-icons/im";

const Procedure = () => {

const admissionSteps = [
    {
        title: "Step 1: Registration",
        points: [
            "Register on the official admission portal and verify your email address and mobile number.",
        ],
    },
    {
        title: "Step 2: Fill Out the Application Form",
        points: [
            "Complete all sections of the application form, including Personal Details, Parent/Guardian Details, Correspondence Details, Academic Details, and Document Upload.",
        ],
    },
    {
        title: "Step 3: Application Submission and Fee Payment",
        points: [
            "Pay the application fee of ₹1,800.",
            "Upload your photograph and signature, ensuring that each file is no larger than 2 MB.",
        ],
    },
    {
        title: "Step 4: Application Scrutiny",
        points: [
            "The School Admission Committee reviews the submitted application.",
        ],
    },
    {
        title: "Step 5: Evaluation",
        points: [
            "Candidates are evaluated based on entrance examination scores, a Personal Interview (PI) or Group Discussion (GD), if applicable, and the prescribed eligibility criteria.",
        ],
    },
    {
        title: "Step 6: Offer Letter",
        points: [
            "A provisional admission offer is issued to selected candidates.",
        ],
    },
    {
        title: "Step 7: Document Verification",
        points: [
            "Present the original documents for physical verification.",
        ],
    },
    {
        title: "Step 8: Fee Payment and Admission Confirmation",
        points: [
            "Admission is confirmed after the required fee payment is completed.",
        ],
    },
];


  return (
    <div className="internship-section">
      <h2 className="innerpage-title">Admission Procedure</h2>

      <div className="timeline">
        {admissionSteps.map((step, index) => (
          <div key={index} className="timeline-item">

            <div className="internship-card">
              <h3 className="internship-title">{step.title}</h3>
              <ul>
                {step.points.map((point, i) => (
                  <li key={i}>{point}</li>
                ))}
              </ul>
            </div>


              <div className="arrow">
                <ImArrowDown />
              </div>
 
          </div>
        ))}
      </div>


    </div>
  );
};

export default Procedure;
