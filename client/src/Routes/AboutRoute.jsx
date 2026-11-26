import React from "react";
import { Route } from "react-router-dom";
import AboutUs from "../Pages/AboutUs";
import AboutMIT from "../PageContent/About/AboutMIT";
import SOFT from "../PageContent/About/SOFT";
import PrincipalMSG from "../PageContent/About/PrincipalMSG";
import MembersList from "../PageContent/About/MembersList";
import FounderMsg from "../PageContent/About/FounderMsg";
import PresidentMsg from "../PageContent/About/PresidentMsg";


export const AboutRoute = (
  <Route path="aboutus" element={<AboutUs />}>
    <Route index element={<AboutMIT />} />
    <Route path="about-mit" element={<AboutMIT />} />
    <Route path="founder-message" element={<FounderMsg />} />
    <Route path="president-message" element={<PresidentMsg />} />
    <Route path="about-soft" element={<SOFT />} />
    <Route path="principal-message" element={<PrincipalMSG />} />
    <Route
      path="board-of-management"
      element={<MembersList type="board" title="Board of Management" />}
    />

    <Route
      path="governing-body"
      element={<MembersList type="governing" title="Governing Body" />}
    />
  </Route>
);
