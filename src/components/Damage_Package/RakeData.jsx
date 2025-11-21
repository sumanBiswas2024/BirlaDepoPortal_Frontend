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
                          data={allData.map((ele) => ({
                            RR_NO: ele.RR_NO,
                            RAKE_NO: ele.RAKE_NO,
                            RR_DATE: moment(ele.RR_DATE, "YYYYMMDD").format("DD/MM/YYYY"),
                            RR_QTY: Number(ele.RR_QTY).toFixed(2),

                            USER_ID: ele.USER_ID,
                            USER_NAME: ele.USER_NAME,

                            DEPOTS: ele.DOCUMENT.map(
                              (d) => `${d.DEPOT} - ${d.DEPOT_NAME}`
                            ).join(", "),

                            STATUS:
                              ele.CLAIM_STATUS
                                ? "Rake Entry Claimed"
                                : ele.DAMAGE_DATA?.length > 0
                                  ? "Rake Damage Entered"
                                  : ele.RR_NO
                                    ? "Rake Data Entered"
                                    : "",

                            APPROVE: approvedStatus(ele),

                            REMARKS: [
                              ele.CS_COMMENT && `• CS: ${ele.CS_COMMENT}`,
                              ele.BH_COMMENT && `• BH: ${ele.BH_COMMENT}`,
                              ele.LG_COMMENT && `• LG: ${ele.LG_COMMENT}`,
                              ele.SA_COMMENT && `• SA: ${ele.SA_COMMENT}`,
                            ]
                              .filter(Boolean)
                              .join("\n\n"),
                          }))}
                          fileName={`Rake Data ${moment().format()}`}
                          columns={columns.filter((ele) => ele.title !== "")}
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
