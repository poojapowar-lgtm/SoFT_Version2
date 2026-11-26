
import React from "react";
import "./admission.css";

const Fees = () => {
    // Correct academic-year sequence
    const headers = [
        "Type",
        "A.Y. 2026-27",
        "A.Y. 2027-28",
        "A.Y. 2028-29",
        "A.Y. 2029-30",
        "Total",
    ];

    // All fees are stored as numbers.
    // Total is calculated automatically from the available years.
    const tableData = [
        {
            title: "UG Program – B.Tech. (Food Technology)",
            rows: [
                {
                    type: "Indian Resident",
                    fees: [185000, 195000, 205000, 218500],
                },
                {
                    type: "EWS",
                    fees: [107000, 112000, 118000, 122500],
                },
                {
                    type: "NRI/PIO/OCI/CIWGC/CIWSEA/FN (in INR)",
                    fees: [277500, 292500, 307500, 327750],
                },
            ],
        },
        {
            title: "PG Program – M.Tech. (Food Technology)",
            rows: [
                {
                    type: "Indian Resident",
                    fees: [165000, 168500, null, null],
                },
                {
                    type: "EWS",
                    fees: [95000, 98500, null, null],
                },
                {
                    type: "NRI/PIO/OCI/CIWGC/CIWSEA/FN (in INR)",
                    fees: [247500, 252750, null, null],
                },
            ],
        },
        {
            title: "PG Program – M.Tech. (Food Safety and Quality Management)",
            rows: [
                {
                    type: "Indian Resident",
                    fees: [165000, 168500, null, null],
                },
                {
                    type: "EWS",
                    fees: [95000, 98500, null, null],
                },
                {
                    type: "NRI/PIO/OCI/CIWGC/CIWSEA/FN (in INR)",
                    fees: [247500, 252750, null, null],
                },
            ],
        },
        {
            title: "PG Program – M.Tech. (Food Technology) for Working Professionals",
            rows: [
                {
                    type: "Indian Resident",
                    fees: [165000, 168500, null, null],
                },
                {
                    type: "EWS",
                    fees: [95000, 98500, null, null],
                },
                {
                    type: "NRI/PIO/OCI/CIWGC/CIWSEA/FN (in INR)",
                    fees: [247500, 252750, null, null],
                },
            ],
        },
    ];

    // Format numbers using Indian numbering system
    const formatINR = (amount) => {
        if (amount === null || amount === undefined) {
            return "-";
        }

        return amount.toLocaleString("en-IN");
    };

    // Calculate total from available fee years
    const calculateTotal = (fees) => {
        return fees.reduce((total, fee) => {
            return total + (fee !== null ? fee : 0);
        }, 0);
    };

    return (
        <div className="fees-container">
            <h2 className="innerpage-title">Fee Structure</h2>

            {tableData.map((table, index) => (
                <div key={index} className="table-section">
                    <h3 className="innerpage-subtitle">
                        {table.title}
                    </h3>

                    <div className="table-responsive">
                        <table className="common-table">
                            <thead>
                                <tr>
                                    {headers.map((header, i) => (
                                        <th key={i}>{header}</th>
                                    ))}
                                </tr>
                            </thead>

                            <tbody>
                                {table.rows.map((row, i) => (
                                    <tr key={i}>
                                        <td>{row.type}</td>

                                        {row.fees.map((fee, j) => (
                                            <td key={j}>
                                                {formatINR(fee)}
                                            </td>
                                        ))}

                                        <td>
                                            {formatINR(
                                                calculateTotal(row.fees)
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default Fees;
