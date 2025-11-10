import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router";
import { useForm } from "react-hook-form";
import http from "../../services/apicall";
import apis from "../../services/apis";
import { loading } from "../../actions/loadingAction";
import { connect } from "react-redux";
import Swal from "sweetalert2";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Table from "react-bootstrap/Table";
import moment from "moment";
import { Link } from "react-router-dom";
import { getLocalData, setLocalData } from "../../services/localStorage";
import Select from "react-select";

function DeliveryEdit(props) {
  let { id } = useParams();
  const [currentState, setCurrentState] = useState("1");
  const [doDetails, setDoDetails] = useState();
  const [defaultOrderDetails, setDefaultOrderDetails] = useState({});

  const [isStorageLocationModalVisible, setIsStorageLocationModalVisible] =
    useState(false);
  const [isTransporterModalVisible, setIsTransporterModalVisible] =
    useState(false);

  const [selectedStorageLocation, setSelectedStorageLocation] = useState({});
  const [selectedTransporter, setSelectedTransporter] = useState({});

  const [allStorageLocation, setAllStorageLocation] = useState([]);
  const [allLoadingPoints, setAllLoadingPoints] = useState([]);
  //const [allTransporters,setAllTransporters] = useState([]);
  const [allShippingTypes, setAlShippingTypes] = useState([]);

  const [vehicleOptions, setVehicleOptions] = useState([]);
  const [vehicleValue, setVehicleValue] = useState({});

  const [formData, setFormdata] = useState({});

  const [material, setMaterial] = useState(null);
  const [plant, setPlant] = useState(null);
  const [transOptions, setTransOptions] = useState([]);

  const storageLocationRef = useRef(null);
  const transporterRef = useRef(null);

  const [VKORG, setVKORG] = useState("");
  const [shipmentDocument, setShipmentDocument] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    errors,
    setValue,
    triggerValidation,
    reset,
  } = useForm({
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  useEffect(() => {
    if (isStorageLocationModalVisible) {
      storageLocationRef.current.focus();
    }
  }, [isStorageLocationModalVisible]);

  useEffect(() => {
    if (isTransporterModalVisible) {
      transporterRef.current.focus();
    }
  }, [isTransporterModalVisible]);

  //++++++++++++++++++++++++++++++++++++++++++++++searchSysytem storage location+++++++++++++++++++++++++++++++++++++++++++++++++++
  const [storageSearch1, setStorageSearch1] = useState("");
  const [storageSearch2, setStorageSearch2] = useState("");
  const [storageLocationFiltered, setStorageLocationFiltered] = useState([]);

  useEffect(() => {
    if (storageSearch1 !== "" || storageSearch2 !== "") {
      let new_data = allStorageLocation;
      new_data = new_data.filter((ele, j) => {
        if (
          (storageSearch1 !== "" &&
            ele["LGORT"].toLowerCase().includes(storageSearch1)) ||
          (storageSearch2 !== "" &&
            ele["LGOBE"].toLowerCase().includes(storageSearch2))
        ) {
          return ele;
        }
      });
      setStorageLocationFiltered(new_data);
    }
  }, [storageSearch1, storageSearch2]);

  //++++++++++++++++++++++++++++++++++++++++++++++searchSysytem+++++++++++++++++++++++++++++++++++++++++++++++++++
  // TransPorter New Logic

  const fetchTransporter = () => {
    props.loading(true);
    http
      .post(apis.COMMON_POST_WITH_FM_NAME, {
        fm_name: "ZRFC_TRASPORTER_LIST",
        params: { LV_SOLDPARTY: "" },
      })
      .then((res) => {
        if (res.data.status) {
          setLocalData("transporter", res.data.result.IT_FINAL);
          setTransOptions(res.data.result.IT_FINAL);
        }
      })
      .catch((err) => console.log(err))
      .finally(() => props.loading(false));
  };

  useEffect(() => {
    if (getLocalData("transporter")?.length > 0) {
      setTransOptions(getLocalData("transporter"));
    } else {
      fetchTransporter();
    }
  }, []);

  //++++++++++++++++++++++++++++++++++++++++++++++searchSysytem transporter+++++++++++++++++++++++++++++++++++++++++++++++++++
  const [transportersearch, setTransportersearch] = useState("");
  //const [transportersearch2,setTransportersearch2]=useState("");
  const [transporterFiltered, setTransporterFiltered] = useState([]);

  useEffect(() => {
    if (transportersearch !== "") {
      let new_data = transOptions;
      new_data = new_data.filter((ele, j) => {
        if (
          ele["LIFNR"].toLowerCase().includes(transportersearch) ||
          ele["NAME1"].toLowerCase().includes(transportersearch)
        ) {
          return ele;
        }
      });
      setTransporterFiltered(new_data);
    }
  }, [transportersearch]);

  //++++++++++++++++++++++++++++++++++++++++++++++searchSysytem+++++++++++++++++++++++++++++++++++++++++++++++++++

  //+++++++++++++++++++++++++++++++++++++++++++++++++form submit handler++++++++++++++++++++++++++++++++++++++++++
  const onSubmit = (data) => {
    console.log(data);
    //setFinalFormData(data)
    const postData = {
      ...data,
      VEHICLE: vehicleValue.TRUCKNO,
    };
    props.loading(true);
    let body = {
      IM_SALES_ORDER: doDetails.ORDER,
      lv_user: localStorage.getItem("user_code"),
      IM_WERKS: doDetails.SUPPLING_PLANT_ID,
    };
    console.log(body);
    http
      .post(apis.DELIVERY_LOGIN_MATRIX_CHECK, body)
      .then((result) => {
        console.log(result.data);
        if (result.data.status) {
          setCurrentState("2");
          setFormdata(postData);
        } else {
          Swal.fire({
            title: "Error!",
            text: result.data.msg,
            icon: "error",
            confirmButtonText: "Ok",
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

  let setWithValidationTrigger = (key, value) => {
    setValue(key, value);
    triggerValidation(key);
  };

  let openStorageLocationSearchModal = () => {
    setIsStorageLocationModalVisible(true);
    setStorageLocationFiltered(allStorageLocation);
    setStorageSearch1("");
    setStorageSearch2("");
  };

  let openTransporterSearchModal = () => {
    setIsTransporterModalVisible(true);
    setTransporterFiltered([]);
    setTransportersearch("");
  };

  //+++++++++++++++++++++++++++++++++++++++++++++++++form submit handler end++++++++++++++++++++++++++++++++++++++++++

  //++++++++++++++++++++++++++++++++++++++++++++++++++retrive order id on page load and on modal+++++++++++++++++++++++++++++++++++

  //++++++++++++++++++++++++++++++++++++++++++++++++ Fetch Delivery details +++++++++++++++++++++++++
  useEffect(() => {
    props.loading(true);
    http
      .get(`${apis.FETCH_D0_DETAILS}/${id}`)
      .then((result) => {
        console.log("...............", result.data.result);
        setPlant(result.data.result.SUPPLING_PLANT_ID);
        setMaterial(result.data.result.MATERIAL_NO);
        if (result.data.status) {
          setDoDetails(result.data.result);
          setValue("ORDER_TYPE", result.data.result.ORDER_TYPE);
          setValue("ORDER_ID", result.data.result.ORDER);
          setValue(
            "SUPPLYING_PLANT",
            `${result.data.result.SUPPLING_PLANT_ID}-${result.data.result.SUPPLING_PLANT_DESC}`
          );
          setValue(
            "SHIPPING_POINT",
            `${result.data.result.SHIPPING_POINT}-${result.data.result.SHIPPING_POINT_ADDRESS}`
          );
          setValue("STORAGE_LOCATION", `${result.data.result.STORAGE_LOC}`);
          setValue("LR", result.data.result.LR);
          // setValue("VEHICLE", result.data.result.VEHICLE);
          setValue("REMARKS", result.data.result.REMARK);
          setValue(
            "ROUTE",
            `${result.data.result.ROUTE}-${result.data.result.ROUTE_DESC}`
          );
          setValue(
            "MATERIAL",
            `${result.data.result.MATERIAL_NO.replace(/^0+/, "")}-${result.data.result.MATERIAL_NAME
            }`
          );
          //setValue("AVAILABLE_STOCK", result.data.result.AVAIBLE_STOCK);
          setValue("ISSUE_QUANTITY", result.data.result.ISSUE_QTY);
          setValue(
            "TRANSPORTER",
            `${result.data.result.TRANSPOTER_ID.replace(/^0+/, "")}-${result.data.result.TRANSPOTER_NAME
            }`
          );
          //setValue("TRANSPORTATION_ZONE", result.data.result.TRANS_ZONE);
          setValue("LOADING_POINT", result.data.result.LOADING_POINT_ID);
          setValue("SHIPPING_TYPE", result.data.result.SHIP_TYPE_ID);
          setValue("VALUATION_TYPE", result.data.result.VALUATION_TYPE);

          setSelectedTransporter({
            LIFNR: result.data.result.TRANSPOTER_ID,
            NAME1: result.data.result.TRANSPORTER_NAME,
          });
          setSelectedStorageLocation(result.data.result.STORAGE_LOC);

          setVehicleValue({
            TRUCKNO: result.data.result.VEHICLE,
          });

          props.loading(true);
          Promise.all([
            http.post(apis.GET_STORAGE_LOCATIONS, {
              plant: result.data.result.SUPPLING_PLANT_ID,
            }),
            // http.post(apis.GET_LOADING_POINTS, {
            //   shipping_point: result.data.result.SHIPPING_POINT,
            // }),
            http.post(apis.COMMON_POST_WITH_TABLE_NAME, {
              TABLE: "LOADING_POINTS",
              params: {},
            }),
            // http.post(apis.GET_DELIVERY_SPECIFIC_SHIPPING_TYPE, {
            //   supplying_plant: result.data.result.SUPPLING_PLANT_ID,
            //   material: result.data.result.MATERIAL_NO,
            // }),
            http.post(apis.SHIPPING_TYPE_MAINTAINED_TABLE, {
              params: {
                PLANT: defaultOrderDetails.PLANT,
                MATERIAL: defaultOrderDetails.MATERIAL,
              },
            }),

            http.post(apis.COMMON_POST_WITH_FM_NAME, {
              fm_name: "ZRFC_VEHICLES_LIST",
              params: {
                DEPO_CODE: result.data.result.SUPPLING_PLANT_ID,
              },
            }),
          ])
            .then((res) => {
              if (res[0].data.status) {
                setAllStorageLocation(res[0].data.result);
              } else {
                console.log("error....3");
                let msg = res[0].data.msg;
                if (msg.toLowerCase().startsWith("server")) {
                  return null;
                } else {
                  Swal.fire({
                    title: "Error!",
                    text: res[0].data.msg,
                    icon: "error",
                    confirmButtonText: "Ok",
                  });
                }
              }
              if (res[1].data.status) {
                setAllLoadingPoints(res[1].data.result);
              } else {
                console.log("error....3");
                let msg = res[1].data.msg;
                if (msg.toLowerCase().startsWith("server")) {
                  return null;
                } else {
                  Swal.fire({
                    title: "Error!",
                    text: res[1].data.msg,
                    icon: "error",
                    confirmButtonText: "Ok",
                  });
                }
              }
              if (res[2].data.status) {
                // setAlShippingTypes(res[2].data.result);
              } else {
                console.log("error....3");
                let msg = res[2].data.msg;
                if (msg.toLowerCase().startsWith("server")) {
                  return null;
                } else {
                  Swal.fire({
                    title: "Error!",
                    text: res[2].data.msg,
                    icon: "error",
                    confirmButtonText: "Ok",
                  });
                }
              }

              if (res[3].data.status) {
                let data = res[3].data.result.IT_EXPORT.map((ele, i) => ({
                  ...ele,
                  isDisabled: ele.TRKIF === "B",
                }));

                console.log(data);
                setVehicleOptions(data);
              }
            })
            .catch((err) => {
              console.log(err);
            })
            .finally(() => {
              props.loading(false);
            });
        } else {
          let msg = result.data.msg;
          if (msg.toLowerCase().startsWith("server")) {
            return null;
          } else {
            Swal.fire({
              title: "Error!",
              text: result.data.msg,
              icon: "error",
              confirmButtonText: "Ok",
            });
          }
        }
      })
      .catch((err) => {
        console.log(err);
        //handle error
      })
      .finally(() => {
        props.loading(false);
      });
  }, []);

  useEffect(() => {
    if (allLoadingPoints.length > 0) {
      console.log("shipping type loaded");
      if (doDetails) {
        setValue("LOADING_POINT", doDetails.LOADING_POINT_ID);
      }
    }
  }, [allLoadingPoints]);

  useEffect(() => {
    if (allShippingTypes.length > 0) {
      console.log("shipping type loaded");
      if (doDetails) {
        setValue("SHIPPING_TYPE", doDetails.SHIP_TYPE_ID);
      }
    }
  }, [allShippingTypes]);

  //+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++making API call to create delivery++++++++++++++++++++++++++

  let updateDelivery = () => {
    console.log("making api call...");
    props.loading(true);
    console.log();
    let body = {
      IM_LOGIN_ID: localStorage.getItem("user_code"),
      IM_VBELN: id,
      IM_VEHICLE: formData.VEHICLE,
      IM_STROAGE: selectedStorageLocation,
      IM_ISSUE_QTY: formData.ISSUE_QUANTITY,
      IM_LOADING_POINT: formData.LOADING_POINT,
      IM_SHIPPING_TYPE: formData.SHIPPING_TYPE,
      IM_LR: formData.LR,
      IM_TRANSPOTER: selectedTransporter.LIFNR,
      IM_VKORG: VKORG,
      IM_BWTAR: formData.VALUATION_TYPE ? formData.VALUATION_TYPE : "",
      IM_SHIPMENT_CONFORM: shipmentDocument,
      // TDLINE:formData.REMARKS,
      Remarks: [
        {
          TDFORMAT: "*",
          TDLINE: formData.REMARKS,
        },
      ],
    };
    console.log(body);
    http
      .post(apis.UPDATE_DELIVERY, body)
      .then((result) => {
        console.log(result);
        if (result.data.status) {
          console.log(result.data.result);
          setCurrentState("3");
        } else {
          console.log("error....4");
          let msg = result.data.msg;
          if (msg.toLowerCase().startsWith("server")) {
            return null;
          } else {
            Swal.fire({
              title: "Error!",
              text: result.data.msg,
              icon: "error",
              confirmButtonText: "Ok",
            });
          }
        }
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => {
        props.loading(false);
      });
  };

  //++++++++++++++++++++++++++++++++++++++++++++++++ fetching plant dependent and material dependent shipping type+++++++++++
  let fetchShippingType = () => {
    props.loading(true);
    http
      // .post(apis.GET_NEW_SHIPPING_TYPE, {
      //   plant: plant,
      //   material: material,
      // })
      .post(apis.SHIPPING_TYPE_MAINTAINED_TABLE, {
        // TABLE: "SHIPPING_TYPE",
        params: {
          PLANT: plant,
          MATERIAL: material,
        },
      })
      .then((result) => {
        console.log(result.data.data);
        if (result.data.status) {
          // setAlShippingTypes(result.data.data);
          setAlShippingTypes(result.data.result);
        } else {
          let msg = result.data.msg;
          if (msg.toLowerCase().startsWith("server")) {
            return null;
          } else {
            Swal.fire({
              title: "Error!",
              text: result.data.message,
              icon: "error",
              confirmButtonText: "Ok",
            });
          }
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
    if (plant !== null && material !== null) {
      fetchShippingType();
    }
  }, [plant, material]);

  //++++++++++++++++++++++++++++++++++++++++++++++++++fetch AVAILABLE_STOCK +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
  useEffect(() => {
    if (
      // Object.keys(defaultOrderDetails).length > 0 &&
      Object.keys(selectedStorageLocation).length > 0
    ) {
      props.loading(true);
      let p1 = http.post(apis.GET_AVAILABLE_STOCK, {
        supplying_plant: doDetails.SUPPLING_PLANT_ID,
        // storage_location: selectedStorageLocation.LGORT,
        storage_location: selectedStorageLocation,
        material: doDetails.MATERIAL_NO,
      });
      Promise.all([p1])
        .then((res) => {
          if (res[0].data.status) {
            console.log(res[0].data.result);
            setWithValidationTrigger("AVAILABLE_STOCK", res[0].data.result);
          } else {
            console.log("error....4");
            let msg = res[0].data.msg;
            if (msg.toLowerCase().startsWith("server")) {
              return null;
            } else {
              Swal.fire({
                title: "Error!",
                text: res[0].data.msg,
                icon: "error",
                confirmButtonText: "Ok",
              });
            }
          }
        })
        .catch((err) => {
          console.log(err);
        })
        .finally(() => {
          props.loading(false);
        });
    }
  }, [defaultOrderDetails, selectedStorageLocation]);

  return (
    <div>
      {/* Input Form Open */}
      <div>
        <div className="col process-div">
          <div
            id="step-1"
            className={
              "process-button" + (currentState === "1" ? " process-active" : "")
            }
          >
            <span>1</span>
            <span className="process-text">Create</span>
          </div>
          <div className="line-div"></div>
          <div
            id="step-2"
            className={
              "process-button" + (currentState === "2" ? " process-active" : "")
            }
          >
            <span>2</span>
            <span className="process-text">Review</span>
          </div>
          <div className="line-div-2"></div>
          <div
            id="step-3"
            className={
              "process-button" + (currentState === "3" ? " process-active" : "")
            }
          >
            <span>3</span>
            <span className="process-text">Complete</span>
          </div>
        </div>

        <div className={currentState !== "3" ? "row input-area" : "d-none"}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="row">
              <div className="col">
                <label>
                  Delivery No: <span className="id-name">{id}</span>
                </label>
              </div>
            </div>
            <div className="row">
              <div className="col">
                <div className="row">
                  <div className="col-3">
                    <label>
                      Order Type<span>*</span>
                    </label>
                  </div>
                  <div className="col-9">
                    <input
                      ref={register}
                      name="ORDER_TYPE"
                      className="disabled-input"
                      disabled={true}
                    />
                    {errors.ORDER_TYPE && (
                      <p className="form-error">This field is required</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="col">
                <div className="row">
                  <div className="col-3">
                    <label>
                      Order#<span>*</span>
                    </label>
                  </div>
                  <div className="col-9">
                    <input
                      type="text"
                      ref={register}
                      name="ORDER_ID"
                      className="disabled-input"
                      disabled={true}
                    />
                    {errors.ORDER_ID && (
                      <p className="form-error">This field is required</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="col">
                <div className="row">
                  <div className="col-3">
                    <label>
                      Supplying Plant<span>*</span>
                    </label>
                  </div>
                  <div className="col-9">
                    <input
                      type="text"
                      className="disabled-input"
                      ref={register}
                      name="SUPPLYING_PLANT"
                      disabled={true}
                    />
                    {errors.SUPPLYING_PLANT && (
                      <p className="form-error">This field is required</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col">
                <div className="row">
                  <div className="col-3">
                    <label>
                      Shipping Point<span>*</span>
                    </label>
                  </div>
                  <div className="col-9">
                    <input
                      type="text"
                      className="disabled-input"
                      ref={register}
                      name="SHIPPING_POINT"
                      disabled={true}
                    />
                    {errors.SHIPPING_POINT && (
                      <p className="form-error">This field is required</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="col">
                <div className="row">
                  <div className="col-3">
                    <label>
                      Storage Location<span>*</span>
                    </label>
                  </div>
                  <div className="col-9">
                    <div
                    // onClick={() => {
                    //   if (currentState === "1") {
                    //     openStorageLocationSearchModal();
                    //   }
                    // }}
                    >
                      {/* <i className="far fa-clone click-icons"></i> */}
                    </div>
                    <input
                      type="text"
                      ref={register}
                      name="STORAGE_LOCATION"
                      onChange={(e) => {
                        e.target.value.length > 3
                          ? setSelectedStorageLocation(e.target.value)
                          : console.log(e.target.value);
                        setStorageSearch1(e.target.value);
                        setWithValidationTrigger(
                          "STORAGE_LOCATION",
                          e.target.value
                        );
                      }}
                    //   value={storageSearch1}
                    />
                    {errors.STORAGE_LOCATION && (
                      <p className="form-error">This field is required</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="col">
                <div className="row">
                  <div className="col-3">
                    <label>LR#</label>
                  </div>
                  <div className="col-9">
                    <input
                      type="text"
                      ref={register}
                      name="LR"
                      disabled={currentState === "2"}
                    />
                    {/* {errors.LR && (
                      <p className="form-error">This field is required</p>
                    )} */}
                  </div>
                </div>
              </div>
            </div>

            <div className="divider"></div>

            <div className="row">
              <div className="col">
                <div className="row">
                  <div className="col-3">
                    <label>
                      Vehicle<span>*</span>
                    </label>
                  </div>
                  <div className="col-9">
                    <i className="fas fa-angle-down icons"></i>
                    <Select
                      classNamePrefix="react-select"
                      value={
                        Object.keys(vehicleValue).length > 0 ? vehicleValue : []
                      }
                      options={vehicleOptions}
                      name="Vehicle"
                      cacheOptions
                      defaultOptions
                      placeholder={"Select Vehicle"}
                      onChange={(e) => {
                        console.log(e);
                        setValue("VEHICLE", e.TRUCKNO);
                        setVehicleValue(e);
                      }}
                      getOptionLabel={(ele) => `${ele.TRUCKNO}`}
                      getOptionValue={(ele) => ele.TRUCKNO}
                    />

                    {errors.VEHICLE && (
                      <p className="form-error">This field is required</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="col">
                <div className="row">
                  <div className="col-3">
                    <label>Route</label>
                  </div>
                  <div className="col-9">
                    <input
                      type="text"
                      className="disabled-input"
                      ref={register}
                      name="ROUTE"
                      disabled={true}
                    />
                    {errors.ROUTE && (
                      <p className="form-error">This field is required</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="col">
                <div className="row">
                  <div className="col-3">
                    <label>Material</label>
                  </div>
                  <div className="col-9">
                    <input
                      type="text"
                      className="disabled-input"
                      ref={register}
                      name="MATERIAL"
                      disabled={true}
                    />
                    {errors.MATERIAL && (
                      <p className="form-error">This field is required</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col">
                <div className="row">
                  <div className="col-3">
                    <label>Available Stock</label>
                  </div>
                  <div className="col-9">
                    <input
                      type="text"
                      className="quan-input disabled-input"
                      ref={register({
                        required: true,
                      })}
                      name="AVAILABLE_STOCK"
                      disabled={true}
                    />
                    {errors.AVAILABLE_STOCK && (
                      <p className="form-error">This field is required</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="col">
                <div className="row">
                  <div className="col-3">
                    <label>
                      Issue Qty(MT)<span>*</span>
                    </label>
                  </div>
                  <div className="col-9">
                    <input
                      step="any"
                      type="number"
                      name="ISSUE_QUANTITY"
                      className="quan-input"
                      disabled={currentState === "2"}
                      ref={register}
                    />
                    {errors.ISSUE_QUANTITY && (
                      <p className="form-error">
                        This value should be less than or equal to{" "}
                        {defaultOrderDetails.ISSUE_QTY}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {VKORG === "RECL" ? (
                <div className="col">
                  <div className="row">
                    <div className="col-8">
                      <label>Create Shipment Document</label>
                    </div>
                    <div className="col-4">
                      <select
                        onChange={(e) => setShipmentDocument(e.target.value)}
                      >
                        <option value="Y">Y - Yes</option>
                        <option value="N">N - No</option>
                      </select>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="divider"></div>

            <div className="row">
              {/* <div className="col">
                <div className="row">
                  <div className="col-4">
                    <label>
                      Delivery Date<span>*</span>
                    </label>
                  </div>
                  <div className="col-8">
                    <input
                      type="date"
                      className="po-input"
                      name="CHALLAN_DATE"
                      ref={register({
                        required: true,
                      })}
                      disabled={true}
                      defaultValue={moment().format("YYYY-MM-DD")}
                    />
                    {errors.CHALLAN_DATE && (
                      <p className="form-error">This field is required</p>
                    )}
                  </div>
                </div>
              </div> */}
              <div className="col">
                <div className="row">
                  <div className="col-4">
                    <label>
                      Delivery Date<span>*</span>
                    </label>
                  </div>
                  <div className="col-8">
                    <input
                      type="date"
                      className="po-input"
                      name="CHALLAN_DATE"
                      ref={register({
                        required: true,
                      })}
                      disabled={true}
                      defaultValue={moment().format("YYYY-MM-DD")}
                    />
                    {errors.CHALLAN_DATE && (
                      <p className="form-error">This field is required</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="col">
                <div className="row">
                  <div className="col-4">
                    <label>Loading point</label>
                  </div>
                  <div className="col-8">
                    <i className="fas fa-angle-down icons"></i>
                    <select
                      className="sales-select"
                      ref={register}
                      name="LOADING_POINT"
                      disabled={currentState === "2"}
                    >
                      {allLoadingPoints.map((ele, i) => (
                        <option
                          key={i}
                          value={ele.LSTEL}
                        >{`${ele.LSTEL}-${ele.VTEXT}`}</option>
                      ))}
                    </select>
                    {errors.LOADING_POINT && (
                      <p className="form-error">This field is required</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="col">
                <div className="row">
                  <div className="col-3">
                    <label>
                      Transporter<span>*</span>
                    </label>
                  </div>
                  <div className="col-9">
                    <div
                      onClick={() => {
                        if (currentState === "1") {
                          //open modal
                          openTransporterSearchModal(true);
                        }
                      }}
                    >
                      <i className="far fa-clone click-icons"></i>
                      <input
                        type="text"
                        ref={register}
                        name="TRANSPORTER"
                        disabled={true}
                      />
                      {errors.TRANSPORTER && (
                        <p className="form-error">This field is required</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="row">
              {/* <div className="col">
                <div className="row">
                  <div className="col-3">
                    <label>Transportation Zone</label>
                  </div>
                  <div className="col-9">
                    <input
                      type="text"
                      className="disabled-input"
                      ref={register({
                        required: true,
                      })}
                      name="TRANSPORTATION_ZONE"
                      disabled={true}
                    />
                    {errors.TRANSPORTATION_ZONE && (
                      <p className="form-error">This field is required</p>
                    )}
                  </div>
                </div>
              </div> */}

              <div className="col">
                <div className="row">
                  <div className="col-3">
                    <label>Shipping Type</label>
                  </div>
                  <div className="col-9">
                    <i className="fas fa-angle-down icons"></i>
                    <select
                      ref={register}
                      name="SHIPPING_TYPE"
                      disabled={currentState === "2"}
                    >
                      {allShippingTypes.map((ele, i) => (
                        <option key={i} value={ele.VSART}>
                          {ele.VSART}-{ele.BEZEI}
                        </option>
                      ))}
                    </select>
                    {errors.SHIPPING_TYPE && (
                      <p className="form-error">This field is required</p>
                    )}
                  </div>
                </div>
              </div>

              {console.log(doDetails?.VKORG)}
              {doDetails?.VKORG?.toUpperCase() === "RECL" && (
                <div className="col">
                  <div className="row">
                    <div className="col-3">
                      <label>Valuation Type</label>
                    </div>
                    <div className="col-9">
                      <input
                        ref={register({
                          required: true,
                        })}
                        name="VALUATION_TYPE"
                        className="disabled-input"
                        disabled={true}
                        value={doDetails?.VALUATION_TYPE || ""}
                        readOnly
                      />
                      {errors.VALUATION_TYPE && (
                        <p className="form-error">This field is required</p>
                      )}
                    </div>
                  </div>
                </div>
              )}



            </div>


            <div className="row">
              <div className="col">
                <div className="row">
                  <div className="col-1">
                    <label>Remarks</label>
                  </div>
                  <div className="col-11">
                    <input
                      className="remarks"
                      type="text-area"
                      name="REMARKS"
                      ref={register}
                      disabled={currentState === "2"}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="divider"></div>
            <div className="button-div">
              {currentState === "2" ? (
                <React.Fragment>
                  <button
                    type="button"
                    className="button button-back"
                    onClick={(e) => setCurrentState("1")}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    className="button button-foreword"
                    onClick={updateDelivery}
                  >
                    Save
                  </button>
                </React.Fragment>
              ) : (
                <React.Fragment>
                  <Link to="/dashboard/delivery/list">
                    <button className="button button" style={{ color: "#" }}>
                      Back to Delivery List
                    </button>
                  </Link>
                  <button className="button button-foreword" type="submit">
                    Next
                  </button>
                </React.Fragment>
              )}
            </div>
          </form>
        </div>

        <div className={currentState === "3" ? "row input-area" : "d-none"}>
          <img className="success-img" src="/images/success_tick.jpeg" />
          <span className="success-msg">
            &nbsp;&nbsp; Delivery no <span className="id-name">{id}</span>{" "}
            updated successfully.
          </span>
        </div>
      </div>

      {/* storage location modal */}
      <Modal
        show={isStorageLocationModalVisible}
        size="lg"
        centered
        className="modal"
        onHide={() => setIsStorageLocationModalVisible(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>Select storage location</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="input-area-modal">
            Location Number
            <input
              type="text"
              className="model-input"
              onChange={(e) => {
                setStorageSearch1(e.target.value.toLowerCase());
              }}
              value={storageSearch1}
              ref={storageLocationRef}
            />
            Location Name
            <input
              type="text"
              className="model-input"
              onChange={(e) => {
                setStorageSearch2(e.target.value.toLowerCase());
              }}
              value={storageSearch2}
            />
          </div>
          <div className="modal-div">
            <Table size="sm" className="modal-table">
              <thead className="modal-thead">
                <tr className="modal-table-tr">
                  <th className="modal-table-th float-center">
                    Location Number
                  </th>
                  <th className="modal-table-th float-center">Location Name</th>
                  <th className="modal-table-th float-center">Select</th>
                </tr>
              </thead>
              <tbody className="modal-table-tbody">
                {storageLocationFiltered?.map((row, i) => (
                  <tr className="modal-table-tr" key={i}>
                    <td>{row["LGORT"].replace(/^0+/, "")}</td>
                    <td>{row["LGOBE"]}</td>
                    <td className="modal-table-td">
                      <button
                        className="button search-button"
                        onClick={() => {
                          setSelectedStorageLocation(row.LGORT);
                          setWithValidationTrigger(
                            "STORAGE_LOCATION",
                            row["LGORT"].replace(/^0+/, "") + "-" + row["LGOBE"]
                          );
                          setIsStorageLocationModalVisible(false);
                        }}
                      >
                        select
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Modal.Body>
        <Modal.Footer className="modal-footer">
          <Button
            className="button modal-button"
            onClick={() => setIsStorageLocationModalVisible(false)}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>
      {/* storage location modal close*/}

      {/* Transporter modal */}
      <Modal
        show={isTransporterModalVisible}
        size="lg"
        centered
        className="modal"
        onHide={() => setIsTransporterModalVisible(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>Select transporter</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="input-area-modal">
            Transporter code or Transporter Description
            <input
              type="text"
              className="model-input"
              onChange={(e) => {
                setTransportersearch(e.target.value.toLowerCase());
              }}
              value={transportersearch}
              ref={transporterRef}
            />
          </div>
          <div className="modal-div">
            <Table size="sm" className="modal-table">
              <thead className="modal-thead">
                <tr className="modal-table-tr">
                  <th className="modal-table-th float-center">
                    Transporter code
                  </th>
                  <th className="modal-table-th float-center">
                    Transporter Description
                  </th>
                  <th className="modal-table-th float-center">City</th>
                  <th className="modal-table-th float-center">District</th>
                  <th className="modal-table-th float-center">Select</th>
                </tr>
              </thead>
              <tbody className="modal-table-tbody">
                {transporterFiltered?.map((row, i) => (
                  <tr className="modal-table-tr" key={i}>
                    <td>{row["LIFNR"].replace(/^0+/, "")}</td>
                    <td>{row["NAME1"]}</td>
                    <td>{row["ORT01"]}</td>
                    <td>{row["ORT02"]}</td>
                    <td className="modal-table-td">
                      <button
                        className="button search-button"
                        onClick={() => {
                          setSelectedTransporter(row);
                          setWithValidationTrigger(
                            "TRANSPORTER",
                            row["LIFNR"].replace(/^0+/, "") + "-" + row["NAME1"]
                          );
                          setIsTransporterModalVisible(false);
                        }}
                      >
                        select
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Modal.Body>
        <Modal.Footer className="modal-footer">
          <Button
            className="button modal-button"
            onClick={() => setIsStorageLocationModalVisible(false)}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>
      {/* storage location modal close*/}
    </div>
  );
}

const mapStateToProps = (state) => ({
  Auth: state.Auth,
});

export default connect(mapStateToProps, { loading })(DeliveryEdit);
