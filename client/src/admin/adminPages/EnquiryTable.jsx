import React, { useEffect, useState } from "react";
import { PiExportBold } from "react-icons/pi";
import axios from "axios";

const EnquiryTable = () => {
  const [enquiries, setEnquiries] = useState([]);
  const [error, setError] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");

  // Date filter states
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    fetchEnquiries();
  }, []);


  const getAuthConfig = () => {
    const token = sessionStorage.getItem("adminToken");

    if (!token) {
      throw new Error("Session expired. Please log in again.");
    }

    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  };


  const fetchEnquiries = async () => {
    try {
      setError("");

      const res = await axios.get(
        "http://localhost:5000/api/enquiry",
        getAuthConfig()
      );

      setEnquiries(res.data);
    } catch (err) {
      console.error(
        "Fetch enquiries error:",
        err.response?.status,
        err.response?.data || err.message
      );

      setError(
        err.response?.data?.message ||
        (typeof err.response?.data === "string"
          ? err.response.data
          : err.message) ||
        "Failed to load enquiries"
      );
    }
  };



  const deleteEnquiry = async (id) => {
    if (!window.confirm("Are you sure you want to delete this enquiry?")) {
      return;
    }

    try {
      await axios.delete(
        `http://localhost:5000/api/enquiry/${id}`,
        getAuthConfig()
      );

      await fetchEnquiries();
    } catch (err) {
      console.error(
        "Delete enquiry error:",
        err.response?.status,
        err.response?.data || err.message
      );

      setError(
        err.response?.data?.message ||
        (typeof err.response?.data === "string"
          ? err.response.data
          : err.message) ||
        "Failed to delete enquiry"
      );
    }
  };

  // Filter enquiries based on date and course name
  const getFilteredEnquiries = () => {
    return enquiries.filter((item) => {
      if (!item.created_at) return false;

      const itemDate = new Date(item.created_at);

      // From date
      if (fromDate) {
        const startDate = new Date(`${fromDate}T00:00:00`);

        if (itemDate < startDate) {
          return false;
        }
      }

      // To date
      if (toDate) {
        const endDate = new Date(`${toDate}T23:59:59.999`);

        if (itemDate > endDate) {
          return false;
        }
      }

      // Course name
      if (
        selectedCourse &&
        item.course?.trim() !== selectedCourse
      ) {
        return false;
      }

      return true;
    });
  };
  // Export CSV
  const exportToCSV = () => {
    const filteredEnquiries = getFilteredEnquiries();

    if (filteredEnquiries.length === 0) {
      alert("No enquiries found for the selected date range.");
      return;
    }

    const headers = ["Name", "Mobile", "Email", "Course", "Date"];

    const rows = filteredEnquiries.map((item) => [
      item.name,
      item.mobile,
      item.email,
      item.course,
      item.created_at
        ? new Date(item.created_at).toLocaleDateString()
        : "N/A",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers, ...rows]
        .map((row) =>
          row
            .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
            .join(",")
        )
        .join("\n");

    const encodedUri = encodeURI(csvContent);

    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);

    // Dynamic filename
    let fileName = "enquiries";

    if (fromDate && toDate) {
      fileName += `_${fromDate}_to_${toDate}`;
    } else if (fromDate) {
      fileName += `_from_${fromDate}`;
    } else if (toDate) {
      fileName += `_upto_${toDate}`;
    }

    link.setAttribute("download", `${fileName}.csv`);

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Clear date filters
  const clearDateFilter = () => {
    setFromDate("");
    setToDate("");
    setSelectedCourse("");
  };

  // Data displayed in table
  const filteredEnquiries = getFilteredEnquiries();

  // Delete all enquiries
  const handleDeleteAll = async () => {
    if (enquiries.length === 0) {
      setError("No enquiries available to delete.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to permanently delete ALL enquiries? This action cannot be undone."
    );

    if (!confirmed) return;

    try {
      setError("");

      await axios.delete(
        "http://localhost:5000/api/enquiry/delete-all",
        getAuthConfig()
      );

      setEnquiries([]);
      setFromDate("");
      setToDate("");

      alert("All enquiries deleted successfully.");
    } catch (err) {
      console.error(
        "Delete all enquiries error:",
        err.response?.status,
        err.response?.data || err.message
      );

      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to delete all enquiries."
      );
    }
  };

  return (
    <div className="admin-page">
      <h2 className="card-title">
        Enquiries List
      </h2>
      <div className="admin-card">
        <div className="dashboard-header">

          {error && (
            <p style={{ color: "red" }}>
              Error: {JSON.stringify(error)}
            </p>
          )}



          <div className="export-delete">
            <div className="date-filter-container">
              <div className="date-filter">
                <label>From Date</label>
                <input
                  type="date"
                  value={fromDate}
                  max={toDate || undefined}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>

              <div className="date-filter">
                <label>To Date</label>
                <input
                  type="date"
                  value={toDate}
                  min={fromDate || undefined}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>


              <div className="date-filter">
                <label>Course Name</label>
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  style={{ padding: "9px 0" }}
                >
                  <option value="">All Courses</option>

                  {[...new Set(
                    enquiries
                      .map((item) => item.course?.trim())
                      .filter(Boolean)
                  )]
                    .sort()
                    .map((course) => (
                      <option key={course} value={course}>
                        {course}
                      </option>
                    ))}
                </select>
              </div>

              <button
                type="button"
                className="clear-filter-btn"
                onClick={clearDateFilter}
              >
                Clear
              </button>

            </div>


            <div className="export-delete-buttons">
              <button
                type="button"
                className="export-btn"
                onClick={exportToCSV}
                disabled={filteredEnquiries.length === 0}
              >
                Export Data
                <PiExportBold style={{ fontSize: "20px" }} />
              </button>

              <button
                type="button"
                className="delete-all-btn"
                onClick={handleDeleteAll}
                disabled={enquiries.length === 0}
              >
                Delete All
              </button>
            </div>
          </div>
        </div>

        <table className="admin-table" style={{ width: "95%", margin: "0 auto" }}>
          <thead>
            <tr>
              <th>Sr. No.</th>
              <th>Name</th>
              <th>Mobile</th>
              <th>Email</th>
              <th>Course</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredEnquiries.map((item, index) => (
              <tr key={item.id}>
                <td>{index + 1}</td>

                <td>{item.name}</td>
                <td>{item.mobile}</td>
                <td>{item.email}</td>
                <td>{item.course}</td>

                <td>
                  {item.created_at
                    ? new Date(item.created_at).toLocaleDateString()
                    : "N/A"}
                </td>

                <td>
                  <button onClick={() => deleteEnquiry(item.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {filteredEnquiries.length === 0 && (
              <tr>
                <td colSpan="7" style={{ textAlign: "center" }}>
                  No enquiries found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>


    </div>
  );
};

export default EnquiryTable;