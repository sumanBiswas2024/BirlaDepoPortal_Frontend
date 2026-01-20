import React, { useState, useEffect, useRef, useMemo } from "react";
import { useLocation } from "react-router";
import { useForm } from "react-hook-form";
import ConfirmDialog from "../dashboard/ConfirmDialogue";
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
import { v4 as uuidv4 } from "uuid";
import Select from "react-select";
import { getLocalData, setLocalData } from "../../services/localStorage";
import DONewRFC from "./DORFC";

const queryString = require("query-string");

function DeliveryCreate(props) {
  const [currentState, setCurrentState] = useState("1");
  const [showFormResetDialog, setShowFormResetDialog] = useState(false);
  const [isOrderIdModalVisible, setIsOrderIdModalVisible] = useState(false);
  const [isStorageLocationModalVisible, setIsStorageLocationModalVisible] =
    useState(false);
  const [isTransporterModalVisible, setIsTransporterModalVisible] =
    useState(false);

  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [defaultOrderDetails, setDefaultOrderDetails] = useState({});
  const [selectedStorageLocation, setSelectedStorageLocation] = useState({});
  const [selectedTransporter, setSelectedTransporter] = useState({});

  const [allOrdertype, setAllOrderTypes] = useState([]);
  const [allStorageLocation, setAllStorageLocation] = useState([]);
  const [allLoadingPoints, setAllLoadingPoints] = useState([]);
  //const [allTransporters,setAllTransporters] = useState([]);
  const [allShippingTypes, setAlShippingTypes] = useState([]);

  const [formData, setFormdata] = useState({});
  const [createdDelivery, setCreatedDelivery] = useState("");
  const [material, setMaterial] = useState(null);
  const [plant, setPlant] = useState(null);
  const [VKORG, setVKORG] = useState("");
  const [shipmentDocument, setShipmentDocument] = useState("Y");
  const [valuationTypes, setValuationTypes] = useState([]);
  const [value, setval] = useState([]);
  const [deliveryStatus, setDeliveryStatus] = useState([]);
  const [transOptions, setTransOptions] = useState([]);
  const [vehicleOptions, setVehicleOptions] = useState([]);
  const [vehicleValue, setVehicleValue] = useState({});

  const [valuationTypesMaster, setValuationTypesMaster] = useState([]); // Date: 15/01/2025 Valuation Type New Tab Requirement

  let location = useLocation();
  const orderIdInputBox = useRef(null);
  const storageLocationRef = useRef(null);
  const transporterRef = useRef(null);
  const {
    register,
    handleSubmit,
    watch,
    errors,
    setValue,
    triggerValidation,
    reset,
    getValues,
  } = useForm({
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const watchAllFields = watch();

  useEffect(() => {
    if (isOrderIdModalVisible) {
      orderIdInputBox.current.focus();
    }
  }, [isOrderIdModalVisible]);

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
    //setFinalFormData(data)

    const postData = {
      ...data,
      VEHICLE: vehicleValue.TRUCKNO,
    };
    // if (!checkVehicleNumber(data.VEHICLE)) {
    //   Swal.fire({
    //     title: "Error!",
    //     text: "Invalid vehicle number.",
    //     icon: "error",
    //     confirmButtonText: "Ok",
    //   });
    //   return;
    // }
    console.log(data, postData);

    if (
      Object.keys(value).length === 0 ||
      Object.keys(vehicleValue).length === 0
    ) {
      Swal.fire({
        title: "Fill all the mandatory filed",
        icon: "error",
      });
    } else {
      props.loading(true);
      http
        .post(apis.DELIVERY_LOGIN_MATRIX_CHECK, {
          IM_SALES_ORDER: selectedOrderId,
          lv_user: localStorage.getItem("user_code"),
          IM_WERKS: defaultOrderDetails.PLANT,
        })
        .then((result) => {
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
    }
  };

  let setWithValidationTrigger = (key, value) => {
    setValue(key, value);
    triggerValidation(key);
  };

  let openTransporterSearchModal = () => {
    setIsTransporterModalVisible(true);
    setTransporterFiltered([]);
    setTransportersearch("");
  };
  //+++++++++++++++++++++++++++++++++++++++++++++++++form submit handler end++++++++++++++++++++++++++++++++++++++++++

  //++++++++++++++++++++++++++++++++++++++++++++++++++retrive order id on page load and on modal+++++++++++++++++++++++++++++++++++
  useEffect(() => {
    const parsed = queryString.parse(location.search);
    setSelectedOrderId(parsed.orderid || "none");
  }, []);

  let getUserIdFromModal = () => {
    let newId = orderIdInputBox.current.value;
    if (newId) {
      let newUrl =
        window.location.protocol +
        "//" +
        window.location.hostname +
        (window.location.port ? ":" + window.location.port : "") +
        location.pathname +
        "?orderid=" +
        newId;
      window.location.href = newUrl;
    }
  };

  let newEntry = () => {
    let newUrl =
      window.location.protocol +
      "//" +
      window.location.hostname +
      (window.location.port ? ":" + window.location.port : "") +
      location.pathname;
    window.location.href = newUrl;
  };

  //++++++++++++++++++++++++++++++++++++++++++++++++retrive order id on page load ends++++++++++++++++++++++++++++++

  //+++++++++++++++++++++++++++++++++++++++++++++++++fetch order details on orde id change+++++++++++++++++++++++++++++++++++++++++++++++
  let fetchOrderdetails = () => {
    props.loading(true);
    http
      .post(apis.GET_ORDER_DETAILS, { order_id: selectedOrderId })
      .then((res) => {
        setPlant(res.data.result.PLANT);
        setMaterial(res.data.result.MATERIAL);

        console.log(res.data);
        if (res.data.status) {
          if (res.data.result.ORDER_TYPE === "ZNO2") {
            Swal.fire({
              title: "Can not create Delivery for Order Type ZN02",
              icon: "error",
            }).then(() => newEntry());
          }
          setDefaultOrderDetails(res.data.result);
          setWithValidationTrigger("ORDER_ID", selectedOrderId);
          setValue("ORDER_TYPE", res.data.result.ORDER_TYPE);
          setWithValidationTrigger(
            "SUPPLYING_PLANT",
            `${res.data.result.PLANT}-${res.data.result.PLANT_DESC}`
          );
          setWithValidationTrigger(
            "SHIPPING_POINT",
            `${res.data.result.SHIPPING_POINT}-${res.data.result.SHP_POINT_DESC}`
          );
          setWithValidationTrigger("ROUTE", res.data.result.ROUTE);
          setWithValidationTrigger(
            "MATERIAL",
            `${res.data.result.MATERIAL.replace(/^0+/, "")}-${
              res.data.result.MATERIAL_DESC
            }`
          );
          setWithValidationTrigger("ISSUE_QUANTITY", res.data.result.ISSUE_QTY);
          setWithValidationTrigger(
            "TRANSPORTATION_ZONE",
            `${res.data.result.TRANSPORT_ZONE}-${res.data.result.TSPORT_ZONE_DESC}`
          );
          setVKORG(res.data.result.VKORG);
        } else {
          console.log("error....1");
          let msg = res.data.msg;
          if (msg.toLowerCase().startsWith("server")) {
            return null;
          } else {
            Swal.fire({
              title: "Error!",
              text: res.data.msg,
              icon: "error",
              confirmButtonText: "Ok",
            }).then((result) => {
              setIsOrderIdModalVisible(true);
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
  };

  useEffect(() => {
    if (selectedOrderId === "none") {
      setIsOrderIdModalVisible(true);
    } else if (selectedOrderId) {
      fetchOrderdetails();
    }
  }, [selectedOrderId]);
  //++++++++++++++++++++++++++++++++++++++++++++++++++fetch order details on orde id change end+++++++++++++++++++++++++++++++++++

  //+++++++++++++++++++++++++++++++++++++++++++++++++++fetching few data on form load++++++++++++++++++++++++++++++++++++++++
  useEffect(() => {
    props.loading(true);
    // let p1 = http.post(apis.GET_ORDER_TYPES_FOR_DELIVERY_CREATE, {
    //   vbeln: 1234567899,
    // });
    // Promise.all([p1])
    //   .then((res) => {
    //     //console.log(res[1].data);
    //     if (res[0].data.status) {
    //       setAllOrderTypes(res[0].data.result.IT_FINAL);
    //     } else {
    //       console.log("error....2");
    //       let msg = res[0].data.msg;
    //       if (msg.toLowerCase().startsWith("server")) {
    //         return null;
    //       } else {
    //         Swal.fire({
    //           title: "Error!",
    //           text: res[0].data.msg,
    //           icon: "error",
    //           confirmButtonText: "Ok",
    //         });
    //       }
    //     }
    //   })
    //   .catch((err) => {
    //     console.log(err);
    //   })
    //   .finally(() => {
    //     props.loading(false);
    //   });
    http
      .post(apis.COMMON_POST_WITH_TABLE_NAME, {
        TABLE: "ORDER_TYPE",
        params: { TYPE: "DO" },
      })
      .then((res) => {
        if (res.data.status) {
          setAllOrderTypes(res.data.result);
        } else {
          console.log("Error");
        }
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => {
        props.loading(false);
      });
  }, []);

  useEffect(() => {
    if (allOrdertype.length > 0) {
      if (Object.keys(defaultOrderDetails).length > 0) {
        setValue("ORDER_TYPE", defaultOrderDetails.ORDER_TYPE);
      }
    }
  }, [allOrdertype]);

  useEffect(() => {
    if (allShippingTypes.length > 0) {
      if (Object.keys(defaultOrderDetails).length > 0) {
        setValue("SHIPPING_TYPE", defaultOrderDetails.VSART);
      }
    }
  }, [allShippingTypes]);
  //+++++++++++++++++++++++++++++++++++++++++++++++++++fetching few data on form load++++++++++++++++++++++++++++++++++++++++

  //+++++++++++++++++++++++++++++++++++++++++++++++++++fetch data after getting order details+++++++++++++++++++++++++++++++
  useEffect(() => {
    if (Object.keys(defaultOrderDetails).length > 0) {
      props.loading(true);
      let p1 = http.post(apis.GET_STORAGE_LOCATIONS, {
        plant: defaultOrderDetails.PLANT,
      });
      // let p2 = http.post(apis.GET_LOADING_POINTS, {
      //   shipping_point: defaultOrderDetails.SHIPPING_POINT,
      // });

      let p2 = http.post(apis.COMMON_POST_WITH_TABLE_NAME, {
        TABLE: "LOADING_POINTS",
        params: {},
      });

      // let p3 = http.post(apis.GET_DELIVERY_SPECIFIC_SHIPPING_TYPE, {
      //   supplying_plant: defaultOrderDetails.PLANT,
      //   material: defaultOrderDetails.MATERIAL,
      // });

      let p3 = http.post(apis.SHIPPING_TYPE_MAINTAINED_TABLE, {
        params: {
          PLANT: defaultOrderDetails.PLANT,
          MATERIAL: defaultOrderDetails.MATERIAL,
        },
      });

      let p4 = http.post(apis.COMMON_POST_WITH_FM_NAME, {
        fm_name: "ZRFC_VEHICLES_LIST",
        params: {
          DEPO_CODE: defaultOrderDetails.PLANT,
        },
      });

      // let p4 = http.post(apis.GET_TRANSPORTERS,{
      //     sold_to_party : defaultOrderDetails.SOLD_TO_PARTY,
      //     ship_to_party:defaultOrderDetails.SHIP_TO_PARTY
      // })
      Promise.all([p1, p2, p3, p4])
        .then((res) => {
          //console.log(res[2].data)
          if (res[0].data.status) {
            //console.log(res[1].data.result)
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
            //console.log(res[1].data.result)
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
            //console.log(res[1].data.result)
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
            console.log(res[3].data.result);
            let data = res[3].data.result.IT_EXPORT.map((ele, i) => ({
              ...ele,
              isDisabled: ele.TRKIF === "B",
            }));
            setVehicleOptions(data);
          }
        })
        .catch((err) => {
          console.log(err);
        })
        .finally(() => {
          props.loading(false);
        });
    }
  }, [defaultOrderDetails]);

  //+++++++++++++++++++++++++++++++++++++++++++++++++++fetch data of valuation type +++++++++++++++++++++++++++++++
  useEffect(() => {
    if (defaultOrderDetails?.MATERIAL && defaultOrderDetails?.PLANT) {
      props.loading(true);
      http
        .post(apis.GET_VALUATION_TYPES, {
          IM_MATNR: defaultOrderDetails.MATERIAL,
          IM_WERKS: defaultOrderDetails.PLANT,
        })
        .then((res) => {
          if (res.data?.status === true || res.data?.status === "SUCCESS") {
            console.log("Valuation Types:", res.data.result.IT_BWTAR);
            setValuationTypes(res.data.result.IT_BWTAR || []);
          } else {
            const msg = res.data?.msg || "Unknown error";
            if (!msg.toLowerCase().startsWith("server")) {
              Swal.fire({
                title: "Error!",
                text: msg,
                icon: "error",
                confirmButtonText: "Ok",
              });
            } else {
              console.log("Server-side error:", msg);
            }
          }
        })
        .catch((err) => {
          console.error("Error fetching valuation types:", err);
        })
        .finally(() => {
          props.loading(false);
        });
    }
  }, [defaultOrderDetails]);

  //+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

  useEffect(() => {
    if (plant !== null && material !== null) {
      fetchShippingType();
    }
  }, [plant, material]);

  //++++++++++++++++++++++++++++++++++++++++++++++++++fetch AVAILABLE_STOCK +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
  useEffect(() => {
    if (
      Object.keys(defaultOrderDetails).length > 0 &&
      Object.keys(selectedStorageLocation).length > 0
    ) {
      props.loading(true);
      let p1 = http.post(apis.GET_AVAILABLE_STOCK, {
        supplying_plant: defaultOrderDetails.PLANT,
        // storage_location: selectedStorageLocation.LGORT,
        storage_location: selectedStorageLocation,
        material: defaultOrderDetails.MATERIAL,
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

  //++++++++++++++++  check vehicle number is valid or not ++++++++++++++++++++++++++++//
  const checkVehicleNumber = (vehicleNumber) => {
    // minimum 8 digit
    // maximum 11 digit
    // space not allowed
    // special character not allowed
    // first 2 digit should be alphabets
    // next 2 digit should be numeric
    // last 4 digit should be numeric

    let regex = /^[a-zA-Z]{2}[0-9]{2}[a-zA-z0-9]{0,3}[0-9]{4}$/;

    console.log(regex.test(vehicleNumber));

    if (regex.test(vehicleNumber)) {
      return true;
    } else {
      return false;
    }
  };

  //+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++making API call to create delivery++++++++++++++++++++++++++

  let createDelivery = async () => {
    let UUID = uuidv4();
    console.log("making api call...");
    localStorage.setItem("deliveryUUID", UUID);

    let body = {
      vehicle: formData.VEHICLE,
      challan_date: formData.CHALLAN_DATE.split("-").join(""),
      remark: formData.REMARKS,
      order_id: formData.ORDER_ID,
      storage_location: selectedStorageLocation.toUpperCase(),
      route: formData.ROUTE,
      issue_quantity: formData.ISSUE_QUANTITY,
      loading_point: formData.LOADING_POINT,
      shipping_type: formData.SHIPPING_TYPE,
      lr: formData.LR,
      transporter: value?.LIFNR,
      IM_LOGIN_ID: localStorage.getItem("user_code"),
      IM_VKORG: VKORG,
      IM_SHIPMENT_CONFIRM: shipmentDocument,
      IM_BWTAR: formData.VALUATION_TYPE
        ? formData.VALUATION_TYPE.toUpperCase()
        : "",
      IM_GUID: UUID,
    };

    console.log(body);

    let vehicle = body.vehicle;
    let challan_date = body.challan_date;
    let remark = body.remark;
    let order_id = body.order_id;
    let storage_location = body.storage_location;
    let route = body.route;
    let issue_quantity = body.issue_quantity;
    let loading_point = body.loading_point;
    let shipping_type = body.shipping_type;
    let login_id = body.IM_LOGIN_ID;
    let lr = body.lr;
    let transporter = body.transporter;
    let vkorg = "";
    if (body.IM_VKORG) {
      vkorg = body.IM_VKORG;
    }

    let postData = {
      IM_VEHICLE: vehicle,
      IM_CHALLAN_DATE: challan_date,
      LINES: [
        {
          TDFORMAT: "*",
          TDLINE: remark,
        },
      ],
      IM_SALES_ORDER: order_id,
      IM_STOREAGE_LOC: storage_location,
      IM_ROUTE: route,
      IM_DELIVERY_QTY: issue_quantity,
      IM_LOADING_POINT: loading_point,
      IM_SHIPPING_TYPE: shipping_type,
      IM_LR: lr,
      IM_TRANSPORTER: transporter,
      IM_LOGIN_ID: login_id,
      IM_SHIPMENT_CONFIRM: body.IM_SHIPMENT_CONFIRM,
      IM_VKORG: vkorg,
      IM_BWTAR: body.IM_BWTAR,
      IM_GUID: body.IM_GUID,
    };
    console.log(postData);

    try {
      props.loading(true);

      const res = await DONewRFC(postData);

      console.log(res);
      if (res.DO_NUMBER) {
        setCreatedDelivery(res.DO_NUMBER);
        setCurrentState("3");
      } else {
        let errmsg = res.DATA.filter((e) => e.TYPE === "E" || e.TYPE === "I");

        let msg = "";

        errmsg.forEach((element, i) => {
          msg += `<p>${i + 1}. ${element.MESSAGE} </p>`;
        });
        Swal.fire({
          title: "Error!",
          html: msg,
          icon: "error",
          confirmButtonText: "Ok",
        });
      }
    } catch (error) {
    } finally {
      console.log("Finished");
      props.loading(false);
    }

    // http
    //   .post(apis.CREATE_DELIVERY, body)
    //   .then((result) => {
    //     console.log(result);
    //     if (result.data.status) {
    //       setCreatedDelivery(result.data.result);
    //       setCurrentState("3");
    //     } else {
    //       let msg = "";
    //       result.data.msg.forEach((element, i) => {
    //         msg += `<p>${i + 1}. ${element.MESSAGE} </p>`;
    //       });
    //       Swal.fire({
    //         title: "Error!",
    //         html: msg,
    //         icon: "error",
    //         confirmButtonText: "Ok",
    //       });
    //     }
    //   })
    //   .catch((err) => {
    //     console.log(err);
    //     fetchStatus();
    //   })
    //   .finally(() => {
    //     props.loading(false);
    //   });
  };

  // Sleep function
  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  //+++++++++++++++++++++++++ Fetch Status of sales order ++++++++++++++++++++++++++//

  let fetchStatus = async () => {
    try {
      props.loading(true);
      const data = await http.post(apis.COMMON_POST_WITH_FM_NAME, {
        fm_name: "ZSALES_ORDER_STATUS",
        params: { IM_GUID: localStorage.getItem("deliveryUUID") },
      });

      if (data.data.result?.IM_GUID) {
        if (data.data.result?.EX_STATUS === "P") {
          await sleep(2000);
          fetchStatus();
        } else {
          setDeliveryStatus(data.data.result);
          setCurrentState("3");
          localStorage.removeItem("deliveryUUID");
        }
      }
    } catch (error) {
      fetchStatus();
    } finally {
      props.loading(false);
    }
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

  const loadOptions = async (inputValue) => {
    if (inputValue !== "") {
      return await fetchTransporter(inputValue, "LIFNR", "NAME1");
    }
  };

  const handleInputChange = (newValue) => {
    const inputValue = newValue.replace(/\W/g, "");
    return inputValue;
  };

  const handleChange = (value2) => {
    // setSelectedTransporter({ KUNNR: value2?.value });
    setval({ value: value2?.value, label: value2?.label });
  };

  // Common Handle Change
  const commonHandleChange = (data, filedName) => {
    console.log(data, filedName);
    setval({
      LIFNR: data.LIFNR,
      NAME1: data.NAME1,
    });
  };

  useEffect(() => {
    // Date: 15/01/2025 – Valuation Type New Tab Requirement
    props.loading(true);

    http
      .post(apis.GET_VALUATION_TYPES_NEW, {})
      .then((res) => {
        if (res.data?.code === 0) {
          setValuationTypesMaster(res.data.result || []);
        } else {
          const msg = res.data?.msg || "Unable to fetch valuation types";

          // Follow existing error-handling pattern
          if (!msg.toLowerCase().startsWith("server")) {
            Swal.fire({
              title: "Error!",
              text: msg,
              icon: "error",
              confirmButtonText: "Ok",
            });
          }
        }
      })
      .catch((err) => {
        console.error("Error fetching valuation type master:", err);

        Swal.fire({
          title: "Error!",
          text: "Failed to fetch valuation type master data",
          icon: "error",
          confirmButtonText: "Ok",
        });
      })
      .finally(() => {
        props.loading(false);
      });
  }, []);

  // Date: 08/12/2025, Issue: Valuation Type Should be input box if ORDER_TYPE = "ZLO5"
  // Listen to live ORDER_TYPE value from form

  const selectedOrderType = watch("ORDER_TYPE");

  const isZLO5Order = selectedOrderType === "ZLO5"; // Date: 15/01/2025 Valuation Type New Tab Requirement

  // Date: 15/01/2025 Valuation Type New Tab Requirement – Filter valuation types by Depot Code for ZLO5
  const filteredValuationTypes = useMemo(() => {
    if (
      selectedOrderType === "ZLO5" &&
      defaultOrderDetails?.PLANT &&
      valuationTypesMaster.length > 0
    ) {
      return valuationTypesMaster.filter(
        (item) =>
          item.DEPT_CODE?.toString().trim() ===
          defaultOrderDetails.PLANT?.toString().trim()
      );
    }
    return [];
  }, [selectedOrderType, defaultOrderDetails.PLANT, valuationTypesMaster]);

  // Sync valuation type dropdown with React Hook Form (CRITICAL)
  // useEffect(() => {
  //   if (selectedOrderType === "ZLO5") {
  //     if (filteredValuationTypes.length === 1) {
  //       // Auto-select if only one valuation type exists
  //       setValue("VALUATION_TYPE", filteredValuationTypes[0].VALUATION_TYPE);
  //     } else {
  //       // Reset when plant/order type changes
  //       setValue("VALUATION_TYPE", "");
  //     }
  //   }
  // }, [selectedOrderType, filteredValuationTypes, setValue]);
;

  // Date: 15/01/2025 Valuation Type New Tab Requirement - Reset valuation type ONLY when order type changes
  useEffect(() => {
    if (selectedOrderType === "ZLO5") {
      setValue("VALUATION_TYPE", "");
    }
  }, [selectedOrderType, setValue]);

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
                <div className="row">
                  <div className="col-3">
                    <label>
                      Order Type<span>*</span>
                    </label>
                  </div>
                  <div className="col-9">
                    <i className="fas fa-angle-down icons"></i>
                    <select
                      ref={register({
                        required: true,
                      })}
                      name="ORDER_TYPE"
                      disabled={currentState === "2"}
                    >
                      {allOrdertype.map((ele, i) => (
                        <option key={i} value={ele.AUART}>
                          {ele.AUART}-{ele.BEZEI}
                        </option>
                      ))}
                    </select>
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
                    <div
                      onClick={() => {
                        if (currentState === "1") {
                          //open modal
                          setIsOrderIdModalVisible(true);
                        }
                      }}
                    >
                      <i className="far fa-clone click-icons"></i>
                      <input
                        type="text"
                        ref={register({
                          required: true,
                        })}
                        name="ORDER_ID"
                        disabled={true}
                      />
                      {errors.ORDER_ID && (
                        <p className="form-error">This field is required</p>
                      )}
                    </div>
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
                    <i className="fas fa-angle-down icons"></i>
                    <input
                      type="text"
                      className="disabled-input"
                      ref={register({
                        required: true,
                      })}
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
                    <i className="fas fa-angle-down icons"></i>
                    <input
                      type="text"
                      className="disabled-input"
                      ref={register({
                        required: true,
                      })}
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
                      ref={register({
                        required: true,
                      })}
                      name="STORAGE_LOCATION"
                      onChange={(e) => {
                        e.target.value.length >= 3
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
                    {/* <input
                      type="text"
                      ref={register({
                        required: true,
                      })}
                      name="VEHICLE"
                      disabled={currentState === "2"}
                      onChange={(e) => {
                        // throw an error if space is there
                        if (e.target.value.includes(" ")) {
                          e.preventDefault();
                          Swal.fire({
                            icon: "error",
                            title: "Oops...",
                            text: "Vehicle number cannot contain space",
                          });
                          setValue("VEHICLE", e.target.value.replace(" ", ""));

                          return;
                        }
                      }}
                    /> */}
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
                      disabled={true}
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
                      ref={register({
                        required: true,
                      })}
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
                      ref={register({
                        required: true,
                      })}
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
                    {console.log(watch)}
                    <input
                      step={
                        watchAllFields.ORDER_TYPE === "ZLO5" ? "ANY" : "0.05"
                      }
                      type="number"
                      name="ISSUE_QUANTITY"
                      className="quan-input"
                      disabled={currentState === "2"}
                      ref={register({
                        required: true,
                        validate: (value) =>
                          parseFloat(value) <=
                          parseFloat(defaultOrderDetails.ISSUE_QTY),
                      })}
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
                        disabled
                      >
                        {/* <option value="">Select</option> */}
                        <option value="Y">Y - Yes</option>
                        <option value="N">N - No</option>
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                <div></div>
              )}
            </div>

            <div className="divider"></div>

            <div className="row">
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
                    <label>
                      Loading point<span>{VKORG !== "RECL" ? "*" : null}</span>
                    </label>
                  </div>
                  <div className="col-8">
                    <i className="fas fa-angle-down icons"></i>
                    <select
                      className="sales-select"
                      ref={register({
                        required: VKORG !== "RECL",
                      })}
                      name="LOADING_POINT"
                      disabled={currentState === "2" || VKORG === "RECL"}
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
                  <div className="col-4">
                    <label>
                      Transporter <span> *</span>
                    </label>
                  </div>
                  <div className="col-8">
                    <div>
                      <i
                        onClick={() => {
                          if (currentState === "1") {
                            //open modal
                            openTransporterSearchModal(true);
                          }
                        }}
                        className="far fa-clone click-icons"
                      ></i>
                      {/* <input
                        type="text"
                        ref={register({
                          required: true,
                        })}
                        name="TRANSPORTER"
                        disabled={true}
                      /> */}
                      <Select
                        classNamePrefix="react-select"
                        value={Object.keys(value).length > 0 ? value : []}
                        options={transOptions}
                        name="Transporter"
                        cacheOptions
                        defaultOptions
                        placeholder={"Transporter"}
                        onChange={(e) => commonHandleChange(e, "")}
                        getOptionLabel={(ele) =>
                          `${ele.LIFNR?.replace(/^0+/, "")}-${ele.NAME1}`
                        }
                        getOptionValue={(ele) => ele.LIFNR}
                      />

                      {/* <AsyncSelect
                        classNamePrefix="react-select"
                        cacheOptions
                        loadOptions={loadOptions}
                        defaultOptions
                        onInputChange={handleInputChange}
                        value={value}
                        placeholder={""}
                        onChange={handleChange}
                        isDisabled={currentState === "2"}
                      /> */}
                      {errors.TRANSPORTER && (
                        <p className="form-error">This field is required</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col">
                <div className="row">
                  <div className="col-3">
                    <label>Transportation Zone</label>
                  </div>
                  <div className="col-9">
                    <i className="fas fa-angle-down icons"></i>
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
              </div>
              <div className="col">
                <div className="row">
                  <div className="col-3">
                    <label>
                      Shipping Type<span>*</span>
                    </label>
                  </div>
                  <div className="col-9">
                    <i className="fas fa-angle-down icons"></i>
                    <select
                      ref={register({
                        required: true,
                      })}
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

              {/* {VKORG?.toUpperCase() === "RECL" && (
                <div className="col">
                  {console.log(valuationTypes, "Valuation Types")}
                  <div className="row">
                    <div className="col-3">
                      <label>
                        Valuation Type<span>*</span>
                      </label>
                    </div>
                    <div className="col-9">
                      <select
                        name="VALUATION_TYPE"
                        ref={register({
                          required: true,
                        })}
                        defaultValue=""
                        className="form-control"
                        disabled={valuationTypes.length === 0}
                      >
                        <option value="">
                          {valuationTypes.length === 0
                            ? "Loading valuation types..."
                            : "Select Valuation Type"}
                        </option>

                        {valuationTypes.map((item, index) => {
                          const value = typeof item === "object" ? item.BWTAR : item;
                          return (
                            <option key={index} value={value}>
                              {value}
                            </option>
                          );
                        })}
                      </select>

                      {errors.VALUATION_TYPE && (
                        <p className="form-error">This field is required</p>
                      )}
                    </div>
                  </div>
                </div>
              )} */}

              {/* Date: 08/12/2025, Issue: Valuation Type should be input box if ORDER_TYPE = "ZLO5" */}

              {/* // Date: 15/01/2025 Valuation Type New Tab Requirement  */}

              {VKORG?.toUpperCase() === "RECL" && (
                <div className="col">
                  <div className="row">
                    <div className="col-3">
                      <label>
                        Valuation Type<span>*</span>
                      </label>
                    </div>

                    <div className="col-9">
                      <select
                        name="VALUATION_TYPE"
                        ref={register({ required: true })}
                        className="form-control"
                        disabled={
                          isZLO5Order
                            ? filteredValuationTypes.length === 0
                            : valuationTypes.length === 0
                        }
                        // disabled={isValuationDisabled}
                      >
                        <option value="">
                          {isZLO5Order
                            ? filteredValuationTypes.length === 0
                              ? "Loading valuation types..."
                              : "Select Valuation Type"
                            : valuationTypes.length === 0
                            ? "Loading valuation types..."
                            : "Select Valuation Type"}
                        </option>

                        {(isZLO5Order
                          ? filteredValuationTypes
                          : valuationTypes
                        ).map((item, index) => {
                          const value = isZLO5Order
                            ? item.VALUATION_TYPE
                            : typeof item === "object"
                            ? item.BWTAR
                            : item;

                          return (
                            <option key={index} value={value}>
                              {value}
                            </option>
                          );
                        })}
                      </select>

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
                    onClick={createDelivery}
                  >
                    Save
                  </button>
                </React.Fragment>
              ) : (
                <React.Fragment>
                  <button
                    type="button"
                    className="button button-back"
                    onClick={() => setShowFormResetDialog(true)}
                  >
                    Clear
                  </button>
                  <button className="button button-foreword" type="submit">
                    Next
                  </button>
                </React.Fragment>
              )}
            </div>
          </form>
        </div>

        <div className={currentState === "3" ? "row input-area" : "d-none"}>
          {createdDelivery !== "" && (
            <>
              <img className="success-img" src="/images/success_tick.jpeg" />
              <span className="success-msg">
                &nbsp;&nbsp; Delivery created with delivery id {createdDelivery}
              </span>
              <button
                className="button button-foreword float-right"
                onClick={newEntry}
              >
                Create new delivery
              </button>
              &nbsp;&nbsp;&nbsp;
              <Link
                to="/dashboard/sales-order/list"
                className="button-foreword button float-right"
              >
                Go to Sales Order List
              </Link>
            </>
          )}
        </div>
        <div className={currentState === "3" ? "row input-area" : "d-none"}>
          {(Object.keys(deliveryStatus)?.length > 0 &&
            deliveryStatus?.EX_MESSAGE1 !== "") ||
          createdDelivery !== "" ? (
            <>
              {Object.keys(deliveryStatus)?.length > 0 ? (
                <>
                  <img
                    className="success-img"
                    src="/images/success_tick.jpeg"
                  />
                  &nbsp;&nbsp;
                  <span key={"2"} className="success-msg">
                    {deliveryStatus?.EX_MESSAGE1}
                  </span>
                  <button
                    className="button button-foreword float-right"
                    onClick={newEntry}
                  >
                    Create new delivery
                  </button>
                  &nbsp;&nbsp;&nbsp;
                  <Link
                    to="/dashboard/sales-order/list"
                    className="button-foreword button float-right"
                  >
                    Go to Sales Order List
                  </Link>
                  <br />
                </>
              ) : null}

              {Object.keys(deliveryStatus)?.length > 0 ? (
                <>
                  <br />
                  <img
                    className="success-img"
                    src="/images/success_tick.jpeg"
                  />
                  &nbsp;&nbsp;
                  <span key={"1"} className="success-msg">
                    {deliveryStatus?.EX_MESSAGE2}
                  </span>
                </>
              ) : null}
              <br />
              <br />
            </>
          ) : (
            <>
              <br />
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              <img className="success-img" src="/images/error.png" />
              &nbsp;&nbsp;
              <span key={"2"} className="success-msg">
                Delivery Not Created
              </span>
              &nbsp;&nbsp;&nbsp;&nbsp;
              <button
                className="button button-foreword float-right"
                onClick={newEntry}
              >
                Create new delivery
              </button>
              &nbsp;&nbsp;&nbsp;
              <Link
                to="/dashboard/sales-order/list"
                className="button-foreword button float-right"
              >
                Go to Sales Order List
              </Link>
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        show={showFormResetDialog}
        message="Do you really want to clear the form?"
        accept={() => {
          window.location.reload();
        }}
        reject={() => setShowFormResetDialog(false)}
        hideIt={() => setShowFormResetDialog(false)}
      />

      {/* order id modal */}
      <Modal
        show={isOrderIdModalVisible}
        className="modal"
        centered
        onHide={() => setIsOrderIdModalVisible(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>Enter an order id</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <input
            type="text"
            placeholder="enter order id"
            ref={orderIdInputBox}
          />
          <Button variant="outline-secondary" onClick={getUserIdFromModal}>
            Ok
          </Button>
        </Modal.Body>
      </Modal>
      {/* order id modal close*/}

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
          <Modal.Title>Select Transporter</Modal.Title>
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
                          setval({
                            LIFNR: row.LIFNR.replace(/^0+/, ""),
                            NAME1: row.NAME1,
                          });
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
  Delivery: state.Delivery,
});

export default connect(mapStateToProps, { loading })(DeliveryCreate);
