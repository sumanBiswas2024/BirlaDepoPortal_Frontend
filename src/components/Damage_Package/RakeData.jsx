import moment from "moment";
import React, { Fragment, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { connect } from "react-redux";
import { useHistory, useLocation } from "react-router-dom";
import Swal from "sweetalert2";
import { loading } from "../../actions/loadingAction";
import ExcelReport from "../../Functions/ExcelReport";
import ViewDepotsByComma from "../../Functions/ViewDepotsByComma";
import http from "../../services/apicall";
import StatusRakeData from "./StatusRakeData";
import { approvedStatus } from "../../services/utils";

export const RakeData = (props) => {
  const history = useHistory();
  const location = useLocation();

  const [allDepot, setAllDepot] = useState([]);
  const [allData, setAllData] = useState([]);
  const [selectedRake, setSelectedRake] = useState("");

  const { handleSubmit, register, watch, errors, getValues } = useForm({
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const watchAllFields = watch();

  const fetchRakeDetails = (data) => {
    props.loading(true);
    http
      .post("get-all-rake-data", {
        USER_ID: localStorage.getItem("user_code"),
        IM_DATE_FROM: moment(data?.IM_DATE_FROM, "YYYY-MM-DD").format(
          "YYYYMMDD"
        ),
        IM_DATE_TO: moment(data?.IM_DATE_TO, "YYYY-MM-DD").format("YYYYMMDD"),
      })
      .then((res) => {
        if (res.data.code === 0) {
          setAllData(res.data.data);
        }
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => {
        props.loading(false);
      });
  };

  let columns = [
    {
      title: "",
      key: "RR_NO",
    },
    {
      title: "View Details",
      key: "RR_NO",
    },
    {
      title: "Status",
      key: "STATUS",
    },
    {
      title: "Remarks by Officer",
      key: "CS_COMMENT",
    },
    {
      title: "Rake Number",
      key: "RAKE_NO",
    },
    {
      title: "RR number",
      key: "RR_NO",
    },
    {
      title: "RR Date",
      key: "RR_DATE",
    },
    {
      title: "RR Qty",
      key: "RR_QTY",
    },
    {
      title: "CFA Code",
      key: "USER_ID",
    },
    {
      title: "CFA Name",
      key: "USER_NAME",
    },
    { key: "DEPOTS", title: "Depots" },
  ];

  const getDepot = async () => {
    try {
      props.loading(true);
      // const res = await http.post(apis.COMMON_POST_WITH_FM_NAME, {
      //   fm_name: "ZRFC_GET_DEPO",
      //   params: {
      //     IM_CFA_CODE: localStorage.getItem("user_code"),
      //     IM_FLAG: salesHead.includes(localStorage.getItem("user_code"))
      //       ? "X"
      //       : "",
      //   },
      // });

      const res = await http.post("/rfc-reducer/get-cfa-user", {
        IM_CFA_CODE: localStorage.getItem("user_code"),
      });

      if (res.data.code === 0) {
        setAllDepot(res.data.data.EX_DEPO);
      }
    } catch (err) {
      console.log(err);
    } finally {
      props.loading(false);
    }
  };

  useEffect(() => {
    getDepot();
  }, []);

  useEffect(() => {
    fetchRakeDetails(getValues());
  }, []);

  const dataFormat = (value, key, data) => {
    if (key === "STATUS") {
      if (data.APPROVED_SA) {
        return (
          <button
            className="badge-button"
            style={{
              background: "#6e180c",
            }}
          ></button>
        );
      }

      if (data.APPROVED_LG) {
        return (
          <button
            className="badge-button"
            style={{
              background: "#ff8d00",
            }}
          ></button>
        );
      }

      if (data.APPROVED_BH)
        return (
          <button
            className="badge-button"
            style={{
              background: "rgb(145 0 255)",
            }}
          ></button>
        );
      if (data.APPROVED_CS)
        return (
          <button
            className="badge-button "
            style={{
              background: "#0065ff",
            }}
          ></button>
        );
      if (data.CLAIM_STATUS)
        return <button className="badge-button success"></button>;

      if (data.DAMAGE_DATA.length > 0)
        return <button className="badge-button warning"></button>;

      if (data.RR_NO) return <button className="badge-button danger"></button>;
      return <span>data</span>;
    } else if (key === "DEPOTS") {
      let depots = data.DOCUMENT.map((item) => {
        return {
          label: item.DEPOT + " " + item.DEPOT_NAME,
          value: item.DEPOT,
        };
      });

      let uniqueDepots = [];
      depots.forEach((item) => {
        let i = uniqueDepots.findIndex((x) => x.value === item.value);
        if (i <= -1) {
          uniqueDepots.push(item);
        }
      });

      return <ViewDepotsByComma data={uniqueDepots} />;
    } else if (key === "RR_DATE") {
      return moment(value, "YYYYMMDD").format("DD/MM/YYYY");
    } else if (key === "RR_QTY") {
      return Number(value).toFixed(3);
    } else {
      return value ? value : "-";
    }
  };

  return (
    <div className="filter-section">
      <form onSubmit={handleSubmit(fetchRakeDetails)}>
        <div className="row">
          <div className="col-12 col-md-4">
            <div className="row">
              <div className="col-12">
                <label>Depot</label>
              </div>
              <div className="col-12 depot-select">
                <select
                  className="basic-multi-select"
                  placeholder="Select Depot"
                  ref={register}
                  name="DEPOT"
                >
                  <option value="">Select Depot</option>
                  {allDepot.map((depot) => (
                    <option key={depot.DEPOT} value={depot.DEPOT}>
                      {depot.DEPOT} - {depot.DEPOT_NAME}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-2">
            <div className="row">
              <div className="col-12">
                <label>
                  Date From<span>*</span>
                </label>
              </div>
              <div className="col-12 depot-select">
                <input
                  type="date"
                  name="IM_DATE_FROM"
                  ref={register({
                    validate: (value) => {
                      let ans = false;
                      if (watchAllFields.IM_DATE_TO) {
                        if (
                          moment(watchAllFields.IM_DATE_FROM).isBefore(
                            moment(watchAllFields.IM_DATE_TO)
                          ) ||
                          (moment(watchAllFields.IM_DATE_FROM).isSame(
                            moment(watchAllFields.IM_DATE_TO)
                          ) &&
                            moment(watchAllFields.IM_DATE_TO).diff(
                              moment(watchAllFields.IM_DATE_FROM),
                              "days"
                            ) <= 31)
                        ) {
                          ans = true;
                        }
                      } else {
                        ans = true;
                      }
                      return ans;
                    },
                  })}
                  defaultValue={moment()
                    .subtract(30, "day")
                    .format("YYYY-MM-DD")}
                />
                {errors.IM_DATE_FROM && (
                  <p className="form-error">Date should be within 31 days</p>
                )}
              </div>
            </div>
          </div>

          <div className="col-12 col-md-2">
            <div className="row">
              <div className="col-12">
                <label>
                  Date To<span>*</span>
                </label>
              </div>
              <div className="col-12 depot-select">
                <input
                  type="date"
                  name="IM_DATE_TO"
                  ref={register({
                    validate: (value) => {
                      let ans = false;
                      if (watchAllFields.IM_DATE_FROM) {
                        if (
                          (moment(watchAllFields.IM_DATE_FROM).isBefore(
                            moment(watchAllFields.IM_DATE_TO)
                          ) ||
                            moment(watchAllFields.IM_DATE_FROM).isSame(
                              moment(watchAllFields.IM_DATE_TO)
                            )) &&
                          moment(watchAllFields.IM_DATE_TO).diff(
                            moment(watchAllFields.IM_DATE_FROM),
                            "days"
                          ) <= 31
                        ) {
                          ans = true;
                        }
                      } else {
                        ans = true;
                      }
                      return ans;
                    },
                  })}
                  defaultValue={moment().format("YYYY-MM-DD")}
                />
                {errors.IM_DATE_TO && (
                  <p className="form-error">Date should be within 31 days</p>
                )}
              </div>
            </div>
          </div>

          <div className="col-6 col-md-1">
            <div className="row">
              <div className="col-12">
                <label> </label>
              </div>
              <div
                className="col-12"
                style={{
                  paddingTop: "5px",
                }}
              >
                <button className="search-button" type="submit">
                  <i className="fas fa-search icons-button"></i>
                </button>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-1">
            <div className="row">
              <div className="col-12">
                <label> </label>
              </div>
              <div
                className="col-12"
                style={{
                  paddingTop: "5px",
                }}
              >
                <button
                  className="search-button"
                  onClick={() => {
                    localStorage.removeItem("displayInventory");
                    window.location.reload();
                  }}
                  type="button"
                  style={{ color: "white", background: "red" }}
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>

      <br />

      <div className="row">
        <div className="col-12">
          <div className="background" style={{ margin: 0 }}>
            <div className="table-filter">
              <div className="filter-div">
                <div className="row">
                  <div className="col-12 col-md-12">
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        padding: "0 10px",
                      }}
                    >
                      <button
                        className="goods-button"
                        style={{ background: "rgb(15, 111, 162)" }}
                        onClick={() => {
                          history.push(
                            "/dashboard/damage-data-entry/new-rake-entry"
                          );
                        }}
                      >
                        New Rake Entry
                      </button>

                      <button
                        className="goods-button"
                        style={{ background: "rgb(15, 111, 162)" }}
                        onClick={() => {
                          if (selectedRake)
                            history.push(
                              `/dashboard/damage-data-entry/rake-handling-data/${selectedRake}`
                            );
                          else
                            Swal.fire({
                              title: "Please select a rake",
                              icon: "warning",
                              confirmButtonText: "OK",
                            });
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="goods-button"
                        style={{ background: "rgb(15, 111, 162)" }}
                        onClick={() => {
                          if (selectedRake)
                            history.push(
                              `/dashboard/damage-data-entry/rake-damage-data/${selectedRake}`
                            );
                          else
                            Swal.fire({
                              title: "Please select a rake",
                              icon: "warning",
                              confirmButtonText: "OK",
                            });
                        }}
                      >
                        Rake Damage
                      </button>
                      <button
                        className="goods-button"
                        style={{ background: "rgb(15, 111, 162)" }}
                        onClick={() => {
                          if (selectedRake)
                            history.push(
                              `/dashboard/damage-data-entry/demmurage-data/${selectedRake}`
                            );
                          else
                            Swal.fire({
                              title: "Please select a rake",
                              icon: "warning",
                              confirmButtonText: "OK",
                            });
                        }}
                      >
                        Demmurage Data
                      </button>
                      <button
                        className="goods-button"
                        style={{ background: "rgb(15, 111, 162)" }}
                        onClick={() => {
                          if (selectedRake)
                            history.push(
                              `/dashboard/damage-data-entry/claim-insurance/${selectedRake}`
                            );
                          else
                            Swal.fire({
                              title: "Please select a rake",
                              icon: "warning",
                              confirmButtonText: "OK",
                            });
                        }}
                      >
                        Claim Insurance
                      </button>

                      {allData.length > 0 && (
                        <ExcelReport
                          data={allData.map((ele) => {
                            return {
                              "View": "View",

                              "Status": ele.CLAIM_STATUS
                                ? "Rake Entry Claimed"
                                : ele.DAMAGE_DATA?.length > 0
                                  ? "Rake Damage Entered"
                                  : ele.RR_NO
                                    ? "Rake Data Entered"
                                    : "",

                              "Remarks": [
                                `CS: ${ele.CS_COMMENT || "-"}`,
                                `BH: ${ele.BH_COMMENT || "-"}`,
                                `LG: ${ele.LG_COMMENT || "-"}`,
                                `SA: ${ele.SA_COMMENT || "-"}`
                              ].join("\n"),

                              "Rake No.": ele.RAKE_NO || "-",
                              "RR No.": ele.RR_NO || "-",
                              "RR Quantity": Number(ele.RR_QTY || 0).toFixed(2),

                              "RR Date": ele.RR_DATE
                                ? moment(ele.RR_DATE, "YYYYMMDD").format("DD/MM/YYYY")
                                : "-",

                              "Delivery Plants":
                                [...new Set(
                                  ele.DOCUMENT.map((d) => `${d.MFG_PLANT} ${d.MFG_PLANT_NAME}`)
                                )].join(", ") || "-",

                              "Rec. Plants":
                                [...new Set(
                                  ele.DOCUMENT.map((d) => `${d.DEPOT} ${d.DEPOT_NAME}`)
                                )].join(", ") || "-",

                              "State":
                                [...new Set(
                                  ele.DOCUMENT.map((d) => `${d.DEPOT_REG} - ${d.DEPOT_REG_DESC}`)
                                )].join(", ") || "-",

                              "Location":
                                [...new Set(
                                  ele.DOCUMENT.map((d) => d.DEPOT_LOCATION)
                                )].join(", ") || "-",

                              "Rake Type": ele.RR_TYPE || "-",
                              "Wagon Type": ele.WAGON_TYPE || "-",
                              "CFA Name": ele.HANDLING_PARTY || "-",
                              "CFA Contact Number": ele.HANDLING_PARTY_PHONE_NO || "-",

                              "SDM Details":
                                [...new Set(
                                  ele.DOCUMENT.map(
                                    (d) =>
                                      `${d.SDM_DATA?.name || ""} - ${d.SDM_DATA?.email || ""} - ${d.SDM_DATA?.mobile || ""
                                      }`
                                  )
                                )].join("\n") || "-",

                              "Date of Rake Received": ele.DATE_OF_RAKE_RECEIVED
                                ? moment(ele.DATE_OF_RAKE_RECEIVED, "YYYYMMDD").format("DD/MM/YYYY")
                                : "-",

                              "Date of Rake Completion": ele.DATE_OF_RAKE_COMPLETION
                                ? moment(ele.DATE_OF_RAKE_COMPLETION, "YYYYMMDD").format("DD/MM/YYYY")
                                : "-",

                              "Created At": ele.createdAt
                                ? moment(ele.createdAt).format("DD/MM/YYYY")
                                : "-",

                              "Updated At": ele.updatedAt
                                ? moment(ele.updatedAt).format("DD/MM/YYYY")
                                : "-",

                              "Receive Time": ele.RECEIVE_TIME || "-",
                              "Completion Time": ele.COMPLETION_TIME || "-",

                              "Direct Sale from Siding": ele.DIRECT_SALE_FROM_SIDING || "-",
                              "QTY Shifted to Godown": ele.QTY_SHIFTED_TO_GODOWN || "-",
                              "Wagon in Transit": ele.WAGON_TRANSIT || "-",

                              "Cut & Torn": ele.CUT_TORN || "-",
                              "Water Damage": ele.WATER_DMG || "-",
                              "Handling Damage": ele.HANDING_DMG || "-",
                              "Burst Bag": ele.NEW_BURST || "-",
                              "Others": ele.BRUST_BAG || "-",
                              "Total Damage": ele.TOTAL_DMG || "-",
                              "Damage %": ele.TOTAL_DMG_PER || "-",

                              "Claim Intimation Date": ele.CLAIM_DATE
                                ? moment(ele.CLAIM_DATE, "YYYYMMDD").format("DD/MM/YYYY")
                                : "-",

                              "Is Claim Intimated": ele.CLAIM_INTIMATION_STATUS || "-",
                              "Claim Qty": ele.CLAIM_QTY || "-",
                              "Claim Amount": ele.CLAIM_AMOUNT || "-",
                              "Claim No": ele.CLAIM_NO || "-",
                              "Claim Status": ele.CLAIM_STATUS || "-",

                              "Demurrage in Rs.": ele.DEM_RS || "-",
                              "Wharfage in Rs.": ele.WHR_RS || "-",
                            };
                          })}
                          columns={[
                            { title: "View", key: "View" },
                            { title: "Status", key: "Status" },
                            { title: "Remarks", key: "Remarks" },
                            { title: "Rake No.", key: "Rake No." },
                            { title: "RR No.", key: "RR No." },
                            { title: "RR Quantity", key: "RR Quantity" },
                            { title: "RR Date", key: "RR Date" },
                            { title: "Delivery Plants", key: "Delivery Plants" },
                            { title: "Rec. Plants", key: "Rec. Plants" },
                            { title: "State", key: "State" },
                            { title: "Location", key: "Location" },
                            { title: "Rake Type", key: "Rake Type" },
                            { title: "Wagon Type", key: "Wagon Type" },
                            { title: "CFA Name", key: "CFA Name" },
                            { title: "CFA Contact Number", key: "CFA Contact Number" },
                            { title: "SDM Details", key: "SDM Details" },
                            { title: "Date of Rake Received", key: "Date of Rake Received" },
                            { title: "Date of Rake Completion", key: "Date of Rake Completion" },
                            { title: "Created At", key: "Created At" },
                            { title: "Updated At", key: "Updated At" },
                            { title: "Receive Time", key: "Receive Time" },
                            { title: "Completion Time", key: "Completion Time" },
                            { title: "Direct Sale from Siding", key: "Direct Sale from Siding" },
                            { title: "QTY Shifted to Godown", key: "QTY Shifted to Godown" },
                            { title: "Wagon in Transit", key: "Wagon in Transit" },
                            { title: "Cut & Torn", key: "Cut & Torn" },
                            { title: "Water Damage", key: "Water Damage" },
                            { title: "Handling Damage", key: "Handling Damage" },
                            { title: "Burst Bag", key: "Burst Bag" },
                            { title: "Others", key: "Others" },
                            { title: "Total Damage", key: "Total Damage" },
                            { title: "Damage %", key: "Damage %" },
                            { title: "Claim Intimation Date", key: "Claim Intimation Date" },
                            { title: "Is Claim Intimated", key: "Is Claim Intimated" },
                            { title: "Claim Qty", key: "Claim Qty" },
                            { title: "Claim Amount", key: "Claim Amount" },
                            { title: "Claim No", key: "Claim No" },
                            { title: "Claim Status", key: "Claim Status" },
                            { title: "Demurrage in Rs.", key: "Demurrage in Rs." },
                            { title: "Wharfage in Rs.", key: "Wharfage in Rs." },
                          ]}
                          fileName={`Rake Data ${moment().format()}`}
                        />

                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="table-div" style={{ minHeight: "auto" }}>
              <table className="table" style={{ margin: "10px 0" }}>
                <thead>
                  <tr>
                    {columns.map((column, index) => (
                      <th className="table-sticky-vertical" key={index}>
                        {column.title}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allData.map((ele, i) => (
                    <tr key={ele.RR_NO + i}>
                      {columns.map((column, index) => {
                        if (column.title === "View") {
                          return (
                            <td key={index}>
                              <i
                                className="fas fa-eye"
                                style={{ color: "black", cursor: "pointer" }}
                              ></i>
                            </td>
                          );
                        } else if (column.title === "View Details") {
                          return (
                            <td key={index}>
                              <button
                                className="goods-button"
                                style={{
                                  backgroundColor: "#007EA7",
                                  margin: 0,
                                }}
                                onClick={() => {
                                  history.push(
                                    `rake-handling-data/${ele.RR_NO}?view=true`
                                  );
                                }}
                              >
                                View
                              </button>
                            </td>
                          );
                        } else if (column.title === "") {
                          return (
                            <Fragment key={index}>
                              {!ele["APPROVED_CS"] &&
                                !ele["APPROVED_BH"] &&
                                !ele["APPROVED_LG"] ? (
                                <td key={index}>
                                  <input
                                    type="radio"
                                    onChange={(e) => {
                                      setSelectedRake(e.target.value);
                                    }}
                                    value={ele[column.key]}
                                    name="selectRake"
                                  />{" "}
                                </td>
                              ) : (
                                <td></td>
                              )}
                            </Fragment>
                          );
                        } else {
                          return (
                            <td key={index}>
                              {dataFormat(ele[column.key], column.key, ele)}
                            </td>
                          );
                        }
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="row">
              <StatusRakeData />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const mapStateToProps = (state) => ({});

const mapDispatchToProps = {
  loading,
};

export default connect(mapStateToProps, mapDispatchToProps)(RakeData);
