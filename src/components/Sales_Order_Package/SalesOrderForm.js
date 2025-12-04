import React, { useState, useEffect } from "react";
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
import Modal from "react-bootstrap/Modal";
import Table from "react-bootstrap/Table";
import AsyncSelect from "react-select/async";
import { v4 as uuidv4 } from "uuid";
import { useRef } from "react";
import Select from "react-select";
import fetchCustomerNumber from "../../Functions/fetchCustomer";
import filterOptions from "../../Functions/filterData";
import filterOptionsMaterial from "../../Functions/filterOptionsMaterial";
import { getLocalData, setLocalData } from "../../services/localStorage";
import usePlant from "../../hook/usePlant";
import SONewRFC from "./SORFC";
import GSTCheck from "./GSTCheck";
import checkAndCreateOrder from "./CheckOrderSame";

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

function SalesOrderForm(props) {
  const [currentState, setCurrentState] = useState("1");
  // 🚀 Duplicate-Order Protection
  const isSubmittingRef = useRef(false);     // prevents double "Next"
  const isSavingRef = useRef(false);         // prevents double saveFormData calls
  // UUID is assigned freshly whenever user saves
  const uuidRef = useRef(null);

  // Generates a fresh GUID and stores it in both ref + localStorage
  const generateFreshUUID = () => {
    const newID = uuidv4();
    uuidRef.current = newID;
    localStorage.setItem("salesOrderUUID", newID);

    console.log("%cNEW UUID GENERATED → " + newID,
      "color: green; font-size: 14px; font-weight: bold;");

    return newID;
  };



  const {
    register,
    handleSubmit,
    watch,
    errors,
    setValue,
    triggerValidation,
    reset,
    getValues,
    control,
  } = useForm({
    mode: "onSubmit",
    reValidateMode: "onChange",
  });
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
  const [createdSalesDocument, setCreatedSalesDocument] = useState("");
  const [salesOrderResponse, setSalesOrderResponse] = useState([]);
  const [isCustomSelectVisible, setIsCustomModalVisible] = useState(false);
  const [allPromoters, setAllPromoters] = useState([]);
  const [shipToParty, setShiptoparty] = useState("");
  const [plant2Data, setPlant2Data] = useState([]);
  //const [selectedShippingType, setSelectedShippingType] = useAsyncState("");
  const [selectedShippingType, setSelectedShippingType] = useState("");
  const [selectAllOrderType, setAllOrderType] = useState("");
  const [isPlant2ModalVisible, setIsPlant2ModalVisible] = useState(false);
  const [selectedPlant2, setSelectedPlant2] = useState([]);
  const [isReasonModalVisible, setIsReasonModalVisible] = useState(false);
  const [allReason, setAllReason] = useState([]);
  const [reason, setReason] = useState("");
  const [shippingCounter, setShippingCounter] = useState(0);
  const [disabledSP, setDisabledSP] = useState(false);
  const [isValidDocType, setIsValidDocType] = useState(false);
  const [salesOrderStatus, setSalesOrderStatus] = useState([]);
  const [value, setval] = useState([]);
  const [shipToPartyOptions, setShipToParty] = useState([]);
  const [shipToPartyValue, setShipToPartyValue] = useState([]);
  const [plantValue, setPlantValue] = useState([]);
  const [plantOptions, setPlantOptions] = useState([]);
  const [materialOptions, setMaterialOptions] = useState([]);
  const [materialValue, setMaterialValue] = useState([]);

  // Auto-resets button locks
  useEffect(() => {
    if (currentState === "1") {
      isSubmittingRef.current = false;
      isSavingRef.current = false;
    }
  }, [currentState]);

  // Cleanup UUID after successful order or when component unmounts
  useEffect(() => {
    if (currentState === "3") {
      localStorage.removeItem("salesOrderUUID");
      uuidRef.current = null;
    }
  }, [currentState]);

  useEffect(() => {
    return () => {
      uuidRef.current = null;
      localStorage.removeItem("salesOrderUUID");
    };
  }, []);


  //+++++++++++++++++++++++++++++++++++++++++++++++++form submit handler++++++++++++++++++++++++++++++++++++++++++
  const onSubmit = async (data) => {
    if (isSubmittingRef.current) {
      console.warn("Prevented duplicate onSubmit");
      return;
    }
    isSubmittingRef.current = true;
    try {
      const res = await http.post(apis.COMMON_POST_WITH_FM_NAME, {
        fm_name: "ZRFC_DOCTYPE_PLANT_CHECK",
        params: {
          IM_AUART: selectAllOrderType,
          IM_WERKS: selectedSupplyingPlant.WERKS,
        },
      });
      await checkDOCTypeAll(res.data.result.ET_RETURN, data);
    } catch (err) {
      console.error("onSubmit error:", err);
      // optionally show user friendly alert
      Swal.fire({ title: "Error", text: "Failed to validate document type.", icon: "error" });
    } finally {
      // release submit lock so user can retry if needed
      isSubmittingRef.current = false;
    }
  };


  const checkDOCTypeAll = (data, dataOfForm) => {
    let isError = false;
    for (let i = 0; i < data.length; i++) {
      if (data[i].TYPE === "E") {
        isError = true;
        Swal.fire({
          title: data[i].MESSAGE,
          icon: "error",
        });
      }
      // setIsValidDocType(isError);
    }
    if (!isError) {
      checkLoginMatrix(dataOfForm);
    }
  };

  const checkLoginMatrix = (data) => {
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
      });
  };

  //+++++++++++++++++++++++++++++++++++++++++++++++++form submit handler end++++++++++++++++++++++++++++++++++++++++++

  function useAsyncState(initialValue) {
    const [value, setValue] = useState(initialValue);
    const setter = (x) =>
      new Promise((resolve) => {
        setValue(x);
        resolve(x);
      });
    return [value, setter];
  }

  //+++++++++++++++++++++++++++++++++++++++++++++++++save form data to server+++++++++++++++++++++++++++++++++++++++++++++++++++++
  let saveFormData = async (confirm = "") => {

    console.log(
      "%c[SAVE_ATTEMPT] Starting save... confirm=" + confirm,
      "color:#007bff;font-weight:bold;"
    );

    // Create GUID
    const UUID = generateFreshUUID();
    console.log(
      "%c[UUID_GENERATED] New GUID → " + UUID,
      "color:green;font-size:14px;font-weight:bold;"
    );

    if (!finalFormData || Object.keys(finalFormData).length === 0) {
      Swal.fire({
        title: "Error",
        text: "Form is incomplete. Please review before saving.",
        icon: "error",
      });
      isSavingRef.current = false;
      return;
    }

    console.log(
      "%c[FINAL_FORM_DATA] Values collected before building RFC body:",
      "color:#6f42c1;font-weight:bold;"
    );
    console.log(finalFormData);

    let incoDesc = allOrderIncoTerms.filter(
      (d) => d.INCO1 === finalFormData?.INCO_TERM1
    );
    incoDesc = incoDesc[0]?.BEZEI;

    let body = {
      order_header: {
        DOC_TYPE: finalFormData.DOC_TYPE,
        SALES_ORG: selectedSalesArea.VKORG,
        DISTR_CHAN: selectedSalesArea.VTWEG,
        DIVISION: selectedSalesArea.SPART,
        DOC_DATE: finalFormData.DOC_DATE.split("-").join(""),
        SHIP_TYPE: finalFormData.SHIP_TYPE,
        INCOTERMS1: finalFormData?.INCO_TERM1,
        INCOTERMS2: incoDesc,
        CREATED_BY: localStorage.getItem("user_code"),
      },
      order_items: [
        {
          MATERIAL: selectedMaterial.MATNR,
          PLANT: selectedSupplyingPlant.WERKS,
          SHIP_TYPE: finalFormData.SHIP_TYPE,
          SHIP_POINT: finalFormData.SHIP_POINT,
          ITM_NUMBER: "000010",
          SALES_UNIT: finalFormData.SALES_UNIT,
          TARGET_QTY: finalFormData.TARGET_QTY,
          TARGET_QU: finalFormData.SALES_UNIT,
        },
      ],
      partners: [
        { PARTN_ROLE: "WE", PARTN_NUMB: selectedShiptoparty.KUNNR, ITM_NUMBER: "000000" },
        { PARTN_ROLE: "AG", PARTN_NUMB: selectedSoldtoParty.KUNNR, ITM_NUMBER: "000000" },
      ],
      lines: {
        TDFORMAT: "*",
        TDLINE: finalFormData.REMARKS,
      },
      order_schedule: {
        ITM_NUMBER: "000010",
        SCHED_LINE: "0001",
        REQ_QTY: finalFormData.TARGET_QTY,
        REQ_DATE: finalFormData.DOC_DATE.split("-").join(""),
        DATE_TYPE: "1",
      },

      IM_L2_REASON: reason ? reason : "",
      IM_GUID: UUID,
      IM_LOGIN_ID: localStorage.getItem("user_code"),
      IM_DUP_CONFIRM: confirm,
      IM_DMS_REQID: "",
    };

    // --------------------------
    // DUPLICATE CHECK
    // --------------------------
    let returnData = null;
    try {
      returnData = await checkAndCreateOrder({
        soldTo: selectedSoldtoParty.KUNNR,
        shipTo: selectedShiptoparty.KUNNR,
        quantity: finalFormData.TARGET_QTY,
      });
    } catch (err) {
      console.error("checkAndCreateOrder threw:", err);
      isSavingRef.current = false;
      isSubmittingRef.current = false;
      localStorage.removeItem("salesOrderUUID");
      Swal.fire({ title: "Error", text: "Duplicate check failed. Try again.", icon: "error" });
      return;
    }

    // ⛔ User clicked CANCEL on duplicate popup
    if (!returnData.proceed) {
      console.log("%c[USER_CANCELLED_DUPLICATE] Save stopped.", "color:orange;font-weight:bold;");
      isSavingRef.current = false;
      isSubmittingRef.current = false;
      localStorage.removeItem("salesOrderUUID");
      return;
    }

    // ✔ User clicked YES — pass IM_DUP_CONFIRM = 'Y'
    if (returnData.confirm === "Y") {
      body.IM_DUP_CONFIRM = "Y";
      console.log("%c[CONFIRM_DUPLICATE] IM_DUP_CONFIRM = Y", "color:green;font-weight:bold;");
    }

    // --------------------------
    // RFC STRUCTURE PREPARATION
    // --------------------------
    const ORDER_HEADER_IN = { ...body.order_header };
    let ORDER_HEADER_INX = {};
    Object.keys(body.order_header).forEach((k) => {
      ORDER_HEADER_INX[k] = "X";
    });
    delete ORDER_HEADER_INX.CREATED_BY;

    const ORDER_ITEMS_IN = body.order_items;
    let ORDER_ITEMS_INX = ORDER_ITEMS_IN.map((item) => {
      let x = {};
      Object.keys(item).forEach((k) => {
        x[k] = k === "ITM_NUMBER" ? item[k] : "X";
      });
      return x;
    });

    const ORDER_SCHEDULES_IN = [body.order_schedule];
    let ORDER_SCHEDULES_INX = [{
      ...body.order_schedule,
      REQ_QTY: "X",
      REQ_DATE: "X",
      DATE_TYPE: "X",
      UPDATEFLAG: "I",
    }];

    let postData = {
      ORDER_HEADER_IN,
      ORDER_HEADER_INX,
      ORDER_ITEMS_IN,
      ORDER_ITEMS_INX,
      ORDER_PARTNERS: body.partners,
      ORDER_SCHEDULES_IN,
      ORDER_SCHEDULES_INX,
      LINES: [body.lines],
      IM_L2_REASON: body.IM_L2_REASON,
      IM_GUID: body.IM_GUID,
      IM_LOGIN_ID: body.IM_LOGIN_ID,
      IM_DUP_CONFIRM: body.IM_DUP_CONFIRM,
      IM_DMS_REQID: body.IM_DMS_REQID,
    };

    console.log(
      "%c[RFC_CALL] Payload sent to backend:",
      "color:#d63384;font-weight:bold;"
    );
    console.log(postData);

    // --------------------------
    // RFC CALL
    // --------------------------
    try {
      props.loading(true);

      const res = await SONewRFC(postData);

      console.log("%c[RFC_RESPONSE]", "color:#0dcaf0;font-weight:bold;");
      console.log(res);

      if (res.SO_NUMBER) {
        setCreatedSalesDocument(res.SO_NUMBER);
        setSalesOrderResponse(res.DATA);
        setCurrentState("3");
      } else {
        let errmsg = res.DATA.filter((e) => e.TYPE === "E" || e.TYPE === "I");
        let msg = "";
        errmsg.forEach((e, i) => {
          msg += `<p>${i + 1}. ${e.MESSAGE}</p>`;
        });
        Swal.fire({ title: "Error!", html: msg, icon: "error" });
      }

    } catch (error) {
      console.error("RFC Error:", error);

    } finally {
      props.loading(false);
      console.log("%c[UNLOCK] Releasing save locks", "color:#20c997;font-weight:bold;");
      isSavingRef.current = false;
      isSubmittingRef.current = false;
    }
  };


  // Sleep function
  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  //+++++++++++++++++++++++++ Fetch Status of sales order ++++++++++++++++++++++++++//

  const fetchAttemptsRef = useRef(0);
  const MAX_FETCH_ATTEMPTS = 30; // e.g., ~ 1 minute if interval=2s

  let fetchStatus = async () => {
    try {
      props.loading(true);
      const guid = localStorage.getItem("salesOrderUUID");
      if (!guid) return; // nothing to poll

      const data = await http.post(apis.COMMON_POST_WITH_FM_NAME, {
        fm_name: "ZSALES_ORDER_STATUS",
        params: { IM_GUID: guid },
      });

      if (data.data.result?.IM_GUID) {
        if (data.data.result?.EX_STATUS === "P") {
          fetchAttemptsRef.current++;
          if (fetchAttemptsRef.current < MAX_FETCH_ATTEMPTS) {
            setTimeout(fetchStatus, 2000);
          } else {
            // give up after N attempts
            Swal.fire({ title: "Timeout", text: "Order status taking too long. Check later.", icon: "warning" });
          }
        } else {
          setSalesOrderStatus(data.data.result);
          setCurrentState("3");
          localStorage.removeItem("salesOrderUUID");
          fetchAttemptsRef.current = 0;
        }
      } else {
        // no GUID or no result -> stop polling
      }
    } catch (error) {
      console.error("fetchStatus error:", error);
      // schedule retry with backoff
      fetchAttemptsRef.current++;
      if (fetchAttemptsRef.current < MAX_FETCH_ATTEMPTS) {
        setTimeout(fetchStatus, 2000);
      } else {
        Swal.fire({ title: "Error", text: "Unable to fetch order status right now.", icon: "error" });
      }
    } finally {
      props.loading(false);
    }
  };


  //+++++++++++++++++++++++++++++++++++++++++++++++++fetching order types && shipping plants && shipping types+++++++++++++++++++++++++++++++++++++
  useEffect(() => {
    if (getLocalData("order_type")?.length > 0) {
      setAllOrderTypes(getLocalData("order_type"));
      setAllOrderType(getLocalData("order_type")?.[0]?.AUART);
    } else {
      props.loading(true);
      // http
      //   .post(apis.GET_ORDER_TYPES, { vbeln: 1234567899 })
      //   .then((res) => {
      //     if (res.data.status) {
      //       setAllOrderTypes(res.data.result.IT_FINAL);
      //       setAllOrderType(res.data.result.IT_FINAL[0].AUART);
      //       setLocalData("order_type", res.data.result.IT_FINAL);
      //     } else {
      //       console.log("Error");
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
          params: { TYPE: "SO" },
        })
        .then((res) => {
          if (res.data.status) {
            let data = res.data.result.reverse();

            console.log(data);

            setAllOrderTypes(data);
            setAllOrderType(data[0].AUART);
            setLocalData("order_type", data);
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
  }, []);

  // ++++++++++++++++++++ Plant +++++++++++++++++++//
  const plant = usePlant();

  useEffect(() => {
    if (plant.length > 0) {
      setAllOrderSupplyingPlants(plant);
      setSelectedSupplyingPlant(plant[0]);
      setSearchedValue("PLANT", `${plant[0]["WERKS"]}-${plant[0]["NAME1"]}`);
    }
  }, [plant]);
  //+++++++++++++++++++++++++++++++++++++++++++++++++fetching order types && shipping plants && shipping types end+++++++++++++++++++++++++++++++++++++

  //++++++++++++++++++++++++++++++++++++++++++++++++ fetching plant dependent and material dependent shipping type+++++++++++
  let fetchShippingType = () => {
    props.loading(true);
    http
      // .post(apis.GET_NEW_SHIPPING_TYPE, {
      //   plant: selectedSupplyingPlant.WERKS,
      //   material: selectedMaterial.MATNR,
      // })
      .post(apis.SHIPPING_TYPE_MAINTAINED_TABLE, {
        // TABLE: "SHIPPING_TYPE",
        params: {
          PLANT: selectedSupplyingPlant.WERKS,
          MATERIAL: selectedMaterial.MATNR.replace(/^0+/, ""),
        },
      })
      .then((result) => {
        if (result.data.status) {
          // setSelectedShippingType(result.data.data[0].VSART);
          // setAllOrderShippingTypes(result.data.data);
          setAllOrderShippingTypes(result.data.result);
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
      // let p1 = http.post(apis.GET_ORDER_SHIPPING_POINT, {
      //   lv_plant: selectedSupplyingPlant.WERKS,
      // });
      // add shipping point same as supplying plant
      const findPlant = plant.find(
        (plant) => plant.WERKS === selectedSupplyingPlant.WERKS
      );

      let p1 = Promise.resolve({
        data: {
          status: true,
          result: {
            IT_FINAL: [
              {
                VSTEL: findPlant.WERKS,
                VTEXT: findPlant.NAME1,
              },
            ],
          },
        },
      });

      let p2 = http.post(apis.GET_ORDER_MATERIAL_OF_PLANT, {
        lv_plant: selectedSupplyingPlant.WERKS,
      });
      Promise.all([p1, p2])
        .then((res) => {
          if (res[0].data.status && res[1].data.status) {
            setAllOrderMaterial(res[1].data.result.IT_FINAL);
            setAllOrderShippingPoint(res[0].data.result.IT_FINAL);
            // if (shippingCounter === 0) {
            // setValue("MATERIAL", "");
            // }
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
  }, [selectedSupplyingPlant]);
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
    // if (watchAllFields.SOLD_TO_PARTY && watchAllFields.SOLD_TO_PARTY !== "") {
    if (
      selectedSoldtoParty?.KUNNR !== "" &&
      selectedSoldtoParty?.KUNNR !== undefined
    ) {
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
  }, [selectedSoldtoParty]);

  //+++++++++++++++++++++++++++++++++++++++++++++++++fetching sold to party dependent ship to party and sales area end+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

  //+++++++++++++++++++++++++++++++++++++++++++++++++fetching plant 2++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++//

  let fetchPlant2 = (shippingType) => {
    if (selectAllOrderType !== "ZN02") {
      props.loading(true);
      http
        .post(apis.GET_PLANT2_VALUE, {
          params: {
            IM_KUNNR: selectedSoldtoParty.KUNNR,
            IM_VKORG: selectedSalesArea.VKORG,
            IM_VTWEG: selectedSalesArea.VTWEG,
            IM_SPART: selectedSalesArea.SPART,
            IM_AUART: selectAllOrderType,
            IM_MATNR: selectedMaterial.MATNR,
            IM_VSART: shippingType,
            IM_LOGIN_ID: localStorage.getItem("user_code"),
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

  // useEffect(() => {
  //   console.log("Shipping Type", Object.keys(allOrderShippingTypes.length > 0));
  //   if (Object.keys(allOrderShippingTypes).length > 0) {
  //     console.log("Shipping Type");
  //     fetchPlant2();
  //   }
  // }, [allOrderShippingTypes]);

  //+++++++++++++++++++++++++++++++++Modal++++++++++++++++++++++++++//
  let openPlant2Modal = () => {
    setIsPlant2ModalVisible(true);
  };

  let selectValue = (e) => {
    // console.log(e.target.value, "Shipping Type");
    setSelectedShippingType(e.target.value);
    fetchPlant2(e.target.value);
    if (selectAllOrderType !== "ZN02" && selectedSalesArea.VKORG === "BC01") {
      setIsPlant2ModalVisible(true);
    }
  };

  //++++++++++++++++++++++++++++++++Reason Api++++++++++++++++++++++++//

  // useState(()=>{
  //   console.log("Shipping Type Reason",)
  // },[])

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
          setIsValidDocType(false);
        });
    } else {
      setIsValidDocType(false);
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
          if (res[0].data.status && res[1].data.status && res[2].data.status) {
            setAllOrderIncoTerms(res[0].data.result);
            // if (res[0].data.result.length > 0) {
            //   setSearchedValue(
            //     "INCO_TERM1",
            //     `${res[0].data.result[0].INCO1} - ${res[0].data.result[0].BEZEI}`
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
      setShipToPartyValue({ value: value2, label: value });
    } else if (key === "MATERIAL") {
      value2 = value2?.replace(/^0+/, "");
      value = value?.replace(/^0+/, "");
      setMaterialValue({ value: value2, label: value });
    }
    triggerValidation(key);
  };
  //+++++++++++++++++++++++++++++++++++++++++++++++++setting form value end+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

  // useEffect(()=>{
  //     console.log(selectedSalesArea);
  // },[selectedSalesArea])

  // useEffect(() => {
  //   console.log(selectedShiptoparty);
  // }, [selectedMaterial, selectedSoldtoParty, selectedShiptoparty]);

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

  const PlantCheck = (row) => {
    http
      .post(apis.COMMON_POST_WITH_FM_NAME, {
        fm_name: "ZRFC_DOCTYPE_PLANT_CHECK",
        params: {
          IM_AUART: selectAllOrderType,
          IM_WERKS: row.WERKS,
        },
      })
      .then((res) => checkDOCType(res.data.result.ET_RETURN, row))
      .catch((err) => PlantCheck(row));
  };

  const checkDOCType = (data, row) => {
    let isError = false;
    for (let i = 0; i < data.length; i++) {
      if (data[i].TYPE === "E") {
        isError = true;
        Swal.fire({
          title: data[i].MESSAGE,
          icon: "error",
        });
      }
      setIsValidDocType(isError);
    }
    if (!isError) {
      fetchReason(row);
    }
  };

  // New Logic of Dropdown

  // Sold TO Party
  const loadOptions = async (inputValue) => {
    if (inputValue !== "" && inputValue.length > 4) {
      return await fetchCustomerNumber(inputValue, "KUNNR", "NAME1");
    }
  };

  const handleInputChange = (newValue) => {
    const inputValue = newValue.replace(/\W/g, "");
    return inputValue;
  };

  useEffect(() => {
    if (
      selectedSoldtoParty?.KUNNR !== undefined &&
      selectedSoldtoParty?.NAME1 !== undefined
    ) {
      setval({
        value: selectedSoldtoParty?.KUNNR,
        label:
          selectedSoldtoParty?.KUNNR.replace(/^0+/, "") +
          "-" +
          selectedSoldtoParty?.NAME1,
      });
    }
  }, [selectedSoldtoParty]);

  const handleChange = async (value2) => {
    if (!(await GSTCheck(value2.value))) {
      Swal.fire({
        title: "Error",
        text: "Invalid/Inactive GSTIN NO of Customer",
        icon: "error",
      });
      return;
    }
    setSelectedSoldtoParty({ KUNNR: value2?.value });
    setval({ value: value2?.value, label: value2?.label });
  };

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
    setMaterialOptions(
      filterOptionsMaterial(allOrderMaterial, "MATNR", "MAKTX", "UOM")
    );
  }, [allOrderMaterial]);

  // Common Handle Change
  const commonHandleChange = (data, filedName) => {
    if (filedName === "SHIP_TO_PARTY") {
      setShipToPartyValue(data);
      setSelectedShiptoparty({ KUNNR: data?.value });
    } else if (filedName === "PLANT") {
      setPlantValue(data);
      setSelectedSupplyingPlant({ WERKS: data?.value });
    } else if (filedName === "MATERIAL") {
      setMaterialValue(data);
      setSelectedMaterial({ MATNR: data?.value, UOM: data?.UOM });
    }
  };

  // Common Value Update
  const commonValueUpdate = (filedName, value, label) => { };

  useEffect(() => {
    if (
      selectedSupplyingPlant?.WERKS !== undefined &&
      selectedSupplyingPlant?.NAME1 !== undefined
    ) {
      setPlantValue({
        value: selectedSupplyingPlant?.WERKS,
        label:
          selectedSupplyingPlant?.WERKS + "-" + selectedSupplyingPlant?.NAME1,
      });
    }
  }, [selectedSupplyingPlant]);

  const customStyle = {};

  // FINAL handleSafeSave — UI throttle only
  const handleSafeSave = () => {
    // Prevent ultra-fast repeated clicks
    if (isSavingRef.current) {
      console.warn("⛔ Duplicate save prevented (UI throttle)");
      return;
    }

    // Set lock until saveFormData starts and later unlocks in finally()
    isSavingRef.current = true;

    saveFormData();
  };


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
              <div className="row">
                <div className="col-3">
                  <label>
                    Order Type<span>*</span>
                  </label>
                </div>
                <div className="col-9">
                  <i className="fas fa-angle-down icons"></i>
                  <select
                    key={allOrderTypes}
                    className="order-select"
                    disabled={currentState === "2"}
                    name="DOC_TYPE"
                    ref={register({
                      required: true,
                    })}
                    onChange={(e) => setAllOrderType(e.target.value)}
                  >
                    {allOrderTypes.map((ele, i) => (
                      <option key={i} value={ele.AUART}>
                        {ele.AUART} - {ele.BEZEI}
                      </option>
                    ))}
                  </select>
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
                  <div>
                    <i
                      className="far fa-clone click-icons"
                      onClick={() => {
                        if (currentState === "1") {
                          setsoldToPartyModalVisble(true);
                        }
                      }}
                    ></i>

                    <AsyncSelect
                      classNamePrefix="react-select"
                      cacheOptions
                      loadOptions={loadOptions}
                      defaultOptions
                      onInputChange={handleInputChange}
                      value={value}
                      placeholder={""}
                      styles={customStyle}
                      name={"SOLD_TO_PARTY"}
                      onChange={handleChange}
                      isDisabled={currentState === "2"}
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
                    ></i>
                    <Select
                      value={
                        Object.keys(shipToPartyValue).length > 0
                          ? shipToPartyValue
                          : shipToPartyOptions[0]
                      }
                      options={shipToPartyOptions}
                      name="SHIP_TO_PARTY"
                      cacheOptions
                      defaultOptions
                      placeholder={""}
                      onChange={(e) => commonHandleChange(e, "SHIP_TO_PARTY")}
                      isDisabled={currentState === "2"}
                      classNamePrefix="react-select"
                    />
                    {/* <input
                      type="text"
                      className="ship-input"
                      name="SHIP_TO_PARTY"
                      ref={register({
                        required: true,
                      })}
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
                  <div>
                    {!disabledSP ? (
                      <i
                        className="far fa-clone click-icons"
                        onClick={() => {
                          if (currentState === "1") {
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
                    ) : null}

                    <Select
                      classNamePrefix="react-select"
                      isDisabled={disabledSP || currentState === "2"}
                      cacheOptions
                      defaultOptions
                      value={
                        Object.keys(plantValue).length > 0
                          ? plantValue
                          : plantOptions[0]
                      }
                      options={plantOptions}
                      onChange={(e) => commonHandleChange(e, "PLANT")}
                      name="PLANT"
                      placeholder={"Plant"}
                    />

                    {/* <input
                      disabled={disabledSP}
                      type="text"
                      className={
                        disabledSP ? "mat-input disabled-input" : "mat-input"
                      }
                      name="PLANT"
                      ref={register({
                        required: true,
                      })}
                      onFocus={() => {
                        if (currentState === "1") {
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
                      readOnly
                    /> */}
                    {errors.PLANT && (
                      <p className="form-error">This field is required</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* <div className="row">
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
                    </div> */}

          {/* <div className="divider"></div> */}
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
                    key={allOrderSalesArea}
                    className="sales-select"
                    disabled={currentState === "2"}
                    ref={register({
                      required: true,
                    })}
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
                    ></i>

                    <Select
                      classNamePrefix="react-select"
                      cacheOptions
                      defaultOptions
                      value={
                        Object.keys(materialValue).length > 0
                          ? materialValue
                          : []
                      }
                      options={materialOptions}
                      onChange={(e) => commonHandleChange(e, "MATERIAL")}
                      name="MATERIAL"
                      placeholder={""}
                      isDisabled={currentState === "2"}
                    />

                    {/* <input
                      type="text"
                      className="mat-input"
                      name="MATERIAL"
                      ref={register({
                        required: true,
                      })}
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
                <div className="col">
                  <div className="row">
                    <div className="col-3">
                      <label>Diversion</label>
                    </div>
                    <div className="col-2">
                      <div className="center">
                        <label className="label">
                          <input
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
            </div>
          </div>

          <div className="divider"></div>

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
                      ref={register({
                        required: true,
                      })}
                      disabled={currentState === "2"}
                    />
                    {errors.TARGET_QTY && (
                      <p className="form-error">This field is required</p>
                    )}
                    {/* <select disabled={currentState === "2"} name="TARGET_QU">
                      <option defaultValue>TON</option>
                    </select> */}
                    <input
                      ref={register}
                      name="SALES_UNIT"
                      value={selectedMaterial.UOM}
                      disabled
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="col">
              <div className="row">
                <div className="col-3">
                  <label>Ref to Contact</label>
                </div>
                <div className="col-9">
                  <input
                    type="text"
                    className="ref-input"
                    name="REF_TO_CONTACT"
                    ref={register}
                    disabled={currentState === "2"}
                  />
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
                    disabled={currentState === "2"}
                    name="SHIP_TYPE"
                    ref={register({ required: true })}
                    defaultValue={"Select"}
                    onChange={
                      (e) =>
                        // setSelectedShippingType(e.target.value)
                        selectValue(e)

                      // console.log(selectedShippingType, "Shipping Type");
                      // fetchPlant2();
                      // setTimeout(setSelectedShippingType(e.target.value), 1000);
                    }
                  // defaultValue={"select"}
                  >
                    <option value="">Select</option>
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
                                    <label>PO Date</label>
                                </div>
                                <div className="col-9">
                                    <input
                                        type="date"
                                        className="po-input"
                                        name="PO_DATE"
                                        ref={register}
                                        disabled={currentState === "2"}
                                        defaultValue={moment().format('YYYY-MM-DD')}
                                    />
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
                    ref={register({
                      required: true,
                    })}
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
                    disabled={currentState === "2"}
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
                    type="date"
                    disabled={currentState === "2"}
                    name="DOC_DATE"
                    ref={register({
                      required: true,
                    })}
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
                    disabled={currentState === "2"}
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
                      setIsCustomModalVisible(!isCustomSelectVisible);
                    }}
                  ></i>
                  <input type="text" ref={register} name="SALES_PROMOTER" />
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
                <div
                  // type="button"
                  style={{ cursor: "pointer" }}
                  className="button button-foreword"
                  onClick={handleSafeSave}
                >
                  Save
                </div>
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
                <button
                  disabled={
                    isValidDocType ||
                    !(
                      !!selectedShippingType &&
                      selectedShippingType !== "" &&
                      selectedShippingType !== "Select" &&
                      Object.keys(value).length > 0 &&
                      Object.keys(shipToPartyValue).length > 0 &&
                      Object.keys(plantValue).length > 0 &&
                      Object.keys(materialValue).length > 0
                    )
                  }

                  className={
                    isValidDocType ||
                      !(
                        !!selectedShippingType &&
                        selectedShippingType !== "" &&
                        selectedShippingType !== "Select" &&
                        Object.keys(value).length > 0 &&
                        Object.keys(shipToPartyValue).length > 0 &&
                        Object.keys(plantValue).length > 0 &&
                        Object.keys(materialValue).length > 0
                      )
                      ? "button button-back"
                      : "button button-foreword"
                  }
                  type="submit"
                >
                  Next
                </button>
              </React.Fragment>
            )}
          </div>
        </form>
      </div>

      <div className={currentState === "3" ? "row input-area" : "d-none"}>
        {salesOrderResponse.length > 0
          ? salesOrderResponse.map((msg, i) => (
            <React.Fragment key={i}>
              <img
                className="success-img"
                src="/images/success_tick.jpeg"
                alt="Tick"
              />
              &nbsp;&nbsp;
              <span key={i} className="success-msg">
                {msg.MESSAGE}
              </span>
              <br />
              <br />
            </React.Fragment>
          ))
          : null}

        {(Object.keys(salesOrderStatus)?.length > 0 &&
          salesOrderStatus?.EX_MESSAGE1 !== "") ||
          salesOrderResponse.length !== 0 ? (
          <>
            {Object.keys(salesOrderStatus)?.length > 0 ? (
              <>
                <img
                  className="success-img"
                  src="/images/success_tick.jpeg"
                  alt="Tick"
                />
                &nbsp;&nbsp;
                <span key={"2"} className="success-msg">
                  {salesOrderStatus?.EX_MESSAGE1}
                </span>
                <br />
              </>
            ) : null}
            {Object.keys(salesOrderStatus)?.length > 0 ? (
              <>
                <br />
                <img
                  className="success-img"
                  src="/images/success_tick.jpeg"
                  alt="Tick"
                />
                &nbsp;&nbsp;
                <span key={"1"} className="success-msg">
                  {salesOrderStatus?.EX_MESSAGE2}
                </span>
              </>
            ) : null}
            {Object.keys(salesOrderStatus)?.length > 0 ? (
              <>
                <br />
                {salesOrderStatus?.EX_MESSAGE3 && (
                  <img
                    className="success-img"
                    src="/images/success_tick.jpeg"
                    alt="Tick"
                  />
                )}
                &nbsp;&nbsp;
                <span key={"3"} className="success-msg">
                  {salesOrderStatus?.EX_MESSAGE3}
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
              Sales Order Not Created
            </span>
            <br />
          </>
        )}
        {/* {salesOrderResponse.length > 0
          ? salesOrderResponse.map((msg, i) => {
              return msg.TYPE === "E" ? (
                <p key={i} className="error-msg">
                  {msg.MESSAGE}
                </p>
              ) : null;
            })
          : null} */}
        <p></p>
        <p></p>
        <button
          className="button button-foreword"
          style={{ position: "absolute", top: "28px", right: "50px" }}
          onClick={() => {
            window.location.reload();
          }}
        >
          Create new sales order
        </button>
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
                      setDisabledSP(true);
                      setValue("PLANT", `${row.WERKS} - ${row.NAME1}`);
                      setIsPlant2ModalVisible(false);
                      setSelectedSupplyingPlant(row);
                      setFinalFormData(row);
                      setPlantValue({
                        value: row?.WERKS,
                        label: row?.WERKS + "-" + row?.NAME1,
                      });
                      PlantCheck(row);
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
                          ev.stopPropagation();
                          setSelectedPlant2(row);
                          setDisabledSP(true);
                          fetchReason(row);
                          setValue("PLANT", `${row.WERKS} - ${row.NAME1}`);
                          setPlantValue({
                            value: row?.WERKS,
                            label: row?.WERKS + "-" + row?.NAME1,
                          });
                          setIsPlant2ModalVisible(false);
                          setSelectedSupplyingPlant(row);
                          setFinalFormData(row);
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
        <Modal.Footer className="modal-footer"></Modal.Footer>
      </Modal>
      {/* plant2 modal close*/}

      {/* Reason Modal */}

      <Modal
        show={isReasonModalVisible}
        size="lg"
        centered
        className="modal"
      // onHide={() => setIsReasonModalVisible(false)}
      >
        <Modal.Header>
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
                        onClick={() => {
                          setIsReasonModalVisible(false);
                          setReason(row.REASON_CODE);
                          setDisabledSP(true);
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
        <Modal.Footer className="modal-footer"></Modal.Footer>
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
          commonValueUpdate={commonValueUpdate}
        />
      ) : null}

      {showFormResetDialog ? (
        <ConfirmDialog
          show={showFormResetDialog}
          message="Do you really want to clear the form?"
          accept={() => {
            reset();
            window.location.reload();
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

export default connect(mapStateToProps, { loading })(SalesOrderForm);
