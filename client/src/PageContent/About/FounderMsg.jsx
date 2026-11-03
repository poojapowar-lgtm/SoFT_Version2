import React from "react";
import "./leadership.css";

const FounderMsg = () => {
  return (
    <div className="leadership-container">
      <h2 className="innerpage-title">Founder's Message</h2>

      {/* Section 1 */}
      <div className="leader-card">
        <div className="leader-section">
          <div className="leader-image">
            <img
              src="/assets/images/home/VD_sir.webp"
              alt="Prof. Dr. Vishwanath D. Karad - Founder, MIT Group of Institutions"
              width="240"
              height="240"
              loading="lazy"
              decoding="async"
            />
          </div>

          <div className="leader-content">
            {/* <p>Our true source of inspiration</p> */}
            <h3 className="innerpage-subtitle">
              Hon. Prof. Dr. Vishwanath D. Karad
            </h3>
            <h4 className="leader-designation">
              Founder, MAEER's MIT Group of Institutions, Pune; President, MIT
              Art, Design and Technology University
            </h4>
            <p>
              Our truest source of inspiration, Hon'ble Dr. Vishwanath D.
              Karad, the founding father of the MIT Group of Institutions, is a
              renowned educationist. Hon'ble Dr. Vishwanath D. Karad is admired
              for his exemplary work in the fields of higher education, human
              rights, spiritual sciences, and spiritual guidance. He has led the
              MIT Group of Institutions to reach out to over 50,000 students
              across 75 institutions and 4 universities. A true visionary,
              Hon'ble Dr. Vishwanath D. Karad has initiated some of the most
              groundbreaking activities under the banner of the MIT Group of
              Institutions. Some of his initiatives include the International
              Robocon, the Saint Shri Dnyaneshwar World Peace Prize, and the
              enhancement of pilgrimage centres at Alandi, Dehu, Pandharpur,
              etc. His relentless efforts and valuable contributions to human
              rights and democracy resulted in the Maharashtra Institute of
              Technology receiving a UNESCO Chair from UNESCO Paris in 1998.
            </p>
          </div>
        </div>

        <p>
          A staunch follower of Swami Vivekananda, Hon'ble Dr. Vishwanath D.
          Karad represented India at the Parliament of the World's Religions,
          held at the prestigious Salt Palace Convention in Salt Lake City,
          Utah, USA, in 2015. The convention was attended by over 10,000 people
          representing more than 50 different faiths from over 80 nations.
          Hon'ble Dr. Vishwanath D. Karad has also spearheaded the unique
          mission of establishing the world's largest dome, known as the
          "Philosopher Saint Shri Dnyaneshwar World Peace Center & Library,"
          spanning 160 feet in diameter and reaching 269 feet in height on the
          University campus. His vision of "building a nation of competent
          individuals" lies at the heart of MIT-ADT University. We aim to
          provide value-based education for academic excellence through various
          technical and cultural initiatives that foster leadership qualities
          among our students.
        </p>
      </div>
    </div>
  );
};

export default FounderMsg;
