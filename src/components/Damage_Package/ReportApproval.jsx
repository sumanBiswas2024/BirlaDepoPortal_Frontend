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
                  data={allData.map((item) => ({
                    RR_NO: item.RR_NO,
                    RAKE_NO: item.RAKE_NO,

                    RR_DATE: moment(item.RR_DATE, "YYYYMMDD").format("DD/MM/YYYY"),
                    DATE_OF_RAKE_RECEIVED: moment(
                      item.DATE_OF_RAKE_RECEIVED,
                      "YYYYMMDD"
                    ).format("DD/MM/YYYY"),
                    DATE_OF_RAKE_COMPLETION: moment(
                      item.DATE_OF_RAKE_COMPLETION,
                      "YYYYMMDD"
                    ).format("DD/MM/YYYY"),

                    RR_QTY: Number(item.RR_QTY).toFixed(2),
                    DIRECT_SALE_FROM_SIDING: item.DIRECT_SALE_FROM_SIDING,
                    QTY_SHIFTED_TO_GODOWN: item.QTY_SHIFTED_TO_GODOWN,
                    WAGON_TRANSIT: item.WAGON_TRANSIT,

                    CUT_TORN: item.CUT_TORN,
                    WATER_DMG: item.WATER_DMG,
                    HANDING_DMG: item.HANDING_DMG,
                    NEW_BURST: item.NEW_BURST,
                    BRUST_BAG: item.BRUST_BAG,
                    TOTAL_DMG: item.TOTAL_DMG,
                    TOTAL_DMG_PER: item.TOTAL_DMG_PER,

                    CLAIM_DATE: globalDate(item.CLAIM_DATE),
                    CLAIM_STATUS: item.CLAIM_STATUS,
                    CLAIM_AMOUNT: item.CLAIM_AMOUNT,
                    CLAIM_NO: item.CLAIM_NO,
                    CLAIM_QTY: item.CLAIM_QTY,

                    DEPOTS: item.DOCUMENT.map(
                      (d) => `${d.DEPOT} - ${d.DEPOT_NAME}`
                    ).join(", "),

                    DELI_DEPOTS: item.DOCUMENT.map(
                      (d) => `${d.MFG_PLANT} - ${d.MFG_PLANT_NAME}`
                    ).join(", "),

                    STATES: item.DOCUMENT.map(
                      (d) => `${d.DEPOT_REG} - ${d.DEPOT_REG_DESC}`
                    ).join(", "),

                    LOCATION: [
                      ...new Set(item.DOCUMENT.map((d) => d.DEPOT_LOCATION)),
                    ].join(", "),

                    STATUS: findStatus(item),
                    APPROVE: approvedStatus(item),

                    REMARKS: [
                      item.CS_COMMENT && `• CS: ${item.CS_COMMENT}`,
                      item.BH_COMMENT && `• BH: ${item.BH_COMMENT}`,
                      item.LG_COMMENT && `• LG: ${item.LG_COMMENT}`,
                      item.SA_COMMENT && `• SA: ${item.SA_COMMENT}`,
                    ]
                      .filter(Boolean)
                      .join("\n\n"),
                  }))}
                  columns={columnsView.filter((ele) => ele.title !== "")}
                  fileName={`Consolidated Rake Arrival Report ${moment().format()}`}
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
