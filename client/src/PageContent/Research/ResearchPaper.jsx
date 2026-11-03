import React, { useState } from "react";

const ResearchPaper = () => {
    const [activeTab, setActiveTab] = useState("research");

const researchData = [
  {
    faculty: "Prashant Anil Pawase & Swapnil R. Patharkar",
    scopus: "Scopus",
    title: "A Review on Intelligent Packaging Systems Using Betalain-Rich Biobased Composite Films in Monitoring Freshness of Fish, Shrimp, and Meat",
    year: "July 2025",
    rank: "Q1",
  },
  {
    faculty: "Dr. Prashant Pawase",
    scopus: "Scopus",
    title: "A Review of In Vitro Digestibility Models on Diverse Foods in Various",
    year: "August 2025",
    rank: "Q1",
  },
  {
    faculty: "Deepti N. Chaudhari",
    scopus: "Scopus",
    title: "Biofilm and Antimicrobial Resistance: Mechanisms, Implications, and Emerging Solutions",
    year: "August 2025",
    rank: "Q3",
  },
  {
    faculty: "Dr. Kavita Mane",
    scopus: "Scopus",
    title: "Role of Psyllium Husk in Metabolic Disease Management: A Review",
    year: "September 2025",
    rank: "Q3",
  },
  {
    faculty: "Dr. G. J. Bhavsar",
    scopus: "Scopus",
    title: "Sustainable Food Protein Extraction from Biomass Using Deep Eutectic Solvents: A Review",
    year: "September 2025",
    rank: "Q1",
  },
  {
    faculty: "Dr. Nitin Suradkar",
    scopus: "Other",
    title: "Herbal Functional Confection: Nutritional Characterization of Shatavari-Based Chocolate",
    year: "October 2025",
    rank: "Other",
  },
  {
    faculty: "Dr. G. J. Bhavsar",
    scopus: "UGC Care",
    title: "Studies on Development of Sweet Potato Biscuits",
    year: "November 2025",
    rank: "UGC Care",
  },
  {
    faculty: "Mr. S. R. Patharkar",
    scopus: "Scopus",
    title: "Optimization of Asparaginase Treatment to Mitigate Acrylamide Formation",
    year: "November 2025",
    rank: "Q4",
  },
  {
    faculty: "Dr. Prashant Pawase",
    scopus: "Scopus",
    title: "Protein–Polysaccharide Hydrogels for Active and Intelligent Food Packaging",
    year: "November 2025",
    rank: "Q2",
  },
  {
    faculty: "Dr. Prashant Pawase",
    scopus: "Scopus",
    title: "Effectiveness of Various Plasma Treatments on Nutrient Retention",
    year: "December 2025",
    rank: "Q1",
  },
  {
    faculty: "Dr. Prashant Pawase",
    scopus: "Scopus",
    title: "Advances in Odor-Induced Sugar Reduction",
    year: "December 2025",
    rank: "Q1",
  },
  {
    faculty: "Dr. Prashant Pawase",
    scopus: "Scopus",
    title: "CRISPR-Based Biosensors for Detection of Foodborne Pathogens",
    year: "December 2025",
    rank: "Q1",
  },
  {
    faculty: "Dr. Prashant Pawase",
    scopus: "Scopus",
    title: "Spirogyra-Derived CuO-NPs for Environmental Remediation",
    year: "December 2025",
    rank: "Q1",
  },
  {
    faculty: "Dr. Prashant Pawase",
    scopus: "Scopus",
    title: "Protein Quality Comparison of Mycoprotein, Insect, and Algal Proteins",
    year: "December 2025",
    rank: "Q1",
  },
  {
    faculty: "Dr. Kavita Mane",
    scopus: "Scopus",
    title: "Impact of Tomato Puree Processing on Lycopene Stability",
    year: "December 2025",
    rank: "Q4",
  },
  {
    faculty: "Dr. Kavita Mane",
    scopus: "Scopus",
    title: "Development of a Healthier Dessert Alternative: Low-Fat Yoghurt",
    year: "January 2026",
    rank: "Q3",
  },
  {
    faculty: "Dr. Gauri Athawale",
    scopus: "Scopus",
    title: "In Vitro Analysis of Lactobacillus and Dragon Fruit Juice Quality",
    year: "February 2026",
    rank: "Q2",
  },
  {
    faculty: "Deepti N. Chaudhari",
    scopus: "Scopus",
    title: "Microencapsulation of Anthocyanins for Functional Foods",
    year: "February 2026",
    rank: "Q2",
  },
  {
    faculty: "Ms. A. B. Shingote",
    scopus: "Scopus",
    title: "Recent Advances in 3D Food Printing",
    year: "February 2026",
    rank: "Q1",
  },
  {
    faculty: "Dr. Sujata Ghodke",
    scopus: "Scopus",
    title: "Formulation of Noodles from Malted Millet Composite Flour",
    year: "February 2026",
    rank: "Q3",
  },
  {
    faculty: "Dr. Gauri Athawale",
    scopus: "Other",
    title: "Development of Pancake Premix Using Kodo Millet",
    year: "February 2026",
    rank: "Other",
  },
  {
    faculty: "Deepti N. Chaudhari",
    scopus: "Scopus",
    title: "Gut-Brain-Cardiac Axis and Microbiota",
    year: "March 2026",
    rank: "Q2",
  },
  {
    faculty: "Deepti N. Chaudhari",
    scopus: "Scopus",
    title: "Microbial Risks in Food Safety",
    year: "March 2026",
    rank: "Q2",
  },
  {
    faculty: "Dr. G. P. Gaikwad",
    scopus: "Scopus",
    title: "Freeze-Dried Apple Snacks: Quality and Probiotic Viability",
    year: "March 2026",
    rank: "Q3",
  },
  {
    faculty: "Dr. Nilesh B. Kardile / Dr. Subhangi Thakre",
    scopus: "Scopus",
    title: "Shelf Life Prediction of Retort-Processed Puran Poli",
    year: "March 2026",
    rank: "Q1",
  },
  {
    faculty: "Dr. B. N. Jadhav",
    scopus: "Scopus",
    title: "Solar Energy Applications in Food Processing",
    year: "March 2026",
    rank: "Q3",
  },
  {
    faculty: "Dr. P. D. Shere",
    scopus: "Scopus",
    title: "Bioactive Compounds from Underutilized Fruits",
    year: "March 2026",
    rank: "Q1",
  },
  {
    faculty: "Dr. Nilesh B. Kardile",
    scopus: "Scopus",
    title: "Functional Pasta Enriched with Jackfruit Flour",
    year: "April 2026",
    rank: "Q1",
  },
  {
    faculty: "Dr. Nitin Suradkar",
    scopus: "Scopus",
    title: "Plant-Based Milk as Delivery Systems",
    year: "April 2026",
    rank: "Q3",
  },
  {
    faculty: "Dr. Anjali Bhoite",
    scopus: "Scopus",
    title: "Jackfruit Seed Flour for Burmese Tofu Analog",
    year: "May 2026",
    rank: "Q3",
  },
  {
    faculty: "Dr. Sujata Ghodke",
    scopus: "Scopus",
    title: "Hypolipidemic and Antioxidant Potential of Curcumin",
    year: "May 2026",
    rank: "Q3",
  },
  {
    faculty: "Dr. Nilesh B. Kardile",
    scopus: "Scopus",
    title: "Orange Peel Candy Optimization Using RSM",
    year: "May 2026",
    rank: "Q3",
  },
  {
    faculty: "Dr. Sujata Ghodke",
    scopus: "Scopus",
    title: "Co-Fortification of Piperine and Curcumin in Paneer",
    year: "June 2026",
    rank: "Q3",
  },
];

const bookData = [
  {
    faculty: "Dr. Prashant Pawase",
    title: "A Review on Extraction, Functionality, and Application of Chia Seeds as a Storehouse of Bioactive Components",
    journal: "Measurement Food",
    publisher: "Elsevier",
  },
  {
    faculty: "Dr. Ganesh Bhavsar",
    title: "Exploring the Role of Gut Microbiota in Regulating Immune Responses to Respiratory Infections: A Cross-Disciplinary Study",
    journal: "African Journal of Biomedical Research",
    publisher: "AJOL",
  },
  {
    faculty: "Dr. Yogita Chavan",
    title: "Exploring the Influence of Active Packaging Systems on Microwaved Processed Jaggery: A Real-Time Study on Shelf Life",
    journal: "Journal of Food Science and Technology",
    publisher: "Springer",
  },
  {
    faculty: "Deepti N. Chaudhari",
    title: "Complete Genome Sequence and Probiotic Characterization of Lactobacillus delbrueckii subsp. indicus DC-3",
    journal: "Probiotics and Antimicrobial Proteins",
    publisher: "Springer Nature",
  },
  {
    faculty: "Deepti N. Chaudhari",
    title: "Complete Genome Sequence and In Vitro Probiotic Assessment of Bacillus subtilis DC-11",
    journal: "Current Microbiology",
    publisher: "Springer Nature",
  },
  {
    faculty: "Dr. Nitin Suradkar",
    title: "A Study on Omega-3 Fish Oil Safety and Efficacy for Cardiac Patients",
    journal: "Frontiers in Health Informatics",
    publisher: "",
  },
  {
    faculty: "Dr. Prashant Pawase",
    title: "A Critical Review on Biogenic Amines in Dairy: Formation Pathways, Toxicity, and Regulations",
    journal: "Journal of Food Composition and Analysis",
    publisher: "ScienceDirect",
  },
  {
    faculty: "Dr. Prashant Pawase",
    title: "Enhancing Bioactive Stability and Applications: Microencapsulation in Fruits and Vegetables Waste Valorization",
    journal: "Discover Food",
    publisher: "Discover",
  },
  {
    faculty: "Dr. Rinku Agarwal",
    title: "Sustainable Processing Technology (Pulse Light, Electrolysed Water, and Ozonation) for Microbial Decontamination of Muscle Foods",
    journal: "Innovative Food Science & Emerging Technology",
    publisher: "ScienceDirect",
  },
  {
    faculty: "Suvidha Kulkarni",
    title: "Exploring Big Data Innovation in Food and Agriculture Research",
    journal: "International Journal of Research in Agronomy",
    publisher: "NAAS Journal",
  },
  {
    faculty: "Dr. Nitin Suradkar",
    title: "Extraction of Pectin from Ethiopian Prickly Pear Fruit Peel and Its Potency for Cellulose-Reinforced Biofilm",
    journal: "Biomass Conversion and Biorefinery",
    publisher: "Springer Nature",
  },
  {
    faculty: "Gauri Athawale",
    title: "Studies on Standardization of Drying Process, Chemical Composition, and Shelf Life of Dehydrated Tambul",
    journal: "Indian Journal of Agricultural Biochemistry",
    publisher: "Indian Society of Agricultural Biochemists",
  },
  {
    faculty: "Dr. Sujata Ghodke",
    title: "A Comprehensive Review on Nutraceutical Potential, Clinical Studies, and Application of Beetroot",
    journal: "African Journal of Biomedical Research",
    publisher: "AJOL",
  },
  {
    faculty: "Dr. P. D. Shere",
    title: "Development and Evaluation of Gluten-Free Multi-Millet Pasta Based on Nutritional, Sensory, and Color Characteristics",
    journal: "Asian Journal of Dairy & Food Research",
    publisher: "ARCC Journal",
  },
  {
    faculty: "Dr. P. D. Shere",
    title: "Impact of Malting and Moist Steaming on Carbohydrate and Dietary Fiber Quotient of Millet",
    journal: "Asian Journal of Dairy & Food Research",
    publisher: "ARCC Journal",
  },
  {
    faculty: "Dr. Nilesh Kardile",
    title: "Advancement and Effectiveness of Aloe Vera and Sodium Alginate Coating for Extending Shelf Life",
    journal: "European Journal of Nutrition & Food Safety",
    publisher: "Sciencedomain International",
  },
  {
    faculty: "Dr. Kananika Paul",
    title: "Exploring Bioactive Compounds of Citrus Fruit Peels for Therapeutic and Industrial Applications",
    journal: "Food Science & Engineering",
    publisher: "Universal Wiser Publication",
  },
  {
    faculty: "Dr. Prashant Pawase",
    title: "Conceptual Review on Classification, Extraction, and Role of Phytochemicals in Human Health",
    journal: "Future Foods",
    publisher: "Elsevier",
  },
  {
    faculty: "Dr. Fayaj Pathan",
    title: "Nonalcoholic Fatty Liver Disease (NAFLD): A Chronic Liver Disease",
    journal: "Acta Scientific Nutritional Health",
    publisher: "UGC Care",
  },
  {
    faculty: "Abhilasha Shingote",
    title: "Novel Approaches in Food Preservation: High-Tech Solutions",
    journal: "New Era Agriculture Magazine",
    publisher: "Magazine",
  },
  {
    faculty: "Dr. Nilesh Kardile",
    title: "Utilization of Jackfruit: Nutritional Composition and Its Application in Food Model Systems",
    journal: "Bioscene",
    publisher: "United States of America",
  },
];


    return (
        <div>
            <h2 className="innerpage-title">Research Paper Publication</h2>

            {/* Buttons */}
            <div className="page-content-btns">
                <button
                    className={activeTab === "research" ? "btn active" : "btn"}
                    onClick={() => setActiveTab("research")}
                >
                    2025-2026
                </button>

                <button
                    className={activeTab === "book" ? "btn active" : "btn"}
                    onClick={() => setActiveTab("book")}
                >
                    2024-25
                </button>
            </div>

            {/* Research Table */}
            {activeTab === "research" && (
                <>
                    <h3 className="table-title">Research Paper Publication Year 2025-2026</h3>
                    <div className="table-responsive">
                        <table className="common-table">
                            <thead>
                                <tr>
                                    <th>Sr. No.</th>
                                    <th>Faculty Name</th>
                                    <th>Scopus Indexed</th>
                                    <th>Paper Title</th>
                                    <th>Year of Publication</th>
                                    <th>Q1/Q2/Q3/Q4</th>
                                </tr>
                            </thead>
                            <tbody>
                                {researchData.map((item, index) => (
                                    <tr key={index}>
                                        <td>{index + 1}</td>
                                        <td>{item.faculty}</td>
                                        <td>{item.scopus}</td>
                                        <td>{item.title}</td>
                                        <td>{item.year}</td>
                                        <td>{item.rank}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* Book Table */}
            {activeTab === "book" && (
                <>
                    <h3 className="table-title">Research Paper Publication Year 2024-2025</h3>
                    <div className="table-responsive">
                        <table className="common-table">
                            <thead>
                                <tr>
                                    <th>Sr. No.</th>
                                    <th>Faculty Name</th>
                                    <th>Title Of Research Paper</th>
                                    <th>Name of Journal / Book/ Conference</th>
                                    <th>Name of the Publisher / Organizer</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bookData.map((item, index) => (
                                    <tr key={index}>
                                        <td>{index + 1}</td>
                                        <td>{item.faculty}</td>
                                        <td>{item.title}</td>
                                        <td>{item.journal}</td>
                                        <td>{item.publisher}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* Patent */}
            {activeTab === "patent" && <p>No Patent Data Available</p>}
        </div>
    );
};

export default ResearchPaper;