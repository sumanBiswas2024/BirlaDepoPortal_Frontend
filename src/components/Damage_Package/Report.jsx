import moment from "moment";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { connect, useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import Select from "react-select";
import { loading } from "../../actions/loadingAction";
import ExcelReport from "../../Functions/ExcelReport";
import ViewDepotsByComma from "../../Functions/ViewDepotsByComma";
import http from "../../services/apicall";
import StatusRakeData from "./StatusRakeData";
import { approvedStatus, mergeDamageData } from "../../services/utils";
import { Link } from "react-router-dom";
import ViewRemarks from "../../Functions/ViewRemarks";

export const Report = (props) => {
  const [allData, setAllData] = useState([]);
  const [allDepot, setAllDepot] = useState([]);
  const [reportType, setReportType] = useState("RR");

  const { register, handleSubmit, errors, watch, setValue } = useForm({
    defaultValues: {
      IM_TYPE: "RR",
    },
  });

  const cfa = useSelector((state) => state.Auth.cfa);
  const CFAs = useSelector((state) => state.Auth.mappedCFA);

  const history = useHistory();

  const watchAllFields = watch();

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

  const getAllData = async (data) => {
    props.loading(true);

    if (!data) {
      data = watchAllFields;
    }

    if (watchAllFields.IM_TYPE === "RR") {
      setReportType("RR");
    } else {
      setReportType("DO");
    }

    const postData = {
      IM_DATE_FROM: moment(data.IM_DATE_FROM, "YYYY-MM-DD").format("YYYYMMDD"),
      IM_DATE_TO: moment(data.IM_DATE_TO, "YYYY-MM-DD").format("YYYYMMDD"),
    };

    if (data.IM_CFA) {
      postData.USER_ID = [data.IM_CFA];
    }

    http
      .post("/get-all-rake-data", {
        ...postData,
      })
      .then((res) => {
        const data = res.data.data;
        let updatedData = [];
        if (watchAllFields.IM_TYPE === "RR") {
          updatedData = data.map((item) => {
            // let mergeData = mergeDamageData(item.DAMAGE_DATA, item.RR_QTY);
            // console.log(mergeData);
            return {
              ...item,
              ...mergeDamageData(item.DAMAGE_DATA, item.RR_QTY),
            };
          });
        } else {
          // Extract delivery numbers and create a list
          const deliveryNumbersList = [];
          data.forEach((item) =>
            item.DAMAGE_DATA.forEach((doc) => {
              deliveryNumbersList.push([...makeDeliveryData(item, doc)]);
            })
          );

          updatedData = deliveryNumbersList.flat();
        }
        setAllData(updatedData);
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => {
        props.loading(false);
      });
  };

  const makeDeliveryData = (rrData, data) => {
    let deliveryData = [];

    const damageData = data;

    let allData = { ...data };

    delete damageData.COMBINED_MATERIAL;

    allData.COMBINED_MATERIAL.forEach((delivery, i) => {
      if (i === 0) {
        deliveryData.push({
          ...delivery,
          ...rrData,
          ...damageData,
        });
      } else {
        deliveryData.push({
          ...delivery,
          ...rrData,
        });
      }
    });

    return deliveryData;
  };

  useEffect(() => {
    if (CFAs?.length > 0) {
      let form = document.getElementById("get-rake-data");
      // submit the form
      form.dispatchEvent(new Event("submit"));
    }
  }, [CFAs]);

  const columnsView = [
    { title: "", key: "EDIT" },
    { title: "View", key: "APPROVE" },
    { title: "Status", key: "STATUS" },
    { title: "Remarks", key: "REMARKS" },
    // Rake No.	Delivery no	Distr Chnl	Material Code	Material Name	Delivery Qty
    { title: "Rake No.", key: "RAKE_NO", width: "200px" },
    { title: "Delivery No", key: "DELIVERY_NO", hidden: reportType === "RR" },
    { title: "Distr. Chnl.", key: "DISTR_CHNL", hidden: reportType === "RR" },
    { title: "Material Code", key: "MATERIAL", hidden: reportType === "RR" },
    {
      title: "Material Name",
      key: "MATERIAL_DESC",
      width: "300px",
      hidden: reportType === "RR",
    },
    { title: "Delivery Qty", key: "GR_QTY", hidden: reportType === "RR" },
    { title: "RR No.", key: "RR_NO" },
    { title: "RR Quantity", key: "RR_QTY" },
    { title: "RR Date", key: "RR_DATE" },
    { title: "Delivery Plants", key: "DELI_DEPOTS", width: "350px" },
    { title: "Rec. Plants", key: "DEPOTS", width: "350px" },
    { title: "State", key: "STATES", width: "200px" },
    { title: "Location", key: "LOCATION" },
    { title: "Rake Type", key: "RR_TYPE", width: "150px" },
    { title: "Wagon Type", key: "WAGON_TYPE" },
    { title: "CFA Name", key: "HANDLING_PARTY", width: "400px" },
    {
      title: "CFA Contact Number",
      key: "HANDLING_PARTY_PHONE_NO",
      width: "200px",
    },
    {
      title: "SDM Details",
      key: "SDM_DATA",
      width: "600px",
    },
    {
      title: "Date of Rake Received",
      key: "DATE_OF_RAKE_RECEIVED",
      width: "200px",
    },
    {
      title: "Date of Rake Completion",
      key: "DATE_OF_RAKE_COMPLETION",
      width: "200px",
    },
    {
      title: "Created At",
      key: "createdAt",
      width: "200px",
    },
    {
      title: "Updated At",
      key: "updatedAt",
      width: "200px",
    },
    { title: "Receive Time", key: "RECEIVE_TIME" },
    { title: "Completion Time", key: "COMPLETION_TIME" },

    { title: "RR Quantity", key: "RR_QTY" },
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
    { title: "Claim Intimation Date", key: "CLAIM_DATE", width: "200px" },
    { title: "Is Claim Intimated", key: "CLAIM_INTIMATED_STATUS" },
    { title: "Claim Qty", key: "CLAIM_QTY" },
    { title: "Claim Amount", key: "CLAIM_AMOUNT" },
    { title: "Claim No", key: "CLAIM_NO" },
    { title: "Claim Status", key: "CLAIM_STATUS", width: "150px" },
    { title: "Demurrage in Rs.", key: "DEM_RS" },
    { title: "Wharfage in Rs.", key: "WHR_RS" },
  ].filter((ele) => ele.hidden !== true);

  const formatSDMData = (data) => {
    let formatData = data.map((ele) => {
      return (
        (ele.SDM_DATA?.name ?? "") +
        " - " +
        (ele.SDM_DATA?.email ?? "") +
        " - " +
        (ele.SDM_DATA?.mobile ?? "")
      );
    });

    return [...new Set(formatData)];
  };

  const dataFormat = (value, key, data) => {
    if (key === "STATUS") {
      // if(data.)

      if (data.APPROVED_SA) {
        return (
          <button
            className="badge-button"
            style={{ background: "#6e180c" }}
          ></button>
        );
      }

      if (data.APPROVED_LG) {
        return (
          <button
            className="badge-button"
            style={{ background: "#ff8d00" }}
          ></button>
        );
      }

      if (data.APPROVED_BH) {
        return (
          <button
            className="badge-button"
            style={{ background: "rgb(145 0 255)" }}
          ></button>
        );
      }

      if (data.APPROVED_CS) {
        return (
          <button
            className="badge-button"
            style={{ background: "#0065ff" }}
          ></button>
        );
      }

      if (data.CLAIM_STATUS)
        return <button className="badge-button success"></button>;

      if (data.DAMAGE_DATA.length > 0)
        return <button className="badge-button warning"></button>;

      if (data.RR_NO) return <button className="badge-button danger"></button>;
      return <span>data</span>;
    } else if (key === "REMARKS") {
      return (
        <ViewRemarks
          data={[
            {
              user: "CS",
              value: data.CS_COMMENT,
            },
            {
              user: "BH",
              value: data.BH_COMMENT,
            },
            {
              user: "LG",
              value: data.LG_COMMENT,
            },
            {
              user: "SA",
              value: data.SA_COMMENT,
            },
          ]}
        />
      );
    } else if (key === "DELI_DEPOTS") {
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

      return <ViewDepotsByComma data={uniqueDepots} />;
    } else if (key === "DEPOTS") {
      let depots = data.DOCUMENT.map((item) => {
        return {
          label: item.DEPOT + " " + item.DEPOT_NAME,
          value: item.DEPOT + " " + item.DEPOT_NAME,
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
    } else if (key === "STATES") {
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
    } else if (key === "LOCATION") {
      return [
        ...new Set(
          data.DOCUMENT.map((item) => {
            return item.DEPOT_LOCATION;
          })
        ),
      ].join(", ");
    } else if (
      [
        "RR_DATE",
        "DATE_OF_RAKE_RECEIVED",
        "DATE_OF_RAKE_COMPLETION",
        "CLAIM_DATE",
      ].includes(key)
    ) {
      return value ? moment(value, "YYYYMMDD").format("DD/MM/YYYY") : "-";
    } else if (["createdAt", "updatedAt"].includes(key)) {
      return value ? moment(value).format("DD/MM/YYYY") : "-";
    } else if (key === "EDIT") {
      return (
        <button
          className="goods-button"
          style={{
            background: "green",
            margin: 0,
          }}
          onClick={() => {
            history.push(
              `/dashboard/damage-data-entry/claim-insurance/${data.RR_NO}?editOnly=true`
            );
          }}
        >
          EDIT
        </button>
      );
    } else if (
      [
        "RR_QTY",
        "CUT_TORN",
        "WAGON_TRANSIT",
        "HANDING_DMG",
        "BRUST_BAG",
        "TOTAL_DMG",
      ].includes(key)
    ) {
      return value ? Number(value).toFixed(2) : "-";
    } else if (key === "SDM_DATA") {
      return (
        <p
          dangerouslySetInnerHTML={{
            __html: formatSDMData(data.DOCUMENT).join("<br/>"),
          }}
        ></p>
      );
    } else if (key === "MATERIAL") {
      return value?.replace(/^0+/, "");
    } else if (key === "APPROVE") {
      return (
        <Link
          to={`/dashboard/damage-data-entry/rake-handling-data/${data.RR_NO}?view=true`}
        >
          View
        </Link>
      );
    } else {
      return value ? value : "-";
    }
  };

  const findStatus = (data) => {
    if (data.APPROVED_SA) return "Approved By SA";
    if (data.APPROVED_LG) return "Approved By LG";
    if (data.APPROVED_BH) return "Approved By BH";
    if (data.APPROVED_CS) return "Approved By CS";
    if (data.CLAIM_STATUS) return "Claimed";
    if (data.DAMAGE_DATA.length > 0) return "Damage Entered";
    if (data.RR_NO) return "Rake Data Entered";
    return "Rake Entry";
  };

  return (
    <div className="filter-section">
      <form onSubmit={handleSubmit(getAllData)} id="get-rake-data">
        <div className="row">
          <div className="col-12 col-md-3">
            <div className="row">
              {/* <div className="col-12">
                <label>Depot</label>
              </div>
              <div className="col-12 depot-select">
                <select
                  className="basic-multi-select"
                  placeholder="Select Depot"
                  ref={register}
                  name="DEPOT"
                >
                  <option value="">Select</option>
                  {allDepot.map((depot) => (
                    <option key={depot.DEPOT} value={depot.DEPOT}>
                      {depot.DEPOT} - {depot.DEPOT_NAME}
                    </option>
                  ))}
                </select>
              </div> */}
              <input name="IM_CFA" hidden ref={register} />
              <div className="col-12">
                <label>CFA</label>
              </div>
              <div className="col-12 depot-select">
                <Select
                  classNamePrefix="report-select"
                  options={CFAs.map((ele) => {
                    return {
                      value: ele.CFA_CODE.replace(/^0+/, ""),
                      label:
                        ele.CFA_CODE.replace(/^0+/, "") + " - " + ele.CFA_NAME,
                    };
                  })}
                  onChange={(e) => {
                    setValue("IM_CFA", e?.value);
                  }}
                  placeholder={"Select CFA"}
                  isClearable={true}
                />
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

          <div className="col-12 col-md-3">
            <label>Report Type</label>
            <div
              style={{
                display: "flex",
                alignItems: "top",
              }}
            >
              <input
                style={{
                  width: "53px",
                }}
                type="radio"
                name="IM_TYPE"
                ref={register}
                defaultChecked
                value="RR"
              />
              <label style={{ padding: "4px" }}>{"RR_Wise"}</label>
              <input
                style={{
                  width: "53px",
                }}
                type="radio"
                name="IM_TYPE"
                ref={register}
                value="DO"
              />
              <label style={{ padding: "4px" }}>{"Delivery_Wise"}</label>
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
                  fileName={`Consolidated Rake Arrival Report ${moment().format()}`}
                />


              )}
            </div>
          </div>
          <div className="filter-div">
            <div className="row">
              <div className="table-div" style={{ width: "100%" }}>
                <table className="table">
                  <thead>
                    <tr>
                      {columnsView.map((item, index) => {
                        return (
                          <th
                            className="table-sticky-vertical"
                            key={index}
                            style={{
                              minWidth: item.width ? item.width : "100px",
                            }}
                          >
                            {item.title}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {allData?.map((item, index) => {
                      return (
                        <tr key={index}>
                          {columnsView.map((col, index) => {
                            return (
                              <td key={index}>
                                {dataFormat(item[col.key], col.key, item)}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
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
    </div>
  );
};

const mapStateToProps = (state) => ({});

const mapDispatchToProps = {
  loading,
};

export default connect(mapStateToProps, mapDispatchToProps)(Report);
