import { useEffect, useState } from "react";
import axios from "axios";

function AdminPanel() {
  const [data, setData] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = sessionStorage.getItem("adminToken");

        if (!token) {
          window.location.replace("/admin/secure-soft");
          return;
        }

        const res = await axios.get(
          "http://localhost:5000/api/admin/dashboard",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setData(res.data);
      } catch (err) {
        if (err.response?.status === 401) {
          sessionStorage.removeItem("adminToken");
          sessionStorage.removeItem("adminUser");
          sessionStorage.removeItem("email");

          window.location.replace("/admin/secure-soft");
          return;
        }

        console.error("Failed to fetch dashboard data:", err);
      }
    };

    fetchData();
  }, []);

  return <h1>{data}</h1>;
}

export default AdminPanel;