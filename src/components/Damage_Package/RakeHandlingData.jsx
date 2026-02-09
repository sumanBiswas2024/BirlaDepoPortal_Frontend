import moment from "moment";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { connect } from "react-redux";
import { useHistory, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { loading } from "../../actions/loadingAction";
import http from "../../services/apicall";
import apis from "../../services/apis";
import { getUrlParams } from "../../services/utils";
import ApproveReject from "./ApproveReject";

export const RakeHandlingData = (props) => {
  const [alreadySaved, setAlreadySaved] = useState(false);
  const [allDepot, setAllDepot] = useState([]);
  const [allData, setAllData] = useState([]);
  const [selectedData, setSelectedData] = useState([]);
  const [documentData, setDocument] = useState([]);
  const [RRDetails, setRRDetails] = useState({});

  // RR No. Validationand Sub-Box Logic
  const [rrDuplicateError, setRrDuplicateError] = useState(false);


  const history = useHistory();

  const { register, errors, setValue, handleSubmit, watch, getValues } =
    useForm({
      mode: "onSubmit",
      reValidateMode: "onChange",
    });

  const watchAllFields = watch();

  const { id } = useParams();

  const getDepot = async () => {
    try {
      props.loading(true);
      // const res = await http.post(apis.COMMON_POST_WITH_FM_NAME, {
      //   fm_name: "ZRFC_GET_DEPO",
      //   params: {
      //     IM_CFA_CODE: localStorage.getItem("user_code"),
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
    if (id) {
      fetchDamageData(id);
    }
  }, [id]);

  // create a async useEffect function inside useEffect
  useEffect(() => {
    (async () => {
      await getDepot();
    })();
  }, []);

  const formatDate = (date) => {
    return moment(date, "YYYYMMDD").format("YYYY-MM-DD");
  };

  const fetchDamageData = (RR_NO) => {
    let url = "/get-rake-data/" + RR_NO;
    props.loading(true);

    http
      .get(url)
      .then((res) => {
        if (res.data.code === 0) {
          setAlreadySaved(true);

          let data = res.data.data;
          setValue("RAKE_NO", data.RAKE_NO?.replace("undefined", ""));
          setValue("RR_NO", data.RR_NO);
          setValue("RR_DATE", formatDate(data.RR_DATE));
          setValue("RR_QTY", data.RR_QTY);
          setValue("RR_TYPE", data.RR_TYPE);

          setValue("WAGON_TYPE", data.WAGON_TYPE);
          setValue("HANDLING_PARTY", data.HANDLING_PARTY);
          setValue("HANDLING_PARTY_PHONE_NO", data.HANDLING_PARTY_PHONE_NO);
          setValue("HANDLING_PARTY_CODE", data.HANDLING_PARTY_CODE);
          setValue(
            "DATE_OF_RAKE_RECEIVED",
            formatDate(data.DATE_OF_RAKE_RECEIVED)
          );
          setValue(
            "DATE_OF_RAKE_COMPLETION",
            formatDate(data.DATE_OF_RAKE_COMPLETION)
          );
          setValue("COMPLETION_TIME", data.COMPLETION_TIME);
          setValue("RECEIVE_TIME", data.RECEIVE_TIME);
          setValue("WAGON_TRANSIT", data.WAGON_TRANSIT);
          setValue("DIRECT_SALE_FROM_SIDING", data.DIRECT_SALE_FROM_SIDING);
          setValue("QTY_SHIFTED_TO_GODOWN", data.QTY_SHIFTED_TO_GODOWN);

          setSelectedData(data.DOCUMENT.map((item) => item.MAT_DOC));
          setDocument(data.DOCUMENT);
          setRRDetails(data);

          // fetchRakeDetails(data, data.DOCUMENT);
          // select the checkbox of the selected data
        } else {
          Swal.fire({
            icon: "error",
            title: "Oops...",
            text: res.data.message,
          }).then(() => {
            history.push("/dashboard/damage-data-entry/rake-data");
          });
        }
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => {
        props.loading(false);
      });
  };
  useEffect(() => {
    if (!rrDuplicateError) {
      setValue("RR_NO_SUFFIX", "");
    }
  }, [watchAllFields.RR_NO]);

  const onSubmit = async (data) => {

    // RR No. Validationand Sub-Box Logic
    // if (!/^[0-9]{9}$/.test(data.RR_NO)) {
    //   Swal.fire({
    //     icon: "error",
    //     title: "Oops...",
    //     text: "RR Number must be exactly 9 digits and numeric only",
    //   });
    //   return;
    // }
    // 🔒 Final RR number logic
    let finalRRNo = data.RR_NO;

    if (rrDuplicateError) {
      if (!data.RR_NO_SUFFIX) {
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "Please enter RR suffix",
        });
        return;
      }
      finalRRNo = data.RR_NO + data.RR_NO_SUFFIX;
    }
    data.RR_NO = finalRRNo; // RR No. Validationand Sub-Box Logic


    let postData = {
      ...data,
      RR_NO: data.RR_NO.toString().trim(),
      // RR_NO: finalRRNo,
      RAKE_NO: alreadySaved ? data.RAKE_NO : data.RAKE_NO_PREFIX + data.RAKE_NO,
      // format the date field
      RR_DATE: moment(data.RR_DATE, "YYYY-MM-DD").format("YYYYMMDD"),
      DATE_OF_RAKE_RECEIVED: moment(
        data.DATE_OF_RAKE_RECEIVED,
        "YYYY-MM-DD"
      ).format("YYYYMMDD"),
      DATE_OF_RAKE_COMPLETION: moment(
        data.DATE_OF_RAKE_COMPLETION,
        "YYYY-MM-DD"
      ).format("YYYYMMDD"),
      IM_DATE_FROM: moment(data.IM_DATE_FROM, "YYYY-MM-DD").format("YYYYMMDD"),
      IM_DATE_TO: moment(data.IM_DATE_TO, "YYYY-MM-DD").format("YYYYMMDD"),
      DOCUMENT: [],
    };

    if (!alreadySaved) {
      delete postData.RAKE_NO_PREFIX;
    }

    // // the rr_no should be between 9 to 20 characters else throw error
    // if (!(postData.RR_NO.length >= 9 && postData.RR_NO.length <= 20)) {
    //   Swal.fire({
    //     icon: "error",
    //     title: "Oops...",
    //     text: "RR Number should be between 9 to 20 characters",
    //   });
    //   return;
    // }

    if (postData.RR_NO.includes("/")) {
      Swal.fire({
        icon: "error",
        title: "Opps...",
        text: "RR No contains '/' please remove it to proceed.",
      });
      return;
    }

    if (documentData.length === 0) {
      Swal.fire({
        title: "Opps...",
        text: "Please select atleast one delivery number",
        icon: "error",
      });
      return;
    }

    if (
      +(+data.RR_QTY).toFixed(3) !==
      +(
        +data.QTY_SHIFTED_TO_GODOWN +
        +data.DIRECT_SALE_FROM_SIDING +
        +data.WAGON_TRANSIT
      ).toFixed(3)
    ) {
      Swal.fire({
        title: "Opps...",
        text: "RR Qty should be equal to sum of Qty Shifted to Godown, Direct Sale from Siding and Wagon in Transit",
        icon: "error",
      });
      return;
    }

    // check any of the documentData is not older then 7 days and key is DATEGR_BUDAT
    const is7DaysOld = documentData.some((ele) => {
      return moment(ele.DATEGR_BUDAT, "YYYYMMDD").isBefore(
        moment().subtract(7, "days")
      );
    });

    if (is7DaysOld) {
      if (await permissionToCreateOldDocument(data.RR_NO)) {
        console.log("permission granted");
      } else {
        Swal.fire({
          title: "Opps...",
          text: "Delivery should not be older than 7 days",
          icon: "error",
        });
        return;
      }
    }

    postData.DOCUMENT = documentData;

    let url = alreadySaved
      ? "update-rake-data/" + postData.RR_NO
      : "create-rake-data";

    if (!alreadySaved) {
      postData.USER_ID = localStorage.getItem("user_code");
      postData.USER_NAME = props.Auth.userdetails.name;
    }

    // if (postData.RR_NO.length <= 9 && postData.RR_NO.length >= 20) {
    //   Swal.fire({
    //     icon: "error",
    //     title: "Oops...",
    //     text: "RR Number should be between 9 to 20 characters",
    //   });
    //   return;
    // }

    props.loading(true);
    http
      .post(url, postData)
      .then((res) => {
        if (res.data.code === 0) {
          setRrDuplicateError(false);
          Swal.fire({
            icon: "success",
            title: "Success",
            text: alreadySaved
              ? "Data Updated Successfully"
              : "Data Saved Successfully",
          }).then(() => {
            history.goBack();
          });
        } else {
          console.log(res.data);

          setRrDuplicateError(true); // RR No. Validationand Sub-Box Logic

          const isSuffixDuplicate = rrDuplicateError === true; // RR No. Validationand Sub-Box Logic

          Swal.fire({
            icon: "error",
            title: "RR Already Exists",
            html: isSuffixDuplicate
              ? `<p>This RR number with the given suffix already exists.</p>
                 <p>Please use a different suffix.</p>`
              : `<p>RR no already entered in the system.</p>
                 <br/>
                 <p>RR is entered by ${res.data.data.HANDLING_PARTY}</p>
                 <br/>
                 <p>Please enter RR suffix</p>`
          });

          return;
        }
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => {
        props.loading(false);
      });
  };

  const permissionToCreateOldDocument = async (id) => {
    const data = await http.post(apis.COMMON_POST_WITH_TABLE_NAME, {
      TABLE: "rr_permissions",
      params: {
        RR_NO: id,
      },
    });
    if (data.data.code === 0) {
      if (data.data.result.length > 0) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  };

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Please fill all the required fields",
      });
    }
  }, [errors]);

  let columns = [
    {
      title: "",
      key: "DELIVERY_NO",
    },
    {
      title: "Delivery No",
      key: "DELIVERY_NO",
    },
    { key: "GR_QTY", title: "Dispatch Qty" },
    {
      title: "Mfg Plant",
      key: "MFG_PLANT",
    },
    { key: "DEPOT", title: "Depot" },
    { key: "GRN_DATE", title: "Dispatch Date" },
    { key: "DATEGR_BUDAT", title: "GRN Date" },
    { key: "MATERIAL", title: "Material" },
    { key: "MATERIAL_DESC", title: "Material Desc" },
    { key: "MAT_DOC", title: "Dispatch Mat Document" },
    // { key: "RR_NUMBER", title: "RR Number" },
  ];

  let columnsSelected = [
    {
      title: "Delivery No",
      key: "DELIVERY_NO",
    },
    { key: "GR_QTY", title: "Dispatch Qty" },
    { key: "GRN_DATE", title: "Dispatch Date" },
    { key: "DATEGR_BUDAT", title: "GRN Date" },
    {
      title: "Mfg Plant",
      key: "MFG_PLANT",
    },
    { key: "DEPOT", title: "Depot" },
    { key: "MATERIAL", title: "Material" },
    { key: "MATERIAL_DESC", title: "Material Desc" },
    { key: "DELETE", title: "Delete" },
  ];

  const dateFormat = (data, key, allData) => {
    if (key === "GRN_DATE" || key === "DATEGR_BUDAT")
      return moment(data).format("DD-MM-YYYY");
    if (key === "MATERIAL") return data.replace(/^0+/, "");
    if (key === "DEPOT") {
      return allData.DEPOT + " - " + allData.DEPOT_NAME;
    }
    if (key === "MFG_PLANT") {
      return allData.MFG_PLANT + " - " + allData.MFG_PLANT_NAME;
    }

    return data;
  };

  const fetchRakeDetails = (data, documentData) => {
    props.loading(true);

    setValue("DEPOT", data.DEPOT);

    let IM_DATE_FROM = moment(data.IM_DATE_FROM).format("YYYYMMDD");
    let IM_DATE_TO = moment(data.IM_DATE_TO).format("YYYYMMDD");

    if (!data.DEPOT) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Please select atleast one depot",
      });

      props.loading(false);
      return;
    }

    http
      .post(apis.COMMON_POST_WITH_FM_NAME, {
        fm_name: "ZRFC_RAKE_GRN_REP",
        params: {
          IM_DEPOT: [
            {
              DEPOT: data.DEPOT,
            },
          ],
          IM_DATE_FROM,
          IM_DATE_TO,
        },
      })
      .then((res) => {
        if (res.data.code === 0) {
          checkAlreadyMappedOrNot(res.data.result.IT_DATA);
        }
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => {
        props.loading(false);
      });
  };

  useEffect(() => {
    if (allData.length > 0) {
      if (id) {
        let allCheckbox = document.querySelectorAll(".select-rake");

        let selectedData = documentData.map((item) => item.DELIVERY_NO);

        setSelectedData(selectedData);

        allCheckbox.forEach((item) => {
          if (documentData.find((doc) => doc.DELIVERY_NO === item.value)) {
            item.checked = true;
            item.disabled = true;
          } else {
            item.checked = false;
            item.disabled = false;
          }
        });
      }
    }
  }, [allData, documentData]);

  // select data from table by checkbox
  const selectData = (e, data) => {
    if (e.target.checked) {
      let newData = [];

      newData = [...documentData, data];

      setDocument(newData);
    } else {
      let updatedData = documentData.filter(
        (item) => item.DELIVERY_NO !== data.DELIVERY_NO
      );
      setDocument(updatedData);
    }
  };

  const selectAllData = (e) => {
    if (e.target.checked) {
      setDocument([
        ...documentData,
        ...allData.map((ele) => {
          return {
            ...ele,
            addedBySelectAll: true,
          };
        }),
      ]);

      let allCheckbox = document.querySelectorAll(".select-rake");
      allCheckbox.forEach((item) => {
        item.checked = true;
        item.disabled = true;
      });
    } else {
      setDocument(documentData.filter((ele) => !ele.addedBySelectAll));

      let allCheckbox = document.querySelectorAll(".select-rake");
      allCheckbox.forEach((item) => {
        item.checked = false;
        item.disabled = false;
      });
    }
  };

  useEffect(() => {
    // if (!id) {
    let data = documentData;

    let totalRR = 0;
    data.forEach((item) => {
      totalRR += +item.GR_QTY;
    });
    setValue("RR_QTY", totalRR);
    // }
  }, [documentData]);

  const fetchSDMUsers = async (data) => {
    let allRequests = data.map(async (ele) => {
      const request = await http.post(apis.COMMON_POST_WITH_TABLE_NAME, {
        TABLE: "USER_DEPOT_MAP",
        params: {
          DEPOT: ele.DEPOT,
          USER_TYPE: "8",
        },
      });

      if (request.data.result.length > 0) {
        const newRequest = await http.post(apis.COMMON_POST_WITH_TABLE_NAME, {
          TABLE: "users",
          params: {
            user_code: request.data.result[0].USER_CODE,
          },
        });
        if (newRequest.data.result.length > 0) {
          let user = newRequest.data.result[0];
          return {
            ...ele,
            SDM_DATA: {
              name: user.name,
              email: user.email,
              mobile: user.mobile,
              user_code: user.user_code,
            },
          };
        }
      } else {
        return { ...ele };
      }
    });

    let finalData = await Promise.all(allRequests);

    return finalData;
  };

  const checkAlreadyMappedOrNot = async (data) => {
    try {
      props.loading(true);
      const res = await http.post("/delivery-added-or-not", data);

      if (res.data.result.length > 0) {
        let data = res.data.result;
        let finalData = await fetchSDMUsers(data);
        console.log(finalData);
        setAllData(finalData);
      } else {
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "No Delivery Number found",
        });
      }
    } catch (error) {
      console.log(error);
    } finally {
      props.loading(false);
    }
  };

  const deleteExistingDO = (DO_NUMBER) => {
    let updatedData = documentData.filter(
      (item) => item.DELIVERY_NO !== DO_NUMBER
    );

    setDocument(updatedData);
  };

  const damageDataEntered = () => {
    return RRDetails.DAMAGE_DATA?.length > 0;
  };

  function getCurrentFinancialYear() {
    const today = new Date();
    const currentYear = today.getFullYear();
    const financialYearStartMonth = 4; // Assuming financial year starts in April

    if (today.getMonth() + 1 < financialYearStartMonth) {
      return currentYear - 1 + "-" + currentYear.toString().slice(2);
    } else {
      return currentYear + "-" + (currentYear + 1).toString().slice(2);
    }
  }

  const getDepotForRake = () => {
    const depots = [...allDepot];

    const depotNames = depots.slice(0, 3).map((ele) => ele.DEPOT);
    const depotNamesString = depotNames.join("-");

    return depotNamesString;
  };

  // RR No. Validationand Sub-Box Logic
  const handleRRNoChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, "");

    // hard stop at >9 digits
    if (value.length > 9) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "RR Number must be exactly 9 digits and numeric only",
      });
      return;
    }

    setValue("RR_NO", value);
  };

  // Date of rake completion cannot be prior to date of rake submission Validation
  useEffect(() => {
    const received = watchAllFields.DATE_OF_RAKE_RECEIVED;
    const completion = watchAllFields.DATE_OF_RAKE_COMPLETION;

    if (received && completion) {
      if (moment(completion).isBefore(moment(received))) {
        setValue("DATE_OF_RAKE_COMPLETION", "", {
          shouldValidate: true,
          shouldDirty: true,
        });

        Swal.fire({
          icon: "error",
          title: "Invalid Date",
          text: "Date of Rake Completion cannot be before Date of Rake Received",
        });
      }
    }
  }, [watchAllFields.DATE_OF_RAKE_RECEIVED]);


  return (
    <div
      style={{
        padding: "20px 20px 40px 20px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "20px 20px 40px 20px",
        }}
      >
        <button
          style={{
            border: "none",
            backgroundColor: "transparent",
            color: "green",
            outline: "none",
            fontSize: "1.4rem",
          }}
          onClick={() => {
            history.goBack();
          }}
        >
          <b>&lt;- Back</b>
        </button>
        <h5
          style={{
            textAlign: "center",
            marginBottom: "0px",
          }}
        >
          Rake Handling Data
        </h5>
        <div
          style={{
            width: "100px",
          }}
        ></div>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} id="rake-form">
        <div className="row">
          <div className="col-12 col-md-4">
            <div className="row">
              <div className="col-12">
                <label>
                  Rake No.<span>*</span>
                </label>
              </div>
              <div className="col-12 depot-select">
                <div
                  style={{
                    display: "flex",
                  }}
                >
                  {id ? (
                    <input
                      disabled
                      ref={register({
                        required: true,
                      })}
                      name="RAKE_NO"
                      type="text"
                    />
                  ) : (
                    <>
                      <input
                        disabled
                        value={`${getCurrentFinancialYear()}/${getDepotForRake()}/`}
                        style={{
                          borderRadius: "4px 0px",
                          background: "#fcfcfc",
                          width: "60%",
                          border: "1px solid #ccc",
                        }}
                        ref={register({
                          required: true,
                        })}
                        name="RAKE_NO_PREFIX"
                        type="text"
                      />
                      <input
                        style={{
                          borderLeft: "0px",
                          borderRadius: "0px 4px",
                          width: "40%",
                        }}
                        ref={register({
                          required: true,
                        })}
                        name="RAKE_NO"
                        type="text"
                      />
                    </>
                  )}
                </div>
              </div>
            </div>
            {errors.RAKE_NO && (
              <span style={{ color: "red" }}>This field is required</span>
            )}
          </div>
          <div className="col-12 col-md-4">
            <div className="row">
              <div className="col-12">
                <label>
                  RR No.<span>*</span>
                </label>
              </div>
              <div className="col-12 depot-select">
                {/* <input
                  ref={register({
                    required: true,
                  })}
                  name="RR_NO"
                  disabled={id}
                  type="text"
                />
              </div> */}

                {/* // RR No. Validationand Sub-Box Logic */}
                <div style={{ display: "flex" }}>
                  <input
                    name="RR_NO"
                    type="text"
                    inputMode="numeric"
                    maxLength={9}                          // 🔒 HARD LIMIT
                    disabled={alreadySaved || rrDuplicateError}
                    onChange={handleRRNoChange}     // ✅ LIVE validation
                    ref={register({
                      required: true,
                      pattern: /^[0-9]{9}$/,        // submit-level safety
                    })}
                    style={{
                      width: rrDuplicateError ? "70%" : "100%",
                      borderRadius: rrDuplicateError ? "4px 0 0 4px" : "4px",
                    }}
                  />


                  {rrDuplicateError && (
                    <input
                      ref={register({
                        required: true,
                        maxLength: 1,
                        pattern: /^[A-Za-z@#$%&*]$/, // one letter OR special char
                      })}
                      name="RR_NO_SUFFIX"
                      type="text"
                      maxLength={1}
                      placeholder="@ / A"
                      style={{
                        width: "30%",
                        borderLeft: "0",
                        borderRadius: "0 4px 4px 0",
                      }}
                    />
                  )}
                </div>

              </div>
            </div>
            {errors.RR_NO && (
              <span style={{ color: "red" }}>This field is required</span>
            )}
          </div>

          <div className="col-12 col-md-4">
            <div className="row">
              <div className="col-12">
                <label>
                  RR Quantity<span>*</span>
                </label>
              </div>
              <div className="col-12 depot-select">
                <input
                  ref={register({ required: true })}
                  name="RR_QTY"
                  disabled={damageDataEntered()}
                  type="number"
                  step={".01"}
                />
              </div>
            </div>
          </div>

          <div className="col-12 col-md-4">
            <div className="row">
              <div className="col-12">
                <label>
                  RR Date.<span>*</span>
                </label>
              </div>
              <div className="col-12 depot-select">
                <input
                  ref={register({ required: true })}
                  name="RR_DATE"
                  type="date"
                  defaultValue={moment().format("YYYY-MM-DD")}
                  disabled={damageDataEntered()}
                  max={moment().format("YYYY-MM-DD")}
                  min={moment("01.03.2023", "DD.MM.YYYY").format("YYYY-MM-DD")}
                />
              </div>
            </div>
          </div>

          <div className="col-12 col-md-4">
            <div className="row">
              <div className="col-12">
                <label>
                  RR Type.<span>*</span>
                </label>
              </div>
              <div className="col-12 depot-select">
                <select
                  ref={register({ required: true })}
                  name="RR_TYPE"
                  disabled={damageDataEntered()}
                >
                  <option value="">Select</option>
                  <option value="Full Rake">Full Rake</option>
                  <option value="Mini Rake">Mini Rake</option>
                  <option value="Two Point">Two Point</option>
                </select>
              </div>
            </div>
          </div>

          <div className="col-12 col-md-4">
            <div className="row">
              <div className="col-12">
                <label>
                  Wagon Type<span>*</span>
                </label>
              </div>
              <div className="col-12 depot-select">
                <select
                  ref={register({ required: true })}
                  name="WAGON_TYPE"
                  disabled={damageDataEntered()}
                >
                  <option value="">Select</option>
                  <option value="BCN">BCN</option>
                  <option value="BCNA">BCNA</option>
                  <option value="BCNAHS">BCNAHS</option>
                  <option value="BCN HL">BCN HL</option>
                </select>
              </div>
            </div>
          </div>

          <div className="col-12 col-md-4">
            <div className="row">
              <div className="col-12">
                <label>
                  Handling Party<span>*</span>
                </label>
              </div>
              <input
                type="text"
                hidden
                ref={register}
                name="HANDLING_PARTY_PHONE_NO"
                defaultValue={props.Auth.userdetails.mobile}
              />
              <input
                type="text"
                hidden
                ref={register}
                name="HANDLING_PARTY_CODE"
                defaultValue={props.Auth.userdetails.user_code}
              />

              <div className="col-12 depot-select">
                {id ? (
                  <input
                    type="text"
                    disabled
                    name="HANDLING_PARTY"
                    defaultValue={RRDetails.HANDLING_PARTY}
                  />
                ) : (
                  <select
                    ref={register({ required: true })}
                    name="HANDLING_PARTY"
                    disabled={damageDataEntered()}
                  >
                    <option
                      value={`${localStorage.getItem("user_code")} - ${props.Auth.userdetails.name
                        }`}
                    >
                      {`${localStorage.getItem("user_code")} - ${props.Auth.userdetails.name
                        }`}
                    </option>
                  </select>
                )}
              </div>
            </div>
          </div>

          <div className="col-12 col-md-4">
            <div className="row">
              <div className="col-12">
                <label>
                  Date of Rake Received<span>*</span>
                </label>
              </div>
              <div className="col-12 depot-select">
                <input
                  ref={register({ required: true })}
                  name="DATE_OF_RAKE_RECEIVED"
                  type="date"
                  defaultValue={moment().format("YYYY-MM-DD")}
                  disabled={damageDataEntered()}
                  min={moment(watchAllFields.RR_DATE, "YYYY-MM-DD").format(
                    "YYYY-MM-DD"
                  )}
                />
              </div>
            </div>
          </div>

          <div className="col-12 col-md-4">
            <div className="row">
              <div className="col-12">
                <label>
                  Receive Time<span>*</span>
                </label>
              </div>
              <div className="col-12 depot-select">
                <input
                  ref={register({ required: true })}
                  name="RECEIVE_TIME"
                  type="time"
                  defaultValue={moment().format("HH:mm")}
                  disabled={damageDataEntered()}
                />
              </div>
            </div>
          </div>

          <div className="col-12 col-md-4">
            <div className="row">
              <div className="col-12">
                <label>
                  Date of Rake Completion<span>*</span>
                </label>
              </div>
              <div className="col-12 depot-select">
                <input
                  ref={register({ required: true })}
                  name="DATE_OF_RAKE_COMPLETION"
                  type="date"
                  defaultValue={moment().format("YYYY-MM-DD")}
                  disabled={damageDataEntered()}
                  // min={moment(
                  //   watchAllFields.DATE_OF_RAKE_COMPLETION,
                  //   "YYYY-MM-DD"
                  // ).format("YYYY-MM-DD")}
                  min={watchAllFields.DATE_OF_RAKE_RECEIVED}
                />
              </div>
            </div>
          </div>

          <div className="col-12 col-md-4">
            <div className="row">
              <div className="col-12">
                <label>
                  Completion Time<span>*</span>
                </label>
              </div>
              <div className="col-12 depot-select">
                <input
                  ref={register({ required: true })}
                  name="COMPLETION_TIME"
                  type="time"
                  defaultValue={moment().format("HH:mm")}
                  disabled={damageDataEntered()}
                />
              </div>
            </div>
          </div>

          <div className="col-12 col-md-4">
            <div className="row">
              <div className="col-12">
                <label>
                  Direct Sale from Siding(Qty)<span>*</span>
                </label>
              </div>
              <div className="col-12 depot-select">
                <input
                  ref={register({ required: true })}
                  name="DIRECT_SALE_FROM_SIDING"
                  disabled={damageDataEntered()}
                  type="text"
                />
              </div>
            </div>
          </div>

          <div className="col-12 col-md-4">
            <div className="row">
              <div className="col-12">
                <label>
                  QTY. Shifted to Godown(Qty)<span>*</span>
                </label>
              </div>
              <div className="col-12 depot-select">
                <input
                  ref={register({ required: true })}
                  name="QTY_SHIFTED_TO_GODOWN"
                  disabled={damageDataEntered()}
                  type="text"
                />
              </div>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="row">
              <div className="col-12">
                <label>
                  Wagon in Transit(Qty)<span>*</span>
                </label>
              </div>
              <div className="col-12 depot-select">
                <input
                  ref={register({ required: true })}
                  name="WAGON_TRANSIT"
                  disabled={damageDataEntered()}
                  type="text"
                />
              </div>
            </div>
          </div>
        </div>

        {/* selected Data */}
        <div
          className="table-div"
          style={{ minHeight: "auto", margin: "15px" }}
        >
          <table className="table" style={{ margin: "10px 0" }}>
            <thead>
              <tr>
                {columnsSelected.map((column, index) => (
                  <th key={index}>{column.title}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {documentData.map((ele, i) => (
                <tr key={i}>
                  {columnsSelected.map((column, index) => {
                    if (column.title === "View") {
                      return (
                        <td key={index}>
                          <i
                            className="fas fa-eye"
                            style={{ color: "black", cursor: "pointer" }}
                          ></i>
                        </td>
                      );
                    } else if (
                      column.title === "Delete" &&
                      !damageDataEntered()
                    ) {
                      return (
                        <td key={index}>
                          <img
                            style={{
                              width: "25px",
                              height: "25px",
                              cursor: "pointer",
                            }}
                            onClick={() => {
                              deleteExistingDO(ele.DELIVERY_NO);
                            }}
                            src="/images/delete.png"
                            alt="Delete"
                          />
                        </td>
                      );
                    } else if (column.title === "") {
                      return (
                        <td key={index}>
                          <input
                            type="checkbox"
                            onChange={(e) => {
                              selectData(e, ele);
                            }}
                            value={ele[column.key]}
                            name="selectRake"
                            className="select-rake"
                            id={ele[column.key]}
                          />
                        </td>
                      );
                    } else {
                      return (
                        <td key={index}>
                          {dateFormat(ele[column.key], column.key, ele)}
                        </td>
                      );
                    }
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <br />
        {/* search criteria */}

        {!damageDataEntered() && (
          <div
            style={{
              background: "#c9c9c9",
              margin: "15px",
              borderRadius: "5px",
              padding: "10px",
            }}
          >
            <div className="row">
              <div className="col-12 col-md-4">
                <div className="row">
                  <div className="col-12">
                    <label>
                      Depot<span>*</span>
                    </label>
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
                  </div>
                </div>
              </div>
              <div className="col-12 col-md-3">
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
                        .subtract(15, "day")
                        .format("YYYY-MM-DD")}
                    />
                    {errors.IM_DATE_FROM && (
                      <p className="form-error">
                        Date should be within 31 days
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="col-12 col-md-3">
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
                      <p className="form-error">
                        Date should be within 31 days
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="col-6 col-md-1">
                <div className="row">
                  <div className="col-12">
                    <label> </label>
                  </div>
                  <div className="col-12">
                    <button
                      className="search-button"
                      type="button"
                      onClick={() => fetchRakeDetails(getValues())}
                    >
                      <i className="fas fa-search icons-button"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div
              className="table-div"
              style={{ minHeight: "auto", margin: "15px" }}
            >
              <table className="table" style={{ margin: "10px 0" }}>
                <thead>
                  <tr>
                    {columns.map((column, index) => {
                      if (column.title === "") {
                        return (
                          <td key={column.DELIVERY_NO}>
                            <input
                              type="checkbox"
                              onChange={(e) => {
                                selectAllData(e);
                              }}
                              disabled={allData.length === 0}
                              name="selectRake"
                              key={column.DELIVERY_NO}
                            />
                          </td>
                        );
                      } else {
                        return <th key={column.DELIVERY_NO}>{column.title}</th>;
                      }
                    })}
                  </tr>
                </thead>
                <tbody>
                  {allData.map((ele, i) => (
                    <tr key={i}>
                      {columns.map((column, index) => {
                        if (column.title === "View") {
                          return (
                            <td key={column.DELIVERY_NO}>
                              <i
                                className="fas fa-eye"
                                style={{ color: "black", cursor: "pointer" }}
                              ></i>
                            </td>
                          );
                        } else if (column.title === "") {
                          return (
                            <td key={column.DELIVERY_NO}>
                              <input
                                type="checkbox"
                                onChange={(e) => {
                                  selectData(e, ele);
                                }}
                                value={ele[column.key]}
                                name="selectRake"
                                className="select-rake"
                                id={ele[column.key]}
                                key={ele[column.key]}
                              />
                            </td>
                          );
                        } else {
                          return (
                            <td key={column.DELIVERY_NO}>
                              {dateFormat(ele[column.key], column.key, ele)}
                            </td>
                          );
                        }
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!getUrlParams("view") ? (
          <div className="row">
            <div className="col-12 col-md-12">
              <div className="row">
                <div
                  className="col-12"
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                  }}
                >
                  <button
                    className="goods-button"
                    style={{
                      background: "rgb(15, 111, 162)",
                    }}
                    type="submit"
                  >
                    {alreadySaved ? "Update" : "Save"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </form>
      <ApproveReject id={id} link={"rake-damage-data"} />
    </div>
  );
};

const mapStateToProps = (state) => ({
  Auth: state.Auth,
});

const mapDispatchToProps = {
  loading,
};

export default connect(mapStateToProps, mapDispatchToProps)(RakeHandlingData);
