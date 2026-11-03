import React from "react";
import "./sports.css";

const Sports = () => {
  return (
    <div className="sports-page">
      <h2 className="innerpage-title">Sports Facilities</h2>

      <div className="sports-container">
        <div className="sports-image-wrapper">
          <img
            src="/assets/images/sports_banner.png"
            alt="Sports facilities at MIT-ADT University"
            className="sports-main-image"
            width="1200"
            height="500"
            loading="lazy"
            decoding="async"
          />
        </div>

        <div className="sports-content">
          <p>
            MIT Art, Design and Technology University provides a vibrant campus
            environment where sports and fitness play an important role in
            students' overall development. The university offers a range of
            sports facilities for recreational and competitive activities,
            encouraging students to maintain an active and healthy lifestyle.
          </p>

          <p>
            The campus features indoor sports facilities, including courts for
            badminton and table tennis, where students can develop and refine
            their skills. Dedicated spaces are also available for boxing and
            fitness training, along with a gymnasium that supports strength
            and conditioning activities. Basketball and volleyball facilities
            provide additional opportunities for students to practise and
            participate in sports.
          </p>

          <p>
            The university also offers facilities for outdoor sports, including
            cricket, football, kho-kho, and kabaddi, with designated playing
            areas. Basketball and lawn tennis facilities further support
            students' sporting interests. A swimming pool provides
            opportunities for swimming practice, training, and recreation.
          </p>

          <p>
            The university organizes inter-college tournaments, coaching camps,
            and sports events to encourage students to develop their abilities
            and promote teamwork. With an emphasis on discipline, leadership,
            and physical well-being, MIT-ADT University supports a balanced
            educational experience beyond academics.
          </p>

          <p>
            These sports facilities reflect the university's commitment to
            holistic student development and provide opportunities for students
            to pursue their academic and athletic interests.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Sports;
