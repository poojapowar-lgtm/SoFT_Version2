import Box from "@mui/material/Box";
import { BarChart } from "@mui/x-charts/BarChart";
import "./placement_statistics.css";

export default function PlacementStatistics() {
  const data = [
    {
      branch: "B.Tech.",
      opted: 44,
      placed: 38,
      percentage: 86.36,
      highest: 7.25,
      lowest: 1.6,
    },
    {
      branch: "M.Tech.",
      opted: 18,
      placed: 15,
      percentage: 83.33,
      highest: 5.0,
      lowest: 2.4,
    },
  ];

  // Calculate placement statistics
  const totalOpted = data.reduce((sum, item) => sum + item.opted, 0);
  const totalPlaced = data.reduce((sum, item) => sum + item.placed, 0);

  const overallPercent =
    totalOpted > 0
      ? ((totalPlaced / totalOpted) * 100).toFixed(2)
      : "0.00";

  const highestPackage = Math.max(...data.map((item) => item.highest));

  // Prepare chart data
  const xLabels = data.map((item) => item.branch);
  const optedData = data.map((item) => item.opted);
  const placedData = data.map((item) => item.placed);

  return (
    <>
      <h2 className="innerpage-title">Placement Statistics</h2>

      <div className="placement-wrapper">
        {/* STATISTICS CARDS */}
        <div className="placement-cards">
          <div className="scope-card">
            <h4 className="placement-heading">Students Opted <br/> for Placement</h4>
            <h2 className="placement-count">{totalOpted}</h2>
          </div>

          <div className="scope-card">
            <h4 className="placement-heading">Students<br/>Placed</h4>
            <h2 className="placement-count">{totalPlaced}</h2>
          </div>

          <div className="scope-card">
            <h4 className="placement-heading">Overall <br/>Placement Rate</h4>
            <h2 className="placement-count">{overallPercent}%</h2>
          </div>

          <div className="scope-card">
            <h4 className="placement-heading">Highest <br/> Package</h4>
            <h2 className="placement-count">{highestPackage} LPA</h2>
          </div>
        </div>

        {/* PLACEMENT CHART */}
        <div className="placement-chart">
          <Box className="chart-box">
            <BarChart
              series={[
                {
                  data: optedData,
                  label: "Students Opted",
                  color: "#2563eb",
                },
                {
                  data: placedData,
                  label: "Students Placed",
                  color: "#16a34a",
                },
              ]}
              xAxis={[
                {
                  data: xLabels,
                  scaleType: "band",
                },
              ]}
              yAxis={[
                {
                  label: "Number of Students",
                },
              ]}
            />
          </Box>
        </div>
      </div>
    </>
  );
}
