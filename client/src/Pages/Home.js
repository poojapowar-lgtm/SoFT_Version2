import React, { lazy, Suspense } from "react";

import Banner from "../Components/banner/Banner";
import NationalRank from "../PageContent/HomeComponent/NationalRank";
import SEOMeta from "../Components/SEO/SEOMeta";

// Lazy-loaded homepage sections
const LifeAtCampus = lazy(
  () => import("../PageContent/HomeComponent/LifeAtCampus")
);

const Global = lazy(
  () => import("../PageContent/HomeComponent/Global")
);

const News = lazy(
  () => import("../PageContent/HomeComponent/News/News")
);

const Programs = lazy(
  () => import("../PageContent/HomeComponent/Programs")
);

const Recruiters = lazy(
  () => import("../PageContent/HomeComponent/Recruiters")
);

const PlacedStd = lazy(
  () => import("../PageContent/HomeComponent/PlacedStd")
);

const Facilities = lazy(
  () => import("../PageContent/HomeComponent/Facilities")
);

const Department = lazy(
  () => import("../PageContent/HomeComponent/Department")
);

// const Testimonials = lazy(
//   () => import("../PageContent/HomeComponent/Testimonials")
// );

const Home = () => {
  return (
    <div className="home">

      <SEOMeta
        title="MIT School of Food Technology (MIT-SoFT) | MIT-ADT University, Pune"
        description="MIT School of Food Technology (MIT-SoFT), Pune – Offering B.Tech and M.Tech programs in Food Technology. Explore admissions, placements, research, and campus life at MIT-ADT University."
        path="/"
      />

      {/* Above-the-fold content */}
      <Banner />
      <NationalRank />

      {/* Below-the-fold content */}
      <Suspense fallback={null}>
        <LifeAtCampus />
        <Global />
        <Programs />
        <News />
        <PlacedStd />
        {/* <Recruiters /> */}
        <Department />
        <Facilities />
        {/* <Testimonials /> */}
      </Suspense>

    </div>
  );
};

export default Home;