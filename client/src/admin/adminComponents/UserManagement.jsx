
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  FaUsers,
  FaUserPlus,
  FaSyncAlt,
  FaUser,
  FaEdit,
} from "react-icons/fa";
import "./UserManagement.css";

const API_URL = "http://localhost:5000/api/admin/users";

const UserManagement = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  // Edit Admin
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [updating, setUpdating] = useState(false);

  // Delete Admin
  const [deletingId, setDeletingId] = useState(null);

  // Reset Password
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetting, setResetting] = useState(false);

  // Fetch Admin Accounts
  const fetchAdmins = useCallback(async () => {
    try {
      setFetching(true);

      const token = sessionStorage.getItem("adminToken");

      const response = await axios.get(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setAdmins(response.data.users || []);
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Unable to load admin accounts."
      );
      setMessageType("error");
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  // Form Input Change
  const handleChange = (e) => {
    setFormData((previous) => ({
      ...previous,
      [e.target.name]: e.target.value,
    }));
  };

  // Create Admin
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    const { fullName, email, password } = formData;

    if (!fullName.trim() || !email.trim() || !password) {
      setMessage("Please fill in all fields.");
      setMessageType("error");
      return;
    }

    if (password.length < 8) {
      setMessage("Password must contain at least 8 characters.");
      setMessageType("error");
      return;
    }

    try {
      setLoading(true);

      const token = sessionStorage.getItem("adminToken");

      const response = await axios.post(
        API_URL,
        {
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          password,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessage(
        response.data.message ||
          "Admin account created successfully."
      );
      setMessageType("success");

      setFormData({
        fullName: "",
        email: "",
        password: "",
      });

      await fetchAdmins();
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Unable to create admin account."
      );
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  // Select Admin for Editing
  const handleEdit = (admin) => {
    setEditingAdmin(admin);

    setFormData({
      fullName: admin.full_name || "",
      email: admin.email || "",
      password: "",
    });

    setSelectedAdmin(null);
    setResetPassword("");
    setMessage("");
  };

  // Update Admin
  const handleUpdate = async (e) => {
    e.preventDefault();
    setMessage("");

    const { fullName, email } = formData;

    if (!fullName.trim() || !email.trim()) {
      setMessage("Please fill in all required fields.");
      setMessageType("error");
      return;
    }

    try {
      setUpdating(true);

      const token = sessionStorage.getItem("adminToken");

      const response = await axios.put(
        `${API_URL}/${editingAdmin.id}`,
        {
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessage(
        response.data.message || "Admin updated successfully."
      );
      setMessageType("success");

      setEditingAdmin(null);

      setFormData({
        fullName: "",
        email: "",
        password: "",
      });

      await fetchAdmins();
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Unable to update admin account."
      );
      setMessageType("error");
    } finally {
      setUpdating(false);
    }
  };

  // Cancel Edit
  const handleCancelEdit = () => {
    setEditingAdmin(null);

    setFormData({
      fullName: "",
      email: "",
      password: "",
    });

    setMessage("");
  };

  // Delete Admin
  const handleDelete = async (admin) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${admin.full_name || admin.email}?`
    );

    if (!confirmDelete) return;

    try {
      setDeletingId(admin.id);
      setMessage("");

      const token = sessionStorage.getItem("adminToken");

      const response = await axios.delete(
        `${API_URL}/${admin.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessage(
        response.data.message || "Admin deleted successfully."
      );
      setMessageType("success");

      if (editingAdmin?.id === admin.id) {
        setEditingAdmin(null);

        setFormData({
          fullName: "",
          email: "",
          password: "",
        });
      }

      if (selectedAdmin?.id === admin.id) {
        setSelectedAdmin(null);
        setResetPassword("");
      }

      await fetchAdmins();
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Unable to delete admin account."
      );
      setMessageType("error");
    } finally {
      setDeletingId(null);
    }
  };

  // Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!selectedAdmin) return;

    if (resetPassword.length < 8) {
      setMessage("Password must contain at least 8 characters.");
      setMessageType("error");
      return;
    }

    try {
      setResetting(true);

      const token = sessionStorage.getItem("adminToken");

      const response = await axios.post(
        `${API_URL}/${selectedAdmin.id}/reset-password`,
        { password: resetPassword },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessage(
        response.data.message || "Password reset successfully."
      );
      setMessageType("success");

      setSelectedAdmin(null);
      setResetPassword("");
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Unable to reset password."
      );
      setMessageType("error");
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="admin-page">

      {/* PAGE HEADER */}
      <div className="user-management-header">
        <div>
          <h1 className="card-heading">
            <FaUser /> User Management
          </h1>
          <p>Create and manage admin accounts.</p>
        </div>

        <div className="user-management-total">
          <FaUsers />
          <span>{admins.length} Accounts</span>
        </div>
      </div>

      {/* MESSAGE */}
      {message && (
        <div
          className={`user-management-message ${messageType}`}
          role="status"
        >
          {message}

          <button
            type="button"
            className="message-close"
            onClick={() => setMessage("")}
            aria-label="Dismiss message"
          >
            ×
          </button>
        </div>
      )}

      <div className="user-management-layout">

        {/* CREATE / EDIT ADMIN FORM */}
        <section className="user-management-card create-admin-card">

          <div className="user-card-heading">
            <div className="user-heading-icon">
              {editingAdmin ? <FaEdit /> : <FaUserPlus />}
            </div>

            <div>
              <h3>
                {editingAdmin ? "Edit Admin" : "Create Admin"}
              </h3>

              <p>
                {editingAdmin
                  ? "Update administrator account details."
                  : "Add a new website administrator."}
              </p>
            </div>
          </div>

          <form onSubmit={editingAdmin ? handleUpdate : handleSubmit}>

            {/* FULL NAME */}
            <label htmlFor="fullName">
              Full Name *

              <input
                id="fullName"
                type="text"
                name="fullName"
                placeholder="Enter full name"
                value={formData.fullName}
                onChange={handleChange}
                autoComplete="name"
                maxLength={100}
                required
              />
            </label>

            {/* EMAIL */}
            <label htmlFor="email">
              Email Address *

              <input
                id="email"
                type="email"
                name="email"
                placeholder="Enter email address"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
                maxLength={100}
                required
              />
            </label>

            {/* PASSWORD - ONLY FOR CREATE */}
            {!editingAdmin && (
              <label htmlFor="password">
                Password *

                <input
                  id="password"
                  type="password"
                  name="password"
                  placeholder="Minimum 8 characters"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </label>
            )}

            {!editingAdmin && (
              <p className="user-management-note">
                New accounts receive the Admin role. Passwords are
                stored as secure hashes by the backend.
              </p>
            )}

            {/* FORM BUTTONS */}
            <div className="admin-form-actions">

              <button
                type="submit"
                className="form-btn"
                disabled={loading || updating}
              >
                {editingAdmin ? (
                  <>
                    <FaEdit />
                    {updating ? "Updating..." : "Update Admin"}
                  </>
                ) : (
                  <>
                    <FaUserPlus />
                    {loading ? "Creating..." : "Create Admin"}
                  </>
                )}
              </button>

              {editingAdmin && (
                <button
                  type="button"
                  className="cancel-reset-button"
                  onClick={handleCancelEdit}
                  disabled={updating}
                >
                  Cancel
                </button>
              )}

            </div>
          </form>
        </section>

        {/* ADMIN ACCOUNTS TABLE */}
        <section className="user-management-card admin-list-card">

          <div className="user-card-heading admin-list-heading">

            <div>
              <h3>Created Accounts</h3>
              <p>Admin and superadmin accounts.</p>
            </div>

            <button
              type="button"
              className="refresh-admins-button"
              onClick={fetchAdmins}
              disabled={fetching}
              title="Refresh accounts"
              aria-label="Refresh accounts"
            >
              <FaSyncAlt
                className={fetching ? "spinning" : ""}
              />
            </button>

          </div>

          <div className="admin-table-wrapper">

            <table className="admin-table">

              <thead>
                <tr>
                  <th>User ID</th>
                  {/* <th>Sr. No.</th> */}
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>

                {fetching && admins.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="admin-table-empty">
                      Loading accounts...
                    </td>
                  </tr>
                ) : admins.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="admin-table-empty">
                      No accounts found.
                    </td>
                  </tr>
                ) : (
                  admins.map((admin, index) => (
                    <tr key={admin.id}>

                      <td>{admin.id}</td>

                      {/* <td>{index + 1}</td> */}

                      <td className="admin-user-name">
                        {admin.full_name || "—"}
                      </td>

                      <td className="admin-user-email">
                        {admin.email}
                      </td>

                      <td>
                        <span className={`role-badge ${admin.role}`}>
                          {admin.role}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`status-badge ${
                            Number(admin.is_active) === 1
                              ? "active"
                              : "inactive"
                          }`}
                        >
                          {Number(admin.is_active) === 1
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </td>

                      {/* ACTION COLUMN */}
                      <td>
                        <div className="admin-table-actions">

                          {/* EDIT */}
                          <button
                            type="button"
                            className="edit-admin-button"
                            onClick={() => handleEdit(admin)}
                            disabled={deletingId === admin.id}
                            title="Edit Admin"
                          >
                            Edit
                          </button>

                          {/* RESET PASSWORD */}
                          <button
                            type="button"
                            className="reset-password-button"
                            onClick={() => {
                              setSelectedAdmin(admin);
                              setResetPassword("");
                              setEditingAdmin(null);

                              setFormData({
                                fullName: "",
                                email: "",
                                password: "",
                              });

                              setMessage("");
                            }}
                          >
                            Reset Password
                          </button>

                          {/* DELETE */}
                          <button
                            type="button"
                            className="delete-admin-button"
                            onClick={() => handleDelete(admin)}
                            disabled={deletingId === admin.id}
                            title="Delete Admin"
                          >
                            {deletingId === admin.id
                              ? "Deleting..."
                              : "Delete"}
                          </button>

                        </div>
                      </td>

                    </tr>
                  ))
                )}

              </tbody>
            </table>
          </div>

          <div className="admin-table-footer">
            Total accounts: <strong>{admins.length}</strong>
          </div>

        </section>

        {/* RESET PASSWORD SECTION */}
        {selectedAdmin && (
          <section className="user-management-card reset-password-card">

            <div className="user-card-heading">

              <div className="user-heading-icon">
                <FaUser />
              </div>

              <div>
                <h3>Reset Password</h3>

                <p>
                  User ID: {selectedAdmin.id} — {selectedAdmin.email}
                </p>
              </div>

            </div>

            <form onSubmit={handleResetPassword}>

              <div className="form-group">
                <label htmlFor="resetPassword">
                  New Password
                </label>

                <input
                  id="resetPassword"
                  type="password"
                  value={resetPassword}
                  onChange={(e) =>
                    setResetPassword(e.target.value)
                  }
                  placeholder="Enter new password"
                  minLength={8}
                  autoComplete="new-password"
                  required
                />
              </div>

              <div className="reset-password-actions">

                <button
                  type="submit"
                  className="form-btn"
                  disabled={resetting}
                >
                  {resetting
                    ? "Resetting..."
                    : "Update Password"}
                </button>

                <button
                  type="button"
                  className="cancel-reset-button"
                  onClick={() => {
                    setSelectedAdmin(null);
                    setResetPassword("");
                  }}
                  disabled={resetting}
                >
                  Cancel
                </button>

              </div>
            </form>

          </section>
        )}

      </div>
    </div>
  );
};

export default UserManagement;
