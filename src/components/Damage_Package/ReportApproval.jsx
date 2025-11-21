import moment from "moment";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { connect, useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import { loading } from "../../actions/loadingAction";
import ExcelReport from "../../Functions/ExcelReport";
import ViewDepotsByComma from "../../Functions/ViewDepotsByComma";
import useAllPlant from "../../hook/useAllPlants";
import http from "../../services/apicall";
import apis from "../../services/apis";
import {
  approvedStatus,
  globalDate,
  mergeDamageData,
} from "../../services/utils";
import CustomTable from "../shared/ReactTable";
import ApproveReject from "./ApproveReject";
import StatusRakeData from "./StatusRakeData";

export const Report = (props) => {
  const [allData, setAllData] = useState([]);
  const [allDepot, setAllDepot] = useState([]);
  const [approve, setApprove] = useState(false);

  const { register, handleSubmit, errors, watch } = useForm();

  const CFAs = useSelector((state) => state.Auth.mappedCFA);
  const userdetails = useSelector((state) => state.Auth.userdetails);
  const allPlants = useAllPlant();

  const history = useHistory();

  const watchAllFields = watch();

  const getAllMappedDepot = async () => {
    try {
      props.loading(true);
      const res = await http.post(apis.COMMON_POST_WITH_TABLE_NAME, {
        TABLE: "USER_DEPOT_MAP",
        params: {
          USER_CODE: localStorage.getItem("user_code"),
        },
      });
      if (res.data.code === 0) {
        let plants = res.data.result;

        const mergedArray = plants.map((item) => {
          const matchingPlant = allPlants.find(
            (plant) => plant.PLANT === item.DEPOT
          );

          return {
            ...item,
            DEPOT_NAME: matchingPlant ? matchingPlant.PLANT_NAME : "Unknown",
          };
        });

        setAllDepot(mergedArray);
      }
    } catch (error) {
    } finally {
      props.loading(false);
    }
  };

  useEffect(() => {
    if (allPlants.length) getAllMappedDepot();
  }, [userdetails, allPlants]);

  useEffect(() => {
    if (allDepot.length > 0) {
      getAllData();
    }
  }, [allDepot]);

  const formatDate = (date) => {
    return moment(date, "YYYY-MM-DD").format("YYYYMMDD");
  };

  console.log(approve);

  const getAllData = async (data) => {
    try {
      props.loading(true);

      if (!data) {
        data = watchAllFields;
      }

      setApprove(data.APPROVE === "Y");

      let DEPOT_DATA = [];
      if (watchAllFields.DEPOT) {
        DEPOT_DATA.push(watchAllFields.DEPOT);
      } else {
        DEPOT_DATA = allDepot.map((item) => item.DEPOT);
      }

      let res;
      console.log(userdetails.user_type);
      if (data.APPROVE === "Y") {
        res = await http.post("/get-all-rake-data-by-depot-full-approved", {
          DEPOT: DEPOT_DATA,
          IM_DATE_FROM: formatDate(data.IM_DATE_FROM),
          IM_DATE_TO: formatDate(data?.IM_DATE_TO),
        });
      } else if (userdetails.user_type === 5) {
        res = await http.post("/get-all-rake-data-by-depot", {
          DEPOT: DEPOT_DATA,
          IM_DATE_FROM: formatDate(data.IM_DATE_FROM),
          IM_DATE_TO: formatDate(data?.IM_DATE_TO),
        });
      } else if (userdetails.user_type === 6 || userdetails.user_type === 7) {
        res = await http.post("/get-all-rake-data-by-depot-bh-approved", {
          DEPOT: DEPOT_DATA,
          IM_DATE_FROM: formatDate(data.IM_DATE_FROM),
          IM_DATE_TO: formatDate(data?.IM_DATE_TO),
        });
      } else if (userdetails.user_type === 9) {
        res = await http.post("/get-all-rake-data-by-depot-lg-approved", {
          DEPOT: DEPOT_DATA,
          IM_DATE_FROM: formatDate(data.IM_DATE_FROM),
          IM_DATE_TO: formatDate(data?.IM_DATE_TO),
        });
      } else {
        res = await http.post("/get-all-rake-data-by-depot-cs-approved", {
          DEPOT: DEPOT_DATA,
          IM_DATE_FROM: formatDate(data.IM_DATE_FROM),
          IM_DATE_TO: formatDate(data?.IM_DATE_TO),
        });
      }
      if (res.data.code === 0) {
        let data = res.data.result;

        let updatedData = data.map((item) => {
          return {
            ...item,
            ...mergeDamageData(item.DAMAGE_DATA, item.RR_QTY),
          };
        });

        setAllData(updatedData);
      }
    } catch (error) {
    } finally {
      props.loading(false);
    }
  };

  useEffect(() => {
    if (CFAs?.length > 0) {
      let form = document.getElementById("get-rake-data");
      // submit the form
      form.dispatchEvent(new Event("submit"));
    }
  }, [CFAs]);

  let columnsView = [
    {
      title: "View",
      key: "VIEW",
      render: (text, data) => {
        return (
          <button
            className="goods-button"
            style={{
              background: "green",
              padding: "10px",
              margin: 0,
            }}
            onClick={() => {
              if (approve) {
                history.push(
                  `/dashboard/damage-data-entry/rake-handling-data/${data.RR_NO}?editOnly=true&view=true&hide-approve-reject=Hide`
                );
              } else {
                history.push(
                  `/dashboard/damage-data-entry/rake-handling-data/${data.RR_NO}?editOnly=true&view=true`
                );
              }
            }}
          >
            View
          </button>
        );
      },
    },
    {
      title: "Approve or Reject",
      key: "APPROVE",
      render: (text, data) => {
        return (
          <ApproveReject id={data.RR_NO} tableView={true} nextPage={false} />
        );
      },
      width: "300px",
      hidden: approve || userdetails.user_type === 7,
    },
    {
      title: "Status",
      key: "STATUS",
      render: (text, data) => {
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
        if (data.RR_NO)
          return <button className="badge-button danger"></button>;
        return <span>data</span>;
      },
    },
    {
      title: "Remarks",
      key: "LG_COMMENT",
      width: "300px",
      render: (text, data) => {
        if (userdetails.user_type === 4) {
          return data.LG_COMMENT;
        } else if (userdetails.user_type === 3) {
          return data.CS_COMMENT;
        } else {
          return data.CS_COMMENT ? data.CS_COMMENT : data.BH_COMMENT;
        }
      },
    },
    { title: "RR No.", key: "RR_NO", width: "150px" },
    { title: "RR Quantity", key: "RR_QTY" },
    {
      title: "RR Date",
      key: "RR_DATE",
      render: (text) => moment(text, "YYYYMMDD").format("DD/MM/YYYY"),
    },
    {
      title: "Delivery Plants",
      key: "DELI_DEPOTS",
      width: "350px",
      render: (text, data) => {
        let uniqueDepots = depotLogic(data);
        return <ViewDepotsByComma data={uniqueDepots} />;
      },
    },
    {
      title: "Rec. Plants",
      key: "DEPOTS",
      width: "350px",
      render: (text, data) => {
        let uniqueDepots = depotLogic(data);
        return <ViewDepotsByComma data={uniqueDepots} />;
      },
    },
    {
      title: "State",
      key: "STATES",
      width: "300px",
      render: (text, data) => {
        let depots = data.DOCUMENT.map((item) => {
          return {
            label: item.DEPOT_REG + " - " + item.DEPOT_REG_DESC,
            value: item.DEPOT_REG + " - " + item.DEPOT_REG_DESC,
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
      },
    },
    {
      title: "Location",
      key: "LOCATION",
      render: (text, data) => {
        return [
          ...new Set(
            data.DOCUMENT.map((item) => {
              return item.DEPOT_LOCATION;
            })
          ),
        ].join(", ");
      },
    },
    { title: "Rake Type", key: "RR_TYPE", width: "150px" },
    { title: "Wagon Type", key: "WAGON_TYPE" },
    { title: "Name of Party", key: "HANDLING_PARTY", width: "400px" },
    {
      title: "Date of Rake Received",
      key: "DATE_OF_RAKE_RECEIVED",
      width: "200px",
      render: (text) => moment(text, "YYYYMMDD").format("DD/MM/YYYY"),
    },
    {
      title: "Date of Rake Completion",
      key: "DATE_OF_RAKE_COMPLETION",
      width: "200px",
      render: (text) => moment(text, "YYYYMMDD").format("DD/MM/YYYY"),
    },
    { title: "Receive Time", key: "RECEIVE_TIME" },
    { title: "Completion Time", key: "COMPLETION_TIME" },
    {
      title: "Direct Sale from Siding",
      key: "DIRECT_SALE_FROM_SIDING",
      width: "200px",
    },
    {
      title: "QTY Shifted to Godown",
      key: "QTY_SHIFTED_TO_GODOWN",
      width: "200px",
    },
    { title: "Wagon in Transit", key: "WAGON_TRANSIT", width: "200px" },
    { title: "Cut & Torn", key: "CUT_TORN" },
    { title: "Water Damage", key: "WATER_DMG" },
    { title: "Handling Damage", key: "HANDING_DMG" },
    { title: "Burst Bag", key: "NEW_BURST" },
    { title: "Others", key: "BRUST_BAG" },
    { title: "Total Damage", key: "TOTAL_DMG" },
    { title: "Damage %", key: "TOTAL_DMG_PER" },
    {
      title: "Claim Intimation Date",
      key: "CLAIM_DATE",
      width: "200px",
      render: (text) => globalDate(text),
    },
    { title: "Claim Qty", key: "CLAIM_QTY" },
    { title: "Claim Amount", key: "CLAIM_AMOUNT" },
    { title: "Claim No", key: "CLAIM_NO", width: "200px" },
    { title: "Claim Status", key: "CLAIM_STATUS", width: "200px" },
    { title: "Demmurage in Rs.", key: "DEM_RS" },
    { title: "Wharfage in Rs.", key: "WHR_RS" },
  ].filter((ele) => !ele.hidden);

  const depotLogic = (data) => {
    let depots = data.DOCUMENT.map((item) => {
      return {
        label: item.MFG_PLANT + " " + item.MFG_PLANT_NAME,
        value: item.MFG_PLANT + " " + item.MFG_PLANT_NAME,
      };
    });
    let uniqueDepots = [];
    depots.forEach((item) => {
      let i = uniqueDepots.findIndex((x) => x.value === item.value);
      if (i <= -1) {
        uniqueDepots.push(item);
      }
    });
    return uniqueDepots;
  };

  const findStatus = (data) => {
    if (data.CLAIM_STATUS) return "Claimed";
    if (data.DAMAGE_DATA.length > 0) return "Damage Entered";
    if (data.RR_NO) return "Rake Data Entered";
    return "Rake Entry";
  };

  return (
    <div className="filter-section">
      <form onSubmit={handleSubmit(getAllData)} id="get-rake-data">
        <div className="row">
          <div className="col-12 col-md-4">
            <div className="row">
              <div className="col-12">
                <label>Plants</label>
              </div>
              <div className="col-12 depot-select">
                <select
                  className="basic-multi-select"
                  placeholder="Select Depot"
                  ref={register}
                  name="DEPOT"
                >
                  <option value="">Select</option>
                  {allDepot.map((depot, index) => (
                    <option key={depot.DEPOT + index} value={depot.DEPOT}>
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
                    .subtract(182, "day")
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
          {userdetails.user_type === 9 && (
            <div className="col-12 col-md-2">
              <div className="row">
                <div className="col-12">
                  <label>
                    Approved<span>*</span>
                  </label>
                </div>
                <div className="col-12">
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <input
                      type="radio"
                      name="APPROVE"
                      value={"Y"}
                      ref={register}
                      style={{ width: "25%" }}
                    />
                    <label style={{ padding: "0px" }}>Yes</label>&emsp;
                    <input
                      type="radio"
                      name="APPROVE"
                      value={"N"}
                      ref={register}
                      style={{ width: "25%" }}
                      defaultChecked
                    />
                    <label style={{ padding: "0px" }}>No</label>
                  </div>
                </div>
              </div>
            </div>
          )}

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
      <div className="background" style={{ margin: 0, padding: "10px" }}>
        <div className="table-filter">
          <div className="row">
            <div className="col-12">
              {allData?.length > 0 && (
                <ExcelReport
                  data={allData.map((item) => {
                    return {
                      "View": "View",

                      "Status": findStatus(item),

                      "Remarks": [
                        `CS: ${item.CS_COMMENT || "-"}`,
                        `BH: ${item.BH_COMMENT || "-"}`,
                        `LG: ${item.LG_COMMENT || "-"}`,
                        `SA: ${item.SA_COMMENT || "-"}`
                      ].join("\n"),

                      "Rake No.": item.RAKE_NO || "-",
                      "RR No.": item.RR_NO || "-",
                      "RR Quantity": Number(item.RR_QTY || 0).toFixed(2),

                      "RR Date": item.RR_DATE
                        ? moment(item.RR_DATE, "YYYYMMDD").format("DD/MM/YYYY")
                        : "-",

                      "Delivery Plants":
                        [...new Set(
                          item.DOCUMENT.map(
                            (d) => `${d.MFG_PLANT} ${d.MFG_PLANT_NAME}`
                          )
                        )].join(", ") || "-",

                      "Rec. Plants":
                        [...new Set(
                          item.DOCUMENT.map(
                            (d) => `${d.DEPOT} ${d.DEPOT_NAME}`
                          )
                        )].join(", ") || "-",

                      "State":
                        [...new Set(
                          item.DOCUMENT.map(
                            (d) => `${d.DEPOT_REG} - ${d.DEPOT_REG_DESC}`
                          )
                        )].join(", ") || "-",

                      "Location":
                        [...new Set(
                          item.DOCUMENT.map((d) => d.DEPOT_LOCATION)
                        )].join(", ") || "-",

                      "Rake Type": item.RR_TYPE || "-",
                      "Wagon Type": item.WAGON_TYPE || "-",

                      "CFA Name": item.HANDLING_PARTY || "-",
                      "CFA Contact Number": item.HANDLING_PARTY_PHONE_NO || "-",

                      "SDM Details":
                        [...new Set(
                          item.DOCUMENT.map(
                            (d) =>
                              `${d.SDM_DATA?.name || ""} - ${d.SDM_DATA?.email || ""} - ${d.SDM_DATA?.mobile || ""
                              }`
                          )
                        )].join("\n") || "-",

                      "Date of Rake Received": item.DATE_OF_RAKE_RECEIVED
                        ? moment(item.DATE_OF_RAKE_RECEIVED, "YYYYMMDD").format("DD/MM/YYYY")
                        : "-",

                      "Date of Rake Completion": item.DATE_OF_RAKE_COMPLETION
                        ? moment(item.DATE_OF_RAKE_COMPLETION, "YYYYMMDD").format("DD/MM/YYYY")
                        : "-",

                      "Created At": item.createdAt
                        ? moment(item.createdAt).format("DD/MM/YYYY")
                        : "-",

                      "Updated At": item.updatedAt
                        ? moment(item.updatedAt).format("DD/MM/YYYY")
                        : "-",

                      "Receive Time": item.RECEIVE_TIME || "-",
                      "Completion Time": item.COMPLETION_TIME || "-",

                      "Direct Sale from Siding": item.DIRECT_SALE_FROM_SIDING || "-",
                      "QTY Shifted to Godown": item.QTY_SHIFTED_TO_GODOWN || "-",
                      "Wagon in Transit": item.WAGON_TRANSIT || "-",

                      "Cut & Torn": item.CUT_TORN || "-",
                      "Water Damage": item.WATER_DMG || "-",
                      "Handling Damage": item.HANDING_DMG || "-",
                      "Burst Bag": item.NEW_BURST || "-",
                      "Others": item.BRUST_BAG || "-",
                      "Total Damage": item.TOTAL_DMG || "-",
                      "Damage %": item.TOTAL_DMG_PER || "-",

                      "Claim Intimation Date": item.CLAIM_DATE
                        ? moment(item.CLAIM_DATE, "YYYYMMDD").format("DD/MM/YYYY")
                        : "-",

                      "Is Claim Intimated": item.CLAIM_INTIMATED_STATUS || "-",
                      "Claim Qty": item.CLAIM_QTY || "-",
                      "Claim Amount": item.CLAIM_AMOUNT || "-",
                      "Claim No": item.CLAIM_NO || "-",
                      "Claim Status": item.CLAIM_STATUS || "-",

                      "Demurrage in Rs.": item.DEM_RS || "-",
                      "Wharfage in Rs.": item.WHR_RS || "-",
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

                  fileName={`Report Approval Excel ${moment().format()}`}
                />


              )}
            </div>
          </div>
          <div className="filter-div">
            <div className="row">
              <div className="table-div" style={{ width: "100%" }}>
                <CustomTable columns={columnsView} data={allData} />
              </div>
              <div className="row">
                <StatusRakeData />
              </div>
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

export default connect(mapStateToProps, mapDispatchToProps)(Report);
