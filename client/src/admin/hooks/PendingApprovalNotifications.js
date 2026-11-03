import { useCallback, useEffect, useState } from "react";
import axios from "axios";

const API_URL = "http://localhost:5000/api/admin/approvals";

export default function PendingApprovalNotifications() {
  const [pendingCount, setPendingCount] = useState(0);
  const [newRequest, setNewRequest] = useState(null);

  const fetchPendingRequests = useCallback(async () => {
    const token = sessionStorage.getItem("adminToken");

    if (!token) {
      setPendingCount(0);
      return;
    }

    try {
      const response = await axios.get(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: { status: "pending" },
      });

      const data = response.data;
      const requests = Array.isArray(data)
        ? data
        : Array.isArray(data?.requests)
        ? data.requests
        : Array.isArray(data?.data)
        ? data.data
        : [];

      setPendingCount(requests.length);
    } catch (error) {
      console.error(
        "Failed to fetch pending requests:",
        error.response?.data || error.message
      );
    }
  }, []);

  useEffect(() => {
    fetchPendingRequests();

    const interval = window.setInterval(
      fetchPendingRequests,
      10000
    );

    return () => window.clearInterval(interval);
  }, [fetchPendingRequests]);

  return {
    pendingCount,
    newRequest,
    refreshPendingRequests: fetchPendingRequests,
  };
}