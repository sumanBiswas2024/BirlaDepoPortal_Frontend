import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { connect } from "react-redux";
import { useForm } from "react-hook-form";
import apis from "../../services/apis";
import http from "../../services/apicall";
import { loading } from "../../actions/loadingAction";
import SearchDialog from "./SearchDialogue";
import SearchSoldToParty from "./soldToPart";
import ConfirmDialog from "../dashboard/ConfirmDialogue";
import moment from "moment";
import Swal from "sweetalert2";
import { Link } from "react-router-dom";
import Select from "react-select";
import filterOptions from "../../Functions/filterData";

import Modal from "react-bootstrap/Modal";
import Table from "react-bootstrap/Table";
import Button from "react-bootstrap/Button";

let default_config = {
  show: false,
  title: "",
  keys: [],
  labels: [],
  labelindex: [],
  field: "",
  data: [],
  keylabels: [],
  return_field_value: "",
  return_field_key: "",
  setStateFunction: function () { },
};

function SalesOrderEdit(props) {
  let { id } = useParams();

  // Prevent double-click submits
  const isSubmittingRef = useRef(false);   // For step 1 → step 2
  const isSavingRef = useRef(false);       // For final Save update

  const [currentState, setCurrentState] = useState("1");
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
  const [defaultSoDetails, setDefaultSoDetails] = useState({});
  const [flag, setFlag] = useState(0);

  const [allReasonOfRejection, setAllReasonOfRejection] = useState([]);
  const [allOrderTypes, setAllOrderTypes] = useState([]);
  const [allOrderSupplyingPlants, setAllOrderSupplyingPlants] = useState([]);
  const [allOrderShippingTypes, setAllOrderShippingTypes] = useState([]);
  const [allOrderMaterial, setAllOrderMaterial] = useState([]);
  const [allOrderShippingPoint, setAllOrderShippingPoint] = useState([]);
  const [allOrderShipToParty, setAllOrderShipToParty] = useState([]);
  const [allOrderSalesArea, setAllOrderSalesArea] = useState([]);
  const [allOrderIncoTerms, setAllOrderIncoTerms] = useState([]);
  const [searchModalConfig, setSearchModalConfig] = useState({
    ...default_config,
  });
  const watchAllFields = watch(); // watching every fields in the form
  const [finalFormData, setFinalFormData] = useState({});
  const [soldToPartyModalVisble, setsoldToPartyModalVisble] = useState(false);
  const [showFormResetDialog, setShowFormResetDialog] = useState(false);

  const [selectedSupplyingPlant, setSelectedSupplyingPlant] = useState({});
  const [selectedSalesArea, setSelectedSalesArea] = useState({});
  const [selectedMaterial, setSelectedMaterial] = useState({});
  const [selectedSoldtoParty, setSelectedSoldtoParty] = useState({});
  const [selectedShiptoparty, setSelectedShiptoparty] = useState({});
  const [isCustomSelectVisible, setIsCustomModalVisible] = useState(false);
  const [allPromoters, setAllPromoters] = useState([]);
  const [salesEditResponse, setSalesEditResponse] = useState([]);

  const [isPlant2ModalVisible, setIsPlant2ModalVisible] = useState(false);
  const [selectedPlant2, setSelectedPlant2] = useState([]);
  const [isReasonModalVisible, setIsReasonModalVisible] = useState(false);
  const [allReason, setAllReason] = useState([]);
  const [reason, setReason] = useState("");
  const [shippingCounter, setShippingCounter] = useState(0);
  const [plant2Data, setPlant2Data] = useState([]);
  const [selectedShippingType, setSelectedShippingType] = useState("");
  const [selectAllOrderType, setAllOrderType] = useState("");
  const [index, setINDEX] = useState("");
  const [stopReason, setStopReason] = useState(0);
  const [shipToPartyOptions, setShipToParty] = useState([]);
  const [shipToPartyValue, setShipToPartyValue] = useState([]);
  const [plantValue, setPlantValue] = useState([]);
  const [plantOptions, setPlantOptions] = useState([]);
  const [materialOptions, setMaterialOptions] = useState([]);
  const [materialValue, setMaterialValue] = useState([]);

  //+++++++++++++++++++++++++++++++++++++++++++++++++form submit handler++++++++++++++++++++++++++++++++++++++++++
  const onSubmit = (data) => {

    // 🚫 Prevent double Next-click
    if (isSubmittingRef.current) {
      console.warn("Duplicate onSubmit prevented");
      return;
    }
    isSubmittingRef.current = true;
    console.log(data);

    if (Number(data.TARGET_QTY) === 0) {
      Swal.fire({
        title: "Error!",
        text: "Quantity can't be zero",
        icon: "error",
        confirmButtonText: "Ok",
      });
      return;
    }

    props.loading(true);
    http
      .post(apis.SALES_ORDER_LOGIN_MATRIX_CHECK, {
        IM_KUNNR: selectedSoldtoParty.KUNNR,
        lv_user: localStorage.getItem("user_code"),
        IM_WERKS: selectedSupplyingPlant.WERKS,
        IM_VKORG: selectedSalesArea.VKORG,
        IM_VTWEG: selectedSalesArea.VTWEG,
        IM_SPART: selectedSalesArea.SPART,
      })
      .then((result) => {
        if (result.data.status) {
          setFinalFormData(data);
          setCurrentState("2");
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
        isSubmittingRef.current = false;   // release lock
      });
  };
  //+++++++++++++++++++++++++++++++++++++++++++++++++form submit handler end++++++++++++++++++++++++++++++++++++++++++

  //+++++++++++++++++++++++++++++++++++++++++++++++++save form data to server+++++++++++++++++++++++++++++++++++++++++++++++++++++
  let saveFormData = () => {
    // 🚫 Prevent double Save-click
    if (isSavingRef.current) {
      console.warn("Duplicate saveFormData prevented");
      return;
    }
    isSavingRef.current = true;

    // ---------- FORM SAFETY VALIDATION ----------
    // Basic required checks before calling API
    const missing = [];
    if (!finalFormData || Object.keys(finalFormData).length === 0) {
      missing.push("form data");
    }
    if (!shipToPartyValue || !shipToPartyValue.value) {
      missing.push("Ship To Party");
    }
    if (!materialValue || !materialValue.value) {
      missing.push("Material");
    }
    if (!selectedSupplyingPlant || !selectedSupplyingPlant.WERKS) {
      missing.push("Supplying Plant");
    }
    if (
      !finalFormData ||
      finalFormData.TARGET_QTY === undefined ||
      finalFormData.TARGET_QTY === null ||
      finalFormData.TARGET_QTY === "" ||
      Number(finalFormData.TARGET_QTY) === 0
    ) {
      missing.push("Quantity (non-zero)");
    }
    // If sales area is BC01 and L2 reason is required (your UI shows L2/L3 reason), ensure reason exists
    if (selectedSalesArea?.VKORG === "BC01") {
      // if reason is expected to be required in BC01

      // Date: 15/12/2025 L2/L3 Reason Input Box Non-Mandatory
      
      // if (!reason || reason === "") {
      //   missing.push("L2/L3 Reason");
      // }
    }

    if (missing.length > 0) {
      const msg = `Please provide: ${missing.join(", ")}`;
      Swal.fire("Error", msg, "error");
      isSavingRef.current = false;
      return;
    }
    // ---------- END VALIDATION ----------

    //api call
    console.log(shipToPartyValue);
    console.log(finalFormData);

    let s_inco = allOrderIncoTerms.find(
      (ele) => ele.INCO1 === finalFormData.INCO_TERM1
    );

    let body = {
      IM_LOGIN_ID: localStorage.getItem("user_code"),
      IM_SALES_ORDER: id,
      IM_SHIPTOPARTY: shipToPartyValue.value,
      IM_MATERIAL: materialValue.value,
      IM_SUPPLYING_PLANT: selectedSupplyingPlant.WERKS,
      IM_PO: finalFormData.IM_PO,
      IM_SHIPPING_POINT: finalFormData.SHIP_POINT,
      IM_SHIPPING_TYPE: finalFormData.SHIP_TYPE,
      IM_REQ_QTY: finalFormData.TARGET_QTY,
      IM_REMARKS: finalFormData.REMARKS,
      IM_UOM: finalFormData.UOM,
      IM_INCO: finalFormData.INCO_TERM1,
      IM_INCO_DESC: s_inco ? s_inco.BEZEI : "",
      IM_L2_REASON: reason ? reason : "",
    };
    if (finalFormData.IM_REJ_REASON !== "select") {
      body["IM_REJ_REASON"] = finalFormData.IM_REJ_REASON;
    }
    let podate = moment(finalFormData.IM_PODATE, "YYYY-MM-DD");
    if (podate.isValid()) {
      body["IM_PODATE"] = podate.format("YYYYMMDD");
    }
    console.log(body);
    props.loading(true);
    http
      .post(apis.UPDATE_SO_DETAILS, body)
      .then((result) => {
        if (result.data.status) {
          setSalesEditResponse(result.data.data);
          setCurrentState("3");
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
      })
      .finally(() => {
        props.loading(false);
        isSavingRef.current = false; // release lock
      });
  };

  //

  //+++++++++++++++++++++++++++++++++++++++++++++++++fetching order types && shipping plants && shipping types+++++++++++++++++++++++++++++++++++++
  useEffect(() => {
    props.loading(true);
    // let p1 = http.post(apis.GET_ORDER_TYPES, { vbeln: 1234567899 });
    let p1 = http.post(apis.COMMON_POST_WITH_TABLE_NAME, {
      TABLE: "ORDER_TYPE",
      params: {
        TYPE: "SO",
      },
    });
    let p2 = http.post(apis.GET_ORDER_SHIPPING_PLANTS, {
      lv_user: localStorage.getItem("user_code"),
    });
    let p3 = http.post(`${apis.FETCH_SO_DETAILS}/${id}`);
    let p4 = http.post(apis.FETCH_ALL_REASON_OF_REJECTION);
    //let p3 = http.post(apis.GET_ORDER_SHIPPING_TYPE, { vbeln: 1234567899 });
    Promise.all([p1, p2, p3, p4])
      .then((res) => {
        if (
          res[0].data.status &&
          res[1].data.status &&
          res[2].data.status &&
          res[3].data.status
        ) {
          setAllOrderTypes(res[0].data.result);
          // setAllOrderTypes(res[0].data.result.IT_FINAL);
          // setAllOrderType(res[0].data.result.IT_FINAL[0].AUART);
          setAllReasonOfRejection(res[3].data.data);
          if (
            selectedSalesArea.VKORG !== "BC01" &&
            selectedSalesArea.VKORG === undefined
          ) {
            setAllOrderSupplyingPlants(res[1].data.result);
          }
          setDefaultSoDetails(res[2].data.data);
          setReason(res[2].data.data.L2L3_REASON);
          setSelectedSoldtoParty({
            KUNNR: res[2].data.data.SOLD_TO,
            NAME1: res[2].data.data.SOLD_TO_NAME,
          });
          setSearchedValue("DOC_TYPE", res[2].data.data.AUART);
          setSearchedValue("REMARKS", res[2].data.data.REMARKS);
          setSearchedValue(
            "DOC_DATE",
            moment(res[2].data.data.AUDAT, "YYYYMMDD").format("YYYY-MM-DD")
          );
          setSearchedValue(
            "IM_PODATE",
            moment(res[2].data.data.BSTDK, "YYYYMMDD").format("YYYY-MM-DD")
          );
          setSearchedValue("IM_PO", res[2].data.data.BSTKD);
          setSearchedValue("TARGET_QTY", res[2].data.data.ORD_QTY);
          setSearchedValue("UOM", res[2].data.data.UOM);
          setSearchedValue(
            "SOLD_TO_PARTY",
            `${res[2].data.data.SOLD_TO}-${res[2].data.data.SOLD_TO_NAME}`
          );
          setAllOrderType(res[2].data.data.AUART);
          if (res[1].data.result.IT_FINAL.length > 0) {
            setSelectedSupplyingPlant({
              WERKS: res[2].data.data.WERKS,
              WERKS_DESC: res[2].data.data.WERKS_DESC,
            });
            setSearchedValue(
              "PLANT",
              `${res[2].data.data.WERKS}-${res[2].data.data.WERKS_DESC}`
            );
            setMaterialValue({
              value: res[2].data.data.MATNR,
              label: res[2].data.data.MATNR + "-" + res[2].data.data.MAKTX,
            });
          }
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
  }, [selectedSalesArea.VKORG]);
  //+++++++++++++++++++++++++++++++++++++++++++++++++fetching order types && shipping plants && shipping types end+++++++++++++++++++++++++++++++++++++

  //++++++++++++++++++++++++++++++++++++++++++++++++ fetching plant dependent and material dependent shipping type+++++++++++
  let fetchShippingType = () => {
    props.loading(true);
    let mat = [];

    for (let i = 0; i < 18 - selectedMaterial.MATNR.length; i++) {
      mat.push("0");
    }
    mat = mat.join("");
    const material = mat + selectedMaterial.MATNR;

    http
      // .post(apis.GET_NEW_SHIPPING_TYPE, {
      //   plant: selectedSupplyingPlant.WERKS,
      //   material: material,
      // })
      .post(apis.SHIPPING_TYPE_MAINTAINED_TABLE, {
        // TABLE: "SHIPPING_TYPE",
        params: {
          PLANT: selectedSupplyingPlant.WERKS,
          MATERIAL: material,
        },
      })
      .then((result) => {
        if (result.data.status) {
          // setAllOrderShippingTypes(result.data.data);
          setAllOrderShippingTypes(result.data.result);
          if (flag === 0) {
            setValue("SHIP_TYPE", defaultSoDetails.SHIP_TYPE);
          }
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
    if (
      Object.keys(selectedSupplyingPlant).length > 0 &&
      Object.keys(selectedMaterial).length > 0
    ) {
      fetchShippingType();
    }
  }, [selectedSupplyingPlant, selectedMaterial]);

  //+++++++++++++++++++++++++++++++++++++++++++++++++fetching plant dependent material and shipping point +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
  useEffect(() => {
    if (Object.keys(selectedSupplyingPlant).length > 0) {
      props.loading(true);
      let p1 = http.post(apis.GET_ORDER_SHIPPING_POINT, {
        lv_plant: selectedSupplyingPlant.WERKS,
      });
      let p2 = http.post(apis.GET_ORDER_MATERIAL_OF_PLANT, {
        lv_plant: selectedSupplyingPlant.WERKS,
      });
      Promise.all([p1, p2])
        .then((res) => {
          if (res[0].data.status && res[1].data.status) {
            setAllOrderMaterial(res[1].data.result.IT_FINAL);
            setAllOrderShippingPoint(res[0].data.result.IT_FINAL);
            if (flag !== 0) {
              // setValue("MATERIAL", "");
            } else {
              setSelectedMaterial({
                MAKTX: defaultSoDetails.MAKTX,
                MATNR: defaultSoDetails.MATNR,
              });
              setMaterialValue({
                value: defaultSoDetails.MATNR,
                label: defaultSoDetails.MATNR + "-" + defaultSoDetails.MAKTX,
              });
              setValue(
                "MATERIAL",
                `${defaultSoDetails.MATNR.replace(/^0+/, "")}-${defaultSoDetails.MAKTX
                }`
              );
              setValue("SHIP_POINT", defaultSoDetails.SHIP_POINT);
            }
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
    }
  }, [selectedSupplyingPlant, defaultSoDetails, props]);
  //+++++++++++++++++++++++++++++++++++++++++++++++++fetching plant dependent material and shipping point end+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

  //+++++++++++++++++++++++++++++++++++++++++++++++++fetching sold to party dependent ship to party and sales area +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
  // +++++++++++++++++++++++++++++ Sales Area SQL Table ++++++++++++++++++++++++++++ //
  // useEffect(() => {
  //   if (
  //     selectedSoldtoParty?.KUNNR !== "" &&
  //     selectedSoldtoParty?.KUNNR !== undefined
  //   ) {
  //     props.loading(true);
  //     let p1 = http.post(apis.GET_SHIP_TO_PARTY, {
  //       lv_customer: selectedSoldtoParty.KUNNR,
  //     });
  //     let p2 = http.post(apis.COMMON_POST_WITH_TABLE_NAME, {
  //       TABLE: "SALES_AREA",
  //       params: {},
  //     });
  //     Promise.all([p1, p2])
  //       .then((res) => {
  //         if (res[0].data.status && res[1].data.status) {
  //           setAllOrderShipToParty(res[0].data.result.IT_FINAL);
  //           setAllOrderSalesArea(
  //             res[1].data.result.map((ele) => {
  //               return {
  //                 ...ele,
  //                 display_name: `${ele.VKORG} - ${ele.VTWEG} - ${ele.SPART}`,
  //               };
  //             })
  //           );

  //           if (res[1].data.result.length > 0) {
  //             let firstObj = res[1].data.result[0];
  //             setSelectedSalesArea({
  //               ...firstObj,
  //               KUNNR: selectedSoldtoParty.KUNNR,
  //               display_name: `${firstObj.VKORG} - ${firstObj.VTWEG} - ${firstObj.SPART}`,
  //             });
  //           }
  //         } else {
  //           console.log("Error");
  //         }
  //       })
  //       .catch((err) => {
  //         console.log(err);
  //       })
  //       .finally(() => {
  //         props.loading(false);
  //       });
  //   }
  // }, [selectedSoldtoParty]);

  // ++++++++++++++++++++++++++++++ Sales Area SAP +++++++++++++++++++++++++++++++++++//
  useEffect(() => {
    if (watchAllFields.SOLD_TO_PARTY && watchAllFields.SOLD_TO_PARTY !== "") {
      props.loading(true);
      let p1 = http.post(apis.GET_SHIP_TO_PARTY, {
        lv_customer: selectedSoldtoParty.KUNNR,
      });
      let p2 = http.post(apis.GET_SALES_AREA, {
        lv_customer: selectedSoldtoParty.KUNNR,
      });
      Promise.all([p1, p2])
        .then((res) => {
          if (res[0].data.status && res[1].data.status) {
            setAllOrderShipToParty(res[0].data.result.IT_FINAL);
            setAllOrderSalesArea(res[1].data.result.IT_FINAL);
            if (flag === 0) {
              setSelectedSalesArea({
                KUNNR: defaultSoDetails.SOLD_TO,
                SPART: defaultSoDetails.SPART,
                VKORG: defaultSoDetails.VKORG,
                VTWEG: defaultSoDetails.VTWEG,
                display_name: `${defaultSoDetails.VKORG}-${defaultSoDetails.VTWEG}-${defaultSoDetails.SPART}`,
              });
              let ind = res[1].data.result.IT_FINAL.findIndex(
                (v) =>
                  v.display_name ===
                  `${defaultSoDetails.VKORG}-${defaultSoDetails.VTWEG}-${defaultSoDetails.SPART}`
              );
              setSearchedValue("SALES_AREA", ind);
              setSelectedShiptoparty({
                KUNNR: defaultSoDetails.SHIP_TO,
                NAME1: defaultSoDetails.SHIP_TO_NAME,
              });

              setShipToPartyValue({
                value: defaultSoDetails.SHIP_TO,
                label:
                  defaultSoDetails.SHIP_TO +
                  "-" +
                  defaultSoDetails.SHIP_TO_NAME,
              });
              setSearchedValue(
                "SHIP_TO_PARTY",
                `${defaultSoDetails.SHIP_TO}-${defaultSoDetails.SHIP_TO_NAME}`
              );
            } else {
              if (res[1].data.result.IT_FINAL.length > 0) {
                setSelectedSalesArea(res[1].data.result.IT_FINAL[0]);
              }
              if (res[0].data.result.IT_FINAL.length > 0) {
                setSelectedShiptoparty(res[0].data.result.IT_FINAL[0]);
                setSearchedValue(
                  "SHIP_TO_PARTY",
                  `${res[0].data.result.IT_FINAL[0]["KUNNR"]}-${res[0].data.result.IT_FINAL[0]["NAME1"]}`
                );
              }
            }
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
    }
  }, [watchAllFields.SOLD_TO_PARTY, defaultSoDetails]);

  //+++++++++++++++++++++++++++++++++++++++++++++++++fetching sold to party dependent ship to party and sales area end+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

  useEffect(() => {
    if (defaultSoDetails.length !== 0 && selectedSalesArea.VKORG === "BC01") {
      let zeros = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

      let mat = defaultSoDetails.MATNR;
      // mat = mat.split();
      zeros = zeros.slice(0, zeros.length - mat.length);
      zeros = zeros.toString();
      zeros = zeros.split(",").join("");

      mat = zeros.concat(mat);

      props.loading(true);
      http
        .post(apis.GET_PLANT2_VALUE, {
          params: {
            IM_KUNNR: selectedSoldtoParty.KUNNR,
            IM_VKORG: defaultSoDetails.VKORG,
            IM_VTWEG: defaultSoDetails.VTWEG,
            IM_SPART: defaultSoDetails.SPART,
            IM_AUART: defaultSoDetails.AUART,
            IM_MATNR: mat,
            IM_VSART: defaultSoDetails.SHIP_TYPE,
            IM_LOGIN_ID: localStorage.getItem("user_code"),
          },
          fm_name: "ZRFC_L1L2_PLANT_POPULATE",
        })
        .then((result) => {
          setAllOrderSupplyingPlants(result.data.result.EX_RETURN);
        })
        .catch((err) => console.log(err))
        .finally(() => props.loading(false));
    }
  }, [selectedSalesArea.VKORG]);

  //+++++++++++++++++++++++++++++++++++++++++++++++++fetching plant 2++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++//

  let fetchPlant2 = (shippingType) => {
    if (selectAllOrderType !== "N02") {
      let zeros = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

      let mat = selectedMaterial.MATNR;
      // mat = mat.split();
      zeros = zeros.slice(0, zeros.length - mat.length);
      zeros = zeros.toString();
      zeros = zeros.split(",").join("");

      mat = zeros.concat(mat);

      props.loading(true);
      http
        .post(apis.GET_PLANT2_VALUE, {
          params: {
            IM_KUNNR: selectedSoldtoParty.KUNNR,
            IM_VKORG: selectedSalesArea.VKORG,
            IM_VTWEG: selectedSalesArea.VTWEG,
            IM_SPART: selectedSalesArea.SPART,
            IM_AUART: selectAllOrderType,
            IM_MATNR: mat,
            IM_VSART: shippingType,
          },
          fm_name: "ZRFC_L1L2_PLANT_POPULATE",
        })
        .then((result) => {
          if (result.data.status) {
            setPlant2Data(result.data.result.EX_RETURN);
            setShippingCounter(1);
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
    }
  };

  useEffect(() => {
    if (
      Object.keys(selectedSupplyingPlant).length > 2 &&
      selectedSalesArea.VKORG !== "RECL"
    ) {
      fetchReason(selectedSupplyingPlant);
    }
    // }
  }, [selectedSupplyingPlant]);

  //+++++++++++++++++++++++++++++++++Modal++++++++++++++++++++++++++//
  let openPlant2Modal = () => {
    setIsPlant2ModalVisible(true);
  };

  let selectValue = (e) => {
    const vsart = e.target.value;
    setSelectedShippingType(vsart);

    fetchPlant2(vsart);

    // Only open Plant2 modal if user is actually editing
    if (
      currentState === "1" &&
      selectAllOrderType !== "ZN02" &&
      selectedSalesArea.VKORG === "BC01"
    ) {
      setIsPlant2ModalVisible(true);
    }
  };


  //++++++++++++++++++++++++++++++++Reason Api++++++++++++++++++++++++//

  let fetchReason = (row) => {
    if (row.INDEX1 !== "L1") {
      setIsReasonModalVisible(true);

      props.loading(true);
      http
        .post(apis.GET_PLANT2_VALUE, {
          params: { IM_L2_REASON: row.INDEX1 },
          fm_name: "ZRFC_L2_REASON_POPULATE",
        })
        .then((result) => {
          setAllReason(result.data.result.EX_L2_REASON);
        })
        .catch((err) => {
          console.log(err);
        })
        .finally(() => {
          props.loading(false);
          // setStopReason(1);
        });
    } else {
      setReason("");
    }
  };

  //+++++++++++++++++++++++++++++++++++++++++++++++++++++ Sales area dependent into term and trans zone++++++++++++++++++++++++++++++++++++++++++++++++++++++++
  useEffect(() => {
    if (Object.keys(selectedSalesArea).length > 0) {
      props.loading(true);
      let p1 = http.post(apis.GET_INCO_TERM, {
        LV_CUSTOMER: selectedSalesArea.KUNNR,
        LV_SALESORG: selectedSalesArea.VKORG,
        LV_DIST: selectedSalesArea.VTWEG,
        LV_DIV: selectedSalesArea.SPART,
        lv_user: localStorage.getItem("user_code"),
        IM_KUNNR: selectedSoldtoParty.KUNNR,
        IM_WERKS: selectedSupplyingPlant.WERKS,
        IM_VKORG: selectedSalesArea.VKORG,
        IM_VTWEG: selectedSalesArea.VTWEG,
        IM_SPART: selectedSalesArea.SPART,
      });
      let p2 = http.post(apis.GET_TRANS_ZONE, {
        LV_CUSTOMER: selectedSalesArea.KUNNR,
      });
      let p3 = http.post(apis.GET_SALES_PROMOTER, {
        LV_CUSTOMER: selectedSalesArea.KUNNR,
        LV_SALESORG: selectedSalesArea.VKORG,
        LV_DIST: selectedSalesArea.VTWEG,
        LV_DIV: selectedSalesArea.SPART,
      });
      Promise.all([p1, p2, p3])
        .then((res) => {
          setFlag(1);
          if (res[0].data.status && res[1].data.status && res[2].data.status) {
            setAllOrderIncoTerms(res[0].data.result);
            // if (res[0].data.result.IT_FINAL.length > 0) {
            //   setSearchedValue(
            //     "INCO_TERM1",
            //     `${res[0].data.result.IT_FINAL[0].INCO1} - ${res[0].data.result.IT_FINAL[0].BEZEI}`
            //   );
            // }
            if (res[1].data.result.IT_FINAL.length > 0) {
              setValue(
                "TRANS_ZONE",
                `${res[1].data.result.IT_FINAL[0].ZONE1} - ${res[1].data.result.IT_FINAL[0].VTEXT}`
              );
            }
            setAllPromoters(res[2].data.result.IT_FINAL);
            if (res[2].data.result.IT_FINAL.length > 0) {
              setValue("SALES_PROMOTER", res[2].data.result.IT_FINAL[0].NAME1);
            } else {
              setValue("SALES_PROMOTER", "");
            }
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
    }
  }, [selectedSalesArea]);
  //+++++++++++++++++++++++++++++++++++++++++++++++++++++ Sales area dependent into term and trans zone end++++++++++++++++++++++++++++++++++++++++++++++++++++++++

  //+++++++++++++++++++++++++++++++++++++++++++++++++setting form value+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
  let setSearchedValue = (key, value, value2) => {
    if (
      key === "MATERIAL" ||
      key === "SOLD_TO_PARTY" ||
      key === "SHIP_TO_PARTY"
    ) {
      setValue(key, value.replace(/^0+/, ""));
    } else {
      setValue(key, value);
    }

    if (key === "SHIP_TO_PARTY") {
      value2 = value2?.replace(/^0+/, "");
      value = value.replace(/^0+/, "");
      console.log(value2);
      // setShipToPartyValue({ value: value2, label: value });
    } else if (key === "MATERIAL") {
      value2 = value2?.replace(/^0+/, "");
      value = value?.replace(/^0+/, "");
      setMaterialValue({ value: value2, label: value });
    }
    triggerValidation(key);
  };
  //+++++++++++++++++++++++++++++++++++++++++++++++++setting form value end+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

  useEffect(() => {
    // console.log(selectedMaterial, selectedSoldtoParty, selectedShiptoparty);
  }, [selectedMaterial, selectedSoldtoParty, selectedShiptoparty]);

  useEffect(() => {
    if (Object.keys(selectedShiptoparty).length > 0) {
      http
        .post(apis.GET_TRANS_ZONE, {
          LV_CUSTOMER: selectedShiptoparty.KUNNR,
        })
        .then((res) => {
          // if(res.data.result){
          //   setValue(
          //     "TRANS_ZONE",
          //   )
          // }
          if (res) {
            setValue(
              "TRANS_ZONE",
              `${res.data.result.IT_FINAL[0].ZONE1} - ${res.data.result.IT_FINAL[0].VTEXT}`
            );
          }
        });
    }
  }, [selectedShiptoparty]);

  useEffect(() => {
    if (defaultSoDetails.INCO && allOrderIncoTerms.length) {
      setValue("INCO_TERM1", `${defaultSoDetails.INCO}`);
    }
  }, [allOrderIncoTerms.length, defaultSoDetails.INCO]);

  useEffect(() => {
    http
      .post(apis.GET_INCO_TERM, {
        LV_CUSTOMER: selectedSalesArea.KUNNR,
        LV_SALESORG: selectedSalesArea.VKORG,
        LV_DIST: selectedSalesArea.VTWEG,
        LV_DIV: selectedSalesArea.SPART,
        lv_user: localStorage.getItem("user_code"),
        IM_KUNNR: selectedSoldtoParty.KUNNR,
        IM_WERKS: selectedSupplyingPlant.WERKS,
      })
      .then((res) => {
        if (res.data.result) {
          setAllOrderIncoTerms(res.data.result);
        }
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => {
        props.loading(false);
      });
  }, [selectedSalesArea, selectedSoldtoParty, selectedSupplyingPlant]);

  let setBlankReason = (row) => { };

  useEffect(() => {
    if (index === "L1") {
      setAllReason([]);
      setReason(null);
    }
  }, [index]);

  useEffect(() => {
    props.loading(true);
    http
      .post(apis.GET_PLANT2_VALUE, {
        params: { IM_L2_REASON: "L2" },
        fm_name: "ZRFC_L2_REASON_POPULATE",
      })
      .then((result) => {
        setAllReason(result.data.result.EX_L2_REASON);
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => {
        props.loading(false);
      });
  }, []);

  // Ship to party
  useEffect(() => {
    setShipToParty(filterOptions(allOrderShipToParty, "KUNNR", "NAME1"));
  }, [allOrderShipToParty]);

  // Plant
  useEffect(() => {
    setPlantOptions(filterOptions(allOrderSupplyingPlants, "WERKS", "NAME1"));
  }, [allOrderSupplyingPlants]);

  // Material
  useEffect(() => {
    setMaterialOptions(filterOptions(allOrderMaterial, "MATNR", "MAKTX"));
  }, [allOrderMaterial]);

  // Common Handle Change
  const commonHandleChange = (data, filedName) => {
    if (filedName === "SHIP_TO_PARTY") {
      setShipToPartyValue(data);
      setSelectedShiptoparty({ KUNNR: data?.value });
    } else if (filedName === "PLANT") {
      setPlantValue(data);
    } else if (filedName === "MATERIAL") {
      setMaterialValue(data);
      setSelectedMaterial({ MATNR: data?.value });
    }
  };

  useEffect(() => {
    console.log(selectedShiptoparty);
    if (
      selectedShiptoparty?.KUNNR !== undefined &&
      selectedShiptoparty?.NAME1 !== undefined
    ) {
      let value = selectedShiptoparty?.KUNNR;
      value = value.replace(/^0+/, "");
      console.log(value);
      setShipToPartyValue({
        value: value,
        label: selectedShiptoparty?.KUNNR + " - " + selectedShiptoparty?.NAME1,
      });
    }
  }, [selectedShiptoparty]);

  return (
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
                Order No: <span className="id-name">{id}</span>
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
                  {/* <i className="fas fa-angle-down icons"></i> */}
                  {/* <select
                    key={allOrderTypes}
                    className="order-select disabled-input"
                    disabled={true}
                    name="DOC_TYPE"
                    ref={register}
                  >
                    {allOrderTypes.map((ele, i) => (
                      <option key={i} value={ele.AUART}>
                        {ele.AUART} - {ele.BEZEI}
                      </option>
                    ))}
                  </select> */}
                  <input
                    type="text"
                    ref={register}
                    name="DOC_TYPE"
                    disabled
                    className="disabled-input"
                  />
                  {errors.DOC_TYPE && (
                    <p className="form-error">This field is required</p>
                  )}
                </div>
              </div>
            </div>
            <div className="col">
              <div className="row">
                <div className="col-3">
                  <label>Trans. Zone</label>
                </div>
                <div className="col-9">
                  <input
                    className="disabled-input"
                    type="text"
                    name="TRANS_ZONE"
                    ref={register}
                    disabled={true}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col">
              <div className="row">
                <div className="col-3">
                  <label>
                    Sold To Party<span>*</span>
                  </label>
                </div>
                <div className="col-9">
                  <div
                  // onClick={() => {
                  //   if (currentState === "1") {
                  //     setsoldToPartyModalVisble(true);
                  //   }
                  // }}
                  >
                    {/* <i className="far fa-clone click-icons"></i> */}
                    <input
                      type="text"
                      className="sold-input disabled-input"
                      disabled={true}
                      name="SOLD_TO_PARTY"
                      ref={register}
                      onFocus={() => {
                        if (currentState === "1") {
                          setsoldToPartyModalVisble(true);
                        }
                      }}
                      readOnly
                    />
                    {errors.SOLD_TO_PARTY && (
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
                    Ship to Party<span>*</span>
                  </label>
                </div>
                <div className="col-9">
                  <div>
                    <i
                      className="far fa-clone click-icons"
                      onClick={() => {
                        if (
                          currentState === "1" &&
                          !defaultSoDetails.DMS_REQID &&
                          defaultSoDetails.GBSTA !== "B"
                        ) {
                          setSearchModalConfig({
                            show: true,
                            title: "Ship to party",
                            keys: ["KUNNR", "NAME1"],
                            keylabels: [
                              "Customer Number",
                              "Customer Name",
                              "Sales Group",
                              "Sales Group Description",
                              "Transportation Zone",
                              "Transportation Zone Desc.",
                              "City",
                              "District",
                              "Region",
                            ],
                            labels: [
                              "Customer Number",
                              "Customer Name",
                              "Sales Group",
                              "Sales Group Description",
                              "Transportation Zone",
                              "Transportation Zone Desc.",
                              "City",
                              "District",
                              "Region",
                            ],
                            labelindex: [
                              "KUNNR",
                              "NAME1",
                              "VKGRP",
                              "VKGRP_DESC",
                              "LZONE",
                              "LZONE_DESC",
                              "ORT01",
                              "ORT02",
                              "REGIO_DESC",
                            ],
                            return_field_key: "SHIP_TO_PARTY",
                            return_field_value: [
                              "KUNNR",
                              "NAME1",
                              "VKGRP",
                              "VKGRP_DESC",
                              "LZONE",
                              "LZONE_DESC",
                              "ORT01",
                              "ORT02",
                              "REGIO_DESC",
                            ],
                            data: allOrderShipToParty,
                            setStateFunction: setSelectedShiptoparty,
                          });
                        }
                      }}
                    ></i>

                    <Select
                      classNamePrefix="react-select"
                      isDisabled={
                        currentState === "2" ||
                        defaultSoDetails.DMS_REQID ||
                        defaultSoDetails.GBSTA === "B"
                      }
                      value={
                        Object.keys(shipToPartyValue).length > 0
                          ? shipToPartyValue
                          : shipToPartyOptions[0]
                      }
                      options={shipToPartyOptions}
                      name="SHIP_TO_PARTY"
                      // ref={register}
                      cacheOptions
                      defaultOptions
                      placeholder={""}
                      onChange={(e) => commonHandleChange(e, "SHIP_TO_PARTY")}
                    />
                    {/* <input
                      type="text"
                      className="ship-input"
                      name="SHIP_TO_PARTY"
                      ref={register}
                      onFocus={() => {
                        if (currentState === "1") {
                          setSearchModalConfig({
                            show: true,
                            title: "Ship to party",
                            keys: ["KUNNR", "NAME1"],
                            keylabels: [
                              "Customer Number",
                              "Customer Name",
                              "Sales Group",
                              "Sales Group Description",
                              "Transportation Zone",
                              "Transportation Zone Desc.",
                              "City",
                              "District",
                              "Region",
                            ],
                            labels: [
                              "Customer Number",
                              "Customer Name",
                              "Sales Group",
                              "Sales Group Description",
                              "Transportation Zone",
                              "Transportation Zone Desc.",
                              "City",
                              "District",
                              "Region",
                            ],
                            labelindex: [
                              "KUNNR",
                              "NAME1",
                              "VKGRP",
                              "VKGRP_DESC",
                              "LZONE",
                              "LZONE_DESC",
                              "ORT01",
                              "ORT02",
                              "REGIO_DESC",
                            ],
                            return_field_key: "SHIP_TO_PARTY",
                            return_field_value: [
                              "KUNNR",
                              "NAME1",
                              "VKGRP",
                              "VKGRP_DESC",
                              "LZONE",
                              "LZONE_DESC",
                              "ORT01",
                              "ORT02",
                              "REGIO_DESC",
                            ],
                            data: allOrderShipToParty,
                            setStateFunction: setSelectedShiptoparty,
                          });
                        }
                      }}
                      readOnly
                    /> */}
                    {errors.SHIP_TO_PARTY && (
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
                  {selectedSalesArea.VKORG === "BC01" ? (
                    <div
                      onClick={() => {
                        if (
                          currentState === "1" &&
                          defaultSoDetails.GBSTA !== "B"
                        ) {
                          setSearchModalConfig({
                            show: true,
                            title: "Supplying Plant",
                            keys: ["WERKS", "NAME1"],
                            keylabels: ["Plant Number", "Plant Name"],
                            labels: [
                              "Plant Number",
                              "Plant Name",
                              "Priority",
                              "Primary Cost",
                              "Secondary Cost",
                              "Handling Charge",
                              "Total Cost",
                              "Currency Key",
                            ],
                            labelindex: [
                              "WERKS",
                              "NAME1",
                              "INDEX1",
                              "PRIMARY",
                              "SECONDARY",
                              "HANDLING",
                              "TOTAL",
                              "WAERS",
                            ],
                            return_field_key: "PLANT",
                            return_field_value: ["WERKS", "NAME1"],
                            data: allOrderSupplyingPlants,
                            setStateFunction: setSelectedSupplyingPlant,
                          });
                        }
                      }}
                    >
                      <i className="far fa-clone click-icons"></i>
                      {/* <Select
                        isDisabled={currentState === "2"}
                        cacheOptions
                        defaultOptions
                        value={
                          Object.keys(plantValue).length > 0
                            ? plantValue
                            : plantOptions[0]
                        }
                        options={plantOptions}
                        onChange={(e) => commonHandleChange(e, "PLANT")}
                        ref={register}
                        name="PLANT"
                        placeholder={"Plant"}
                      /> */}
                      {/* <i className="far fa-clone click-icons"></i> */}

                      <input
                        type="text"
                        className="mat-input"
                        name="PLANT"
                        ref={register}
                        readOnly
                        disabled={defaultSoDetails.GBSTA === "B"}
                      />
                      {errors.PLANT && (
                        <p className="form-error">This field is required</p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <i
                        className="far fa-clone click-icons"
                        onClick={() => {
                          if (
                            currentState === "1" &&
                            defaultSoDetails.GBSTA !== "B"
                          ) {
                            setSearchModalConfig({
                              show: true,
                              title: "Supplying Plant",
                              keys: ["WERKS", "NAME1"],
                              keylabels: ["Plant Number", "Plant Name"],
                              labels: ["Plant Number", "Plant Name"],
                              labelindex: ["WERKS", "NAME1"],
                              return_field_key: "PLANT",
                              return_field_value: ["WERKS", "NAME1"],
                              data: allOrderSupplyingPlants,
                              setStateFunction: setSelectedSupplyingPlant,
                            });
                          }
                        }}
                      ></i>
                      {/* <Select
                        isDisabled={currentState === "2"}
                        cacheOptions
                        defaultOptions
                        value={
                          Object.keys(plantValue).length > 0
                            ? plantValue
                            : plantOptions[0]
                        }
                        options={plantOptions}
                        onChange={(e) => commonHandleChange(e, "PLANT")}
                        ref={register}
                        name="PLANT"
                        placeholder={"Plant"}
                      /> */}
                      <input
                        type="text"
                        className="mat-input"
                        name="PLANT"
                        ref={register}
                        readOnly
                        disabled={defaultSoDetails.GBSTA === "B"}
                      />
                      {errors.PLANT && (
                        <p className="form-error">This field is required</p>
                      )}
                    </div>
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
                    Sales Area<span>*</span>
                  </label>
                </div>
                <div className="col-9">
                  <i className="fas fa-angle-down icons"></i>
                  <select
                    disabled={true}
                    key={allOrderSalesArea}
                    className="sales-select disabled-input"
                    // disabled={currentState === "2"}
                    ref={register}
                    onChange={(e) => {
                      setSelectedSalesArea(allOrderSalesArea[e.target.value]);
                    }}
                    name="SALES_AREA"
                  >
                    {allOrderSalesArea.map((ele, i) => (
                      <option key={i} value={i}>
                        {ele.display_name}
                      </option>
                    ))}
                  </select>
                  {errors.SALES_AREA && (
                    <p className="form-error">This field is required</p>
                  )}
                </div>
              </div>
            </div>
            <div className="col">
              <div className="row">
                <div className="col-3">
                  <label>
                    Material#<span>*</span>
                  </label>
                </div>
                <div className="col-9">
                  <div>
                    <i
                      className="far fa-clone click-icons"
                      onClick={() => {
                        if (
                          currentState === "1" &&
                          defaultSoDetails.GBSTA !== "B"
                        ) {
                          setSearchModalConfig({
                            show: true,
                            title: "Material",
                            keys: ["MATNR", "MAKTX"],
                            keylabels: ["Material Number", "Material Name"],
                            labels: ["Material Number", "Material Name"],
                            labelindex: ["MATNR", "MAKTX"],
                            return_field_key: "MATERIAL",
                            return_field_value: ["MATNR", "MAKTX"],
                            data: allOrderMaterial,
                            setStateFunction: setSelectedMaterial,
                          });
                        }
                      }}
                    ></i>

                    <Select
                      cacheOptions
                      defaultOptions
                      value={
                        Object.keys(materialValue).length > 0
                          ? materialValue
                          : []
                      }
                      options={materialOptions}
                      onChange={(e) => commonHandleChange(e, "MATERIAL")}
                      ref={register({ required: true })}
                      name="MATERIAL"
                      placeholder={""}
                      isDisabled={
                        currentState === "2" || defaultSoDetails.GBSTA === "B"
                      }
                      classNamePrefix="react-select"
                    />
                    {/* <input
                      type="text"
                      className="mat-input"
                      name="MATERIAL"
                      ref={register}
                      onFocus={() => {
                        if (currentState === "1") {
                          setSearchModalConfig({
                            show: true,
                            title: "Material",
                            keys: ["MATNR", "MAKTX"],
                            keylabels: ["Material Number", "Material Name"],
                            labels: ["Material Number", "Material Name"],
                            labelindex: ["MATNR", "MAKTX"],
                            return_field_key: "MATERIAL",
                            return_field_value: ["MATNR", "MAKTX"],
                            data: allOrderMaterial,
                            setStateFunction: setSelectedMaterial,
                          });
                        }
                      }}
                      readOnly
                    /> */}
                    {errors.MATERIAL && (
                      <p className="form-error">This field is required</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="col">
              <div className="row">
                <div className="col-3">
                  <label>Diversion</label>
                </div>
                <div className="col-2">
                  <div className="center">
                    <label className="label">
                      <input
                        disabled={true}
                        className="label__checkbox"
                        type="checkbox"
                        name="DIVERSION"
                        ref={register}
                      />
                      <span className="label__text">
                        <span className="label__check">
                          <i className="fa fa-check icon"></i>
                        </span>
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="divider"></div>

          <div className="row"></div>
          <div className="row">
            <div className="col">
              <div className="row">
                <div className="col-3">
                  <label>
                    Quantity<span>*</span>
                  </label>
                  <br />
                  <br />
                  <label>UOM</label>
                </div>
                <div className="col-9">
                  <div>
                    <input
                      step="0.05"
                      type="number"
                      className="quan-input"
                      name="TARGET_QTY"
                      ref={register}
                      disabled={
                        currentState === "2" ||
                        defaultSoDetails.DMS_REQID ||
                        defaultSoDetails.GBSTA === "B"
                      }
                    />
                    {errors.TARGET_QTY && (
                      <p className="form-error">This field is required</p>
                    )}

                    <input
                      type="text"
                      name="UOM"
                      ref={register}
                      disabled={true}
                      className="disabled-input"
                    />
                  </div>
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
                    key={allOrderShippingTypes}
                    className="ship-select"
                    disabled={
                      currentState === "2" || defaultSoDetails.GBSTA === "B"
                    }
                    name="SHIP_TYPE"
                    ref={register}
                    onChange={(e) => selectValue(e)}
                  >
                    {allOrderShippingTypes.map((ele, i) => (
                      <option key={i} value={ele.VSART}>
                        {ele.VSART} - {ele.BEZEI}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            {/* <div className="col">
              <div className="row">
                <div className="col-3">
                  <label>Diversion</label>
                </div>
                <div className="col-2">
                  <div className="center">
                    <label className="label">
                      <input
                        disabled={true}
                        className="label__checkbox"
                        type="checkbox"
                        name="DIVERSION"
                        ref={register}
                      />
                      <span className="label__text">
                        <span className="label__check">
                          <i className="fa fa-check icon"></i>
                        </span>
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div> */}
          </div>

          <div className="divider"></div>

          <div className="row">
            {/* <div className="col">
              <div className="row">
                <div className="col-3">
                  <label>
                    Inco Term1<span>*</span>
                  </label>
                </div>
                <div className="col-9">
                  <input
                    className="disabled-input"
                    type="text"
                    name="INCO_TERM1"
                    ref={register}
                    disabled={true}
                  />
                  {errors.INCO_TERM1 && (
                    <p className="form-error">This field is required</p>
                  )}
                </div>
              </div>
            </div> */}

            <div className="col">
              <div className="row">
                <div className="col-3">
                  <label>
                    Inco Term1<span>*</span>
                  </label>
                </div>
                <div className="col-9">
                  <i className="fas fa-angle-down icons"></i>
                  <select
                    key={allOrderIncoTerms}
                    className="order-select"
                    disabled={
                      currentState === "2" || defaultSoDetails.GBSTA === "B"
                    }
                    name="INCO_TERM1"
                    ref={register({
                      required: true,
                    })}
                  >
                    {allOrderIncoTerms.map((ele, i) => (
                      <option key={i} value={ele.INCO1}>
                        {ele.INCO1} - {ele.BEZEI}
                      </option>
                    ))}
                  </select>
                  {errors.INCO_TERM1 && (
                    <p className="form-error">This field is required</p>
                  )}
                </div>
              </div>
            </div>

            <div className="col">
              <div className="row">
                <div className="col-3">
                  <label>
                    Doc Date<span>*</span>
                  </label>
                </div>
                <div className="col-9">
                  <input
                    className="disabled-input"
                    type="date"
                    disabled={true}
                    name="DOC_DATE"
                    ref={register}
                    defaultValue={moment().format("YYYY-MM-DD")}
                  />
                  {errors.DOC_DATE && (
                    <p className="form-error">This field is required</p>
                  )}
                </div>
              </div>
            </div>
            {selectedSalesArea.VKORG === "BC01" ? (
              <div className="col">
                <div className="row">
                  <div className="col-3">
                    <label>
                      {/* L2/L3 Reason<span>*</span> */}
                      {/* Date: 15/12/2025 L2/L3 Reason Input Box Non-Mandatory */}
                      L2/L3 Reason<span></span>  
                    </label>
                  </div>
                  <div className="col-9">
                    {reason === "" ? (
                      <input type="text" className="disabled-input" disabled />
                    ) : (
                      <select
                        ref={register({ required: true })}
                        onChange={(e) => setReason(e.target.value)}
                        style={{ width: "100% " }}
                        disabled={defaultSoDetails.GBSTA === "B"}
                      >
                        {/* <option selected={reason === ""}>Select</option> */}
                        {allReason?.map((row, i) => (
                          <option
                            selected={row.REASON_CODE === reason}
                            value={row.REASON_CODE}
                          >
                            {row.REASON_CODE} - {row.REASON_DESC}
                          </option>
                        ))}
                      </select>
                    )}
                    {errors.DOC_DATE && (
                      <p className="form-error">This field is required</p>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="row">
            <div className="col">
              <div className="row">
                <div className="col-3">
                  <label>
                    Shipping Point<span>*</span>
                  </label>
                </div>
                <div className="col-8">
                  <i className="fas fa-angle-down icons"></i>
                  <select
                    key={allOrderShippingPoint}
                    className="shipping-input"
                    name="SHIP_POINT"
                    ref={register}
                    disabled={
                      currentState === "2" || defaultSoDetails.GBSTA === "B"
                    }
                  >
                    {allOrderShippingPoint.map((ele, i) => (
                      <option
                        key={i}
                        value={ele.VSTEL}
                      >{`${ele.VSTEL}-${ele.VTEXT}`}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="col">
              <div className="row">
                <div className="col-3">
                  <label>
                    Sales Promoter<span></span>
                  </label>
                </div>
                <div className="col-9">
                  <i
                    className="fas fa-angle-down click-icons"
                    onClick={() => {
                      if (defaultSoDetails.GBSTA !== "B") {
                        setIsCustomModalVisible(!isCustomSelectVisible);
                      }
                    }}
                  ></i>
                  <input
                    disabled={true}
                    type="text"
                    ref={register}
                    name="SALES_PROMOTER"
                  />
                  <div
                    className={
                      "custom-select-wrapper-container" +
                      (isCustomSelectVisible ? " d-block" : " d-none")
                    }
                  >
                    <ul className="custom-select-wrapper">
                      {allPromoters.map((ele, i) => (
                        <li
                          className="custom-li"
                          style={{ cursor: "pointer", textAlign: "left" }}
                          key={i}
                          onClick={() => {
                            setValue("SALES_PROMOTER", ele.NAME1);
                            setIsCustomModalVisible(false);
                          }}
                        >
                          {ele.NAME1}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col">
              <div className="row">
                <div className="col-6">
                  <label>Armaan NIrmaan Order ID</label>
                </div>
                <div className="col-6">
                  <input
                    className=""
                    type="text"
                    name="IM_PO"
                    ref={register}
                    disabled={
                      currentState === "2" || defaultSoDetails.GBSTA === "B"
                    }
                  />
                </div>
              </div>
            </div>
            <div className="col">
              <div className="row">
                <div className="col-3">
                  <label>Customer purchase order date</label>
                </div>
                <div className="col-9">
                  <input
                    type="date"
                    disabled={
                      currentState === "2" || defaultSoDetails.GBSTA === "B"
                    }
                    name="IM_PODATE"
                    ref={register}
                    defaultValue={moment().format("YYYY-MM-DD")}
                  />
                  {errors.DOC_DATE && (
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
                  <label>Remarks</label>
                </div>
                <div className="col-9">
                  <input
                    // disabled={true}
                    className="remarks"
                    type="text-area"
                    name="REMARKS"
                    ref={register}
                    disabled={
                      currentState === "2" || defaultSoDetails.GBSTA === "B"
                    }
                  />
                </div>
              </div>
            </div>
            <div className="col">
              <div className="row">
                <div className="col-3">
                  <label>Reason of rejection</label>
                </div>
                <div className="col-9">
                  <i className="fas fa-angle-down icons"></i>
                  <select
                    key={allReasonOfRejection}
                    className="order-select"
                    disabled={currentState === "2"}
                    name="IM_REJ_REASON"
                    ref={register}
                  >
                    <option key="-1" value="select">
                      select
                    </option>
                    {allReasonOfRejection.map((ele, i) => (
                      <option key={i} value={ele.ABGRU}>
                        {ele.ABGRU} - {ele.BEZEI}
                      </option>
                    ))}
                  </select>
                  {errors.IM_REJ_REASON && (
                    <p className="form-error">This field is required</p>
                  )}
                </div>
              </div>
            </div>
          </div>

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
                  onClick={saveFormData}
                >
                  Save
                </button>
              </React.Fragment>
            ) : (
              <React.Fragment>
                <Link to="/dashboard/sales-order/list">
                  <button className="button button" style={{ color: "#" }}>
                    Back to Order List
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

      <div
        style={{ display: "block" }}
        className={currentState === "3" ? "row input-area" : "d-none"}
      >
        {Object.keys(salesEditResponse).length > 0
          ? salesEditResponse.map((msg, i) => (
            <div style={{ margin: "25px 0px" }}>
              <img className="success-img" src="/images/success_tick.jpeg" />
              &nbsp;&nbsp;&nbsp;
              <span className="success-msg">{msg.MESSAGE}</span>
              <br />
            </div>
          ))
          : null}
        <Link
          to="/dashboard/sales-order/list"
          style={{ position: "absolute", right: "15px", top: "0" }}
        >
          <button className="button button-foreword" style={{ color: "#" }}>
            Back to Order List
          </button>
        </Link>
      </div>

      {/* Plant 2 Modal */}

      <Modal
        show={isPlant2ModalVisible}
        size="lg"
        centered
        className="modal"
      // onHide={() => setIsPlant2ModalVisible(false)}
      >
        <Modal.Header>
          <Modal.Title>Select Plant Entries</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="modal-div">
            <Table size="sm" className="modal-table">
              <thead className="modal-thead">
                <tr className="modal-table-tr">
                  <th className="modal-table-th float-center">Plant</th>
                  <th className="modal-table-th float-center">Name</th>
                  <th className="modal-table-th float-center">Priority</th>
                  <th className="modal-table-th float-center">Primary Cost</th>
                  <th className="modal-table-th float-center">
                    Secondary Cost
                  </th>
                  <th className="modal-table-th float-center">
                    Handling Charge
                  </th>
                  <th className="modal-table-th float-center">Total Cost</th>
                  <th className="modal-table-th float-center">Currency Key</th>
                  <th className="modal-table-th float-center">Select</th>
                </tr>
              </thead>
              <tbody className="modal-table-tbody">
                {plant2Data?.map((row, i) => (
                  <tr
                    className="modal-table-tr"
                    key={i}
                    onClick={() => {
                      setSelectedPlant2(row);
                      fetchReason(row);
                      setValue("PLANT", `${row.WERKS} - ${row.NAME1}`);
                      setIsPlant2ModalVisible(false);
                      setSelectedSupplyingPlant(row);
                      //setFinalFormData(row);
                      setINDEX(row.INDEX1);
                    }}
                  >
                    <td>{row.WERKS}</td>
                    <td>{row.NAME1}</td>
                    <td>{row.INDEX1}</td>
                    <td>{row.PRIMARY}</td>
                    <td>{row.SECONDARY}</td>
                    <td>{row.HANDLING}</td>
                    <td>{row.TOTAL}</td>
                    <td>{row.WAERS}</td>
                    <td>
                      <button
                        className="button search-button"
                        onClick={(ev) => {
                          ev.stopPropagation();                      // <-- FIX
                          setSelectedPlant2(row);
                          fetchReason(row);
                          setValue("PLANT", `${row.WERKS} - ${row.NAME1}`);
                          setIsPlant2ModalVisible(false);
                          setSelectedSupplyingPlant(row);
                          //setFinalFormData(row);
                          setINDEX(row.INDEX1);
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
            onClick={() => setIsPlant2ModalVisible(false)}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>
      {/* plant2 modal close*/}

      {/* Reason Modal */}

      <Modal
        show={isReasonModalVisible}
        size="lg"
        centered
        className="modal"
        onHide={() => setIsReasonModalVisible(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>Select Reason Entries</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="modal-div">
            <Table size="sm" className="modal-table">
              <thead className="modal-thead">
                <tr className="modal-table-tr">
                  <th className="modal-table-th float-center">Reason</th>
                  <th className="modal-table-th float-center">
                    Reason Description
                  </th>
                </tr>
              </thead>
              <tbody className="modal-table-tbody">
                {allReason?.map((row, i) => (
                  <tr className="modal-table-tr" key={i}>
                    <td>{row.REASON_CODE}</td>
                    <td>{row.REASON_DESC}</td>
                    <td>
                      <button
                        className="button search-button"
                        onClick={(ev) => {
                          ev.stopPropagation();                   // <-- FIX
                          setIsReasonModalVisible(false);
                          setReason(row.REASON_CODE);
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
            onClick={() => setIsReasonModalVisible(false)}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>
      {/* Reason modal close*/}

      {searchModalConfig.show ? (
        <SearchDialog
          {...searchModalConfig}
          setSearchedValue={setSearchedValue}
          hideIt={() => setSearchModalConfig({ ...default_config })}
        />
      ) : null}

      {soldToPartyModalVisble ? (
        <SearchSoldToParty
          show={soldToPartyModalVisble}
          setSearchedValue={setSearchedValue}
          hideIt={() => setsoldToPartyModalVisble(false)}
          mainKey="SOLD_TO_PARTY"
          setStateFunction={setSelectedSoldtoParty}
        />
      ) : null}

      {showFormResetDialog ? (
        <ConfirmDialog
          show={showFormResetDialog}
          message="Do you really want to clear the form?"
          accept={() => {
            reset();
            setShowFormResetDialog(false);
          }}
          reject={() => setShowFormResetDialog(false)}
          hideIt={() => setShowFormResetDialog(false)}
        />
      ) : null}
    </div>
  );
}

const mapStateToProps = (state) => ({
  Auth: state.Auth,
});

export default connect(mapStateToProps, { loading })(SalesOrderEdit);
