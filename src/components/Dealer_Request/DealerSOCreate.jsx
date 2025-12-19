import React, { useState, useEffect } from "react";
import { connect } from "react-redux";
import { useForm } from "react-hook-form";
import apis from "../../services/apis";
import http from "../../services/apicall";
import { loading } from "../../actions/loadingAction";
import SearchDialog from "../Sales_Order_Package/SearchDialogue";
import SearchSoldToParty from "../Sales_Order_Package/soldToPart";
import ConfirmDialog from "../dashboard/ConfirmDialogue";
import moment from "moment";
import Swal from "sweetalert2";
import Modal from "react-bootstrap/Modal";
import Table from "react-bootstrap/Table";
import AsyncSelect from "react-select/async";
import { v4 as uuidv4 } from "uuid";
import { useRef } from "react";   // <-- NEW
import Select from "react-select";
import fetchCustomerNumber from "../../Functions/fetchCustomer";
import filterOptions from "../../Functions/filterData";
import filterOptionsMaterial from "../../Functions/filterOptionsMaterial";
import { getLocalData, setLocalData } from "../../services/localStorage";
import { useParams } from "react-router-dom";
import store from "../../store";
import usePlant from "../../hook/usePlant";
import checkAndCreateOrder from "../Sales_Order_Package/CheckOrderSame";

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

function DealerSOCreate(props) {
  const { id } = useParams();

  // 🚀 Duplicate-action protection
  const isSubmittingRef = useRef(false);
  const isSavingRef = useRef(false);
  const uuidRef = useRef(null);

  const generateFreshUUID = () => {
    const id = uuidv4();
    uuidRef.current = id;
    localStorage.setItem("salesOrderUUID", id);
    return id;
  };



  const [currentState, setCurrentState] = useState("1");
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
  const [soDetails, setSoDetails] = useState({});
  const [loaderMessage, setLoaderMessage] = useState("");


  useEffect(() => {
    if (currentState === "3") {
      uuidRef.current = null;
      localStorage.removeItem("salesOrderUUID");
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
      console.warn("Duplicate NEXT prevented");
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

      checkDOCTypeAll(res.data.result.ET_RETURN, data);
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Unable to verify order type", "error");
    } finally {
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

  // function useAsyncState(initialValue) {
  //   const [value, setValue] = useState(initialValue);
  //   const setter = (x) =>
  //     new Promise((resolve) => {
  //       setValue(x);
  //       resolve(x);
  //     });
  //   return [value, setter];
  // }
  // +++++++++++++++++++++= Update SO +++++++++++++++++++++++++++++++++++++++//

  const updateSO = async (login, data, status) => {
    let postData = {
      id: data.id,
      login_id: localStorage.getItem("user_code"),
      data: {
        status: status,
        so_creation_message: login,
        so_number: data.soNumber,
        so_created_at: moment().format("YYYY-MM-DD hh:mm:ss"),
        actual_depot_user: localStorage.getItem("user_code"),
      },
    };

    console.log(postData);
    try {
      store.dispatch(loading(true));
      let updateStatus = await http.post(apis.DEALER_REQUEST_UPDATE, postData);

      if (updateStatus.data.code === 0) {
        // Swal.fire("Success", "SO status successfully updated", "success");
      } else {
        Swal.fire("Error", "Something went wrong", "error");
      }
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Unable to update SO status", "error");
    } finally {
      store.dispatch(loading(false));
    }
  };

  //+++++++++++++++++++++++++++++++++++++++++++++++++save form data to server+++++++++++++++++++++++++++++++++++++++++++++++++++++
  let saveFormData = async (confirmFromPop = "") => {
    console.log("[SAVE_ATTEMPT] Starting save...", { confirmFromPop });

    // Prevent double-click
    if (isSavingRef.current) {
      console.warn("[SAVE_BLOCKED] Duplicate click prevented");
      return;
    }
    isSavingRef.current = true;

    // Safety: finalFormData present
    if (!finalFormData || Object.keys(finalFormData).length === 0) {
      Swal.fire("Error", "Form is incomplete. Please review before saving.", "error");
      isSavingRef.current = false;
      return;
    }

    // Normalized dup-confirm flag we'll send to SAP
    let dupConfirmFlag = "";

    // 1) Duplicate check (skip if caller already confirmed via POP)
    if (confirmFromPop !== "Y") {
      try {
        const checkResult = await checkAndCreateOrder({
          soldTo: selectedSoldtoParty.KUNNR,
          shipTo: selectedShiptoparty.KUNNR,
          quantity: finalFormData.TARGET_QTY,
        });

        // If user cancelled duplicate flow
        if (!checkResult) {
          console.warn("[DUPLICATE_CANCELLED] User stopped creation");
          isSavingRef.current = false;
          isSubmittingRef.current = false;
          // ensure no stray UUID
          localStorage.removeItem("salesOrderUUID");
          return;
        }

        // Normalize: checkResult could be boolean or object
        if (typeof checkResult === "object") {
          dupConfirmFlag = checkResult.confirm || checkResult.confirmed || "";
        } else if (typeof checkResult === "boolean" && checkResult === true) {
          dupConfirmFlag = "";
        } else {
          dupConfirmFlag = "";
        }
      } catch (err) {
        console.error("[DUP_CHECK_ERROR]", err);
        Swal.fire("Error", "Unable to check duplicate orders. Please try again.", "error");
        isSavingRef.current = false;
        isSubmittingRef.current = false;
        localStorage.removeItem("salesOrderUUID");
        return;
      }
    } else {
      // caller told us to force-continue (user confirmed POP)
      dupConfirmFlag = "Y";
    }

    // 2) Generate UUID only now (after duplicate-check)
    const UUID = generateFreshUUID();
    console.log("[UUID_GENERATED]", UUID);

    // 3) Build body (incoDesc resolved as before)
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
      lines: { TDFORMAT: "*", TDLINE: finalFormData.REMARKS },
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
      IM_DUP_CONFIRM: dupConfirmFlag,
      IM_DMS_REQID: soDetails?.dms_req_no ? soDetails?.dms_req_no : "",
    };

    console.log("[RFC_CALL] Payload:", body);

    // 4) Call SAP
    props.loading(true);

    let delayTimer;

    try {

      // ⏳ Show message ONLY if backend is slow (>9s)
      delayTimer = setTimeout(() => {
        setLoaderMessage(
          "Processing Sales Order… Due to high system load, this may take a little longer. Please do not refresh the page."
        );
      }, 9000);

      const SAP_TIMEOUT_MS = 25000; // 25 seconds hard limit
      let timeoutTriggered = false;

      const sapTimeoutPromise = new Promise((_, reject) =>
        setTimeout(() => {
          timeoutTriggered = true;
          reject({ code: "SAP_TIMEOUT" });
        }, SAP_TIMEOUT_MS)
      );


      const res = await Promise.race([
        http.post(apis.CREATE_SALES_ORDER, body),
        sapTimeoutPromise,
      ]);


      if (res?.data?.result?.SALESDOCUMENT) {
        localStorage.removeItem("salesOrderUUID");
        uuidRef.current = null;
        // success
        localStorage.removeItem("lastOrderCheck");
        setCreatedSalesDocument(res.data.result.SALESDOCUMENT);
        setSalesOrderResponse(res.data.result.RETURN);
        setCurrentState("3");

        updateSO(
          res.data.result?.RETURN?.[0]?.MESSAGE || "",
          {
            dms: soDetails.dms_req_no,
            id: soDetails.id,
            soNumber: res.data.result.SALESDOCUMENT,
          },
          "1"
        );
        // keep UUID in localStorage until fetchStatus clears it (or you can remove immediately if not used)
      } else {
        // handle SAP error returns
        const errmsg = (res?.data?.result?.RETURN || []).filter((e) => e.TYPE === "E" || e.TYPE === "I");
        if (errmsg.find((el) => el?.ID === "POP")) {
          const pop = errmsg.find((el) => el?.ID === "POP");
          // Ask user and when user confirms call saveFormData with confirmFromPop = "Y"
          const result = await Swal.fire({
            title: "Are you sure?",
            text: pop?.MESSAGE,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes",
          });
          if (result.isConfirmed) {
            if (confirmFromPop === "Y") {
              Swal.fire("Error", "SAP returned POP again. Aborting.", "error");
              localStorage.removeItem("salesOrderUUID");
              return;
            }
            // call again but skip duplicate-check this time and set confirm = "Y"
            // Note: using confirmFromPop avoids infinite recursion since we skip duplicate-check when confirmFromPop === "Y"
            await saveFormData("Y");
          } else {
            // user declined, cleanup UUID
            localStorage.removeItem("salesOrderUUID");
            window.location.reload();
          }
        } else {
          let msg = "";
          errmsg.forEach((el, i) => {
            msg += `<p>${i + 1}. ${el.MESSAGE}</p>`;
          });
          Swal.fire({ title: "Error!", html: msg, icon: "error" });
          // remove UUID as creation failed
          localStorage.removeItem("salesOrderUUID");
        }
      }
    } catch (err) {
      console.error("[RFC_ERROR]", err);

      const isTimeout = err?.code === "SAP_TIMEOUT";
      const isNetwork =
        !err?.response ||
        err?.message?.toLowerCase().includes("network") ||
        err?.code === "ECONNABORTED";

      if (isTimeout || isNetwork) {
        Swal.fire({
          title: "Dealer Sales Order Processing",
          text:
            "Your Dealer Sales Order is being processed. This may take a little longer. Please do not refresh.",
          icon: "warning",
        });

        fetchStatus(); // GUID must remain
      } else {
        Swal.fire(
          "Error",
          "Dealer Sales Order creation failed due to a System or Network error. Please try again.",
          "error"
        );

        // ✅ MUST remove here
        localStorage.removeItem("salesOrderUUID");
      }
    }
    finally {
      clearTimeout(delayTimer);   // 🧼 stop delayed message
      setLoaderMessage("");       // 🧼 hide overlay

      props.loading(false);

      // 🔓 release locks
      isSavingRef.current = false;
      isSubmittingRef.current = false;
    }

  };


  // Sleep function
  // function sleep(ms) {
  //   return new Promise((resolve) => setTimeout(resolve, ms));
  // }

  //   Find by DMS //
  useEffect(() => {
    if (id) {
      fetchSODetails(id);
    }
  }, [id]);

  let fetchSODetails = async (id) => {
    try {
      // props.loading(true);
      let SODetails = await http.post(apis.DEALER_REQUEST_DETAILS, {
        dms_req_no: id,
        app_id: apis.app_id,
        app_secret: apis.app_secret,
      });

      console.log(SODetails);
      if (SODetails.data.code === 0) {
        let data = SODetails.data.result[0];
        if (Number(data.status) === 0) {
          setSoDetails(data);

          handleChange({
            value: data.sold_to_party,
            label: data.sold_to_party_name
              ? data.sold_to_party?.replace(/^0+/, "") +
              " - " +
              data.sold_to_party_name
              : data.sold_to_party?.replace(/^0+/, ""),
          });
          setSelectedSoldtoParty({
            KUNNR: data.sold_to_party,
          });
          setShipToPartyValue({
            value: data.ship_to_party,
            label: data.ship_to_party_name
              ? data.ship_to_party?.replace(/^0+/, "") +
              " - " +
              data.ship_to_party_name
              : data.ship_to_party?.replace(/^0+/, ""),
          });
          console.log(data.ship_to_party);
          setSelectedShiptoparty({
            KUNNR: data.ship_to_party,
          });

          setValue("TARGET_QTY", data.qty);
        } else {
          Swal.fire(
            data?.status === 1 ? "Successfully Created" : "Error",
            `${data?.so_creation_message} for this request`,
            data?.status === 1 ? "success" : "error"
          ).then(() => (window.location.href = "/dashboard/dealer-requests"));
        }
      } else {
        Swal.fire("Error", "something went wrong", "error");
      }
    } catch (error) {
      console.error(error);
    }
  };

  //+++++++++++++++++++++++++ Fetch Status of sales order ++++++++++++++++++++++++++//

  useEffect(() => {
    // fetchStatus()
    // e46842af-53eb-4e26-929f-2a105408567e
  }, []);

  let fetchAttemptsRef = useRef(0);
  const MAX_FETCH_ATTEMPTS = 30;   // 30 attempts x 2 seconds = 60 seconds

  let fetchStatus = async () => {
    try {
      // props.loading(true);

      const guid = localStorage.getItem("salesOrderUUID");
      if (!guid) return;

      const res = await http.post(apis.COMMON_POST_WITH_FM_NAME, {
        fm_name: "ZSALES_ORDER_STATUS",
        params: { IM_GUID: guid },
      });

      const data = res.data.result;
      if (!data) return;

      // 🔄 Status = Pending
      if (data.EX_STATUS === "P") {
        fetchAttemptsRef.current++;
        if (fetchAttemptsRef.current < MAX_FETCH_ATTEMPTS) {
          setTimeout(fetchStatus, 2000);
        } else {
          // max attempts reached -> cleanup
          console.warn("fetchStatus: max attempts reached for GUID", guid);
          localStorage.removeItem("salesOrderUUID");
          fetchAttemptsRef.current = 0;
        }
        return;
      }

      // 🔄 Status = Success but VBELN still empty (delay)
      if (data.EX_STATUS === "S" && !data.EX_VBELN) {
        fetchAttemptsRef.current++;
        if (fetchAttemptsRef.current < MAX_FETCH_ATTEMPTS) {
          setTimeout(fetchStatus, 2000);
        }
        return;
      }

      // ✅ Status SUCCESS (final)
      setSalesOrderStatus(data);
      setCurrentState("3");

      localStorage.removeItem("salesOrderUUID");
      fetchAttemptsRef.current = 0;

      // Update SO entry in Dealer DB
      if (data.EX_STATUS === "S" && data.EX_VBELN) {
        updateSO(
          data.EX_MESSAGE1,
          {
            dms: soDetails.dms_req_no,
            id: soDetails.id,
            soNumber: data.EX_VBELN,
          },
          "1"
        );
      }

    } catch (err) {
      // 🔁 Retry on network failure
      fetchAttemptsRef.current++;
      if (fetchAttemptsRef.current < MAX_FETCH_ATTEMPTS) {
        setTimeout(fetchStatus, 2000);
      } else {
        console.warn("fetchStatus: max attempts reached (network errors). clearing GUID");
        localStorage.removeItem("salesOrderUUID");
        fetchAttemptsRef.current = 0;
      }
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
            setAllOrderTypes(res.data.result);
            setAllOrderType(res.data.result[0].AUART);
            setLocalData("order_type", res.data.result);
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

  const plant = usePlant();

  useEffect(() => {
    if (plant.length > 0) {
      setAllOrderSupplyingPlants(plant);
      setSearchedValue("PLANT", `${plant[0]["WERKS"]}-${plant[0]["NAME1"]}`);
      setSelectedSupplyingPlant(plant[0]);
    }
  }, [plant]);

  //+++++++++++++++++++++++++++++++++++++++++++++++++fetching order types && shipping plants && shipping types end+++++++++++++++++++++++++++++++++++++

  //++++++++++++++++++++++++++++++++++++++++++++++++ fetching plant dependent and material dependent shipping type+++++++++++
  let fetchShippingType = () => {
    if (!selectedSupplyingPlant?.WERKS || !selectedMaterial?.MATNR) {
      console.warn("fetchShippingType skipped: plant or material missing");
      return;
    }

    http
      .post(apis.SHIPPING_TYPE_MAINTAINED_TABLE, {
        params: {
          PLANT: selectedSupplyingPlant.WERKS,
          MATERIAL: selectedMaterial.MATNR.replace(/^0+/, ""),
        },
      })
      .then((result) => {
        if (result.data.status) {
          setAllOrderShippingTypes(result.data.result);
        }
      })
      .catch((err) => console.log(err));
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
      // props.loading(true);
      // let p1 = http.post(apis.GET_ORDER_SHIPPING_POINT, {
      //   lv_plant: selectedSupplyingPlant.WERKS,
      // });
      const findPlant = plant.find(
        (p) => p.WERKS === selectedSupplyingPlant?.WERKS
      );

      // ⛔ THIS IS THE KEY FIX
      if (!findPlant) {
        Swal.fire(
          "Not Allowed",
          "Selected Shipping Type is not maintained for this Plant",
          "warning"
        );
        return; // 🔴 STOP EXECUTION HERE
      }

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
          } else {
            console.log("Error");
          }
        })
        .catch((err) => {
          console.log(err);
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
            // if (res[0].data.result.IT_FINAL.length > 0) {
            //   setSelectedShiptoparty(res[0].data.result.IT_FINAL[0]);
            //   if (!id) {
            //     setSearchedValue(
            //       "SHIP_TO_PARTY",
            //       `${res[0].data.result.IT_FINAL[0]["KUNNR"]}-${res[0].data.result.IT_FINAL[0]["NAME1"]}`
            //     );
            //   }
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
  }, [selectedSoldtoParty]);

  //+++++++++++++++++++++++++++++++++++++++++++++++++fetching sold to party dependent ship to party and sales area end+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

  //+++++++++++++++++++++++++++++++++++++++++++++++++fetching plant 2++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++//

  let fetchPlant2 = (shippingType) => {
    if (
      !selectedSupplyingPlant?.WERKS ||
      !selectedMaterial?.MATNR ||
      !shippingType
    ) {
      console.warn("fetchPlant2 skipped: missing data");
      return;
    }

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
        }
      })
      .catch(console.log)
      .finally(() => props.loading(false));
  };


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
      console.log("Called");
      // props.loading(true);
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
      setShipToPartyValue({ value: value2, label: value });
    } else if (key === "MATERIAL") {
      value2 = value2?.replace(/^0+/, "");
      value = value?.replace(/^0+/, "");
      setMaterialValue({ value: value2, label: value });
    }
    triggerValidation(key);
  };
  //+++++++++++++++++++++++++++++++++++++++++++++++++setting form value end+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

  useEffect(() => {
    if (Object.keys(selectedShiptoparty).length > 0) {
      http
        .post(apis.GET_TRANS_ZONE, {
          LV_CUSTOMER: selectedShiptoparty.KUNNR,
        })
        .then((res) => {
          if (res) {
            if (res.data.result.IT_FINAL.length > 0) {
              setValue(
                "TRANS_ZONE",
                `${res.data.result.IT_FINAL[0].ZONE1} - ${res.data.result.IT_FINAL[0].VTEXT}`
              );
            }
          }
        });
    }
  }, [selectedShiptoparty]);

  const PlantCheck = (row) => {
    return http
      .post(apis.COMMON_POST_WITH_FM_NAME, {
        fm_name: "ZRFC_DOCTYPE_PLANT_CHECK",
        params: {
          IM_AUART: selectAllOrderType,
          IM_WERKS: row.WERKS,
        },
      })
      .then((res) => checkDOCType(res.data.result.ET_RETURN, row))
      .catch((err) => {
        console.error("PlantCheck failed:", err);
        throw err; // 🔑 allow caller .catch()
      });
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

  const handleChange = (value2) => {
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
      {Object.keys(soDetails).length !== 0 && (
        <div className="card input-area">
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <label className="m0">
              Ship to party address: {soDetails?.ship_to_party_add}
            </label>
            <label className="m0">
              Quantity: {soDetails?.qty} {soDetails?.qty_unit}
            </label>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <label className="m0">Material: {soDetails?.material}</label>
            <label className="m0">
              Requested At:{" "}
              {moment(soDetails?.requested_at).format("DD MMM YYYY")}
            </label>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <label className="m0">DMR Number: {soDetails?.dms_req_no}</label>
          </div>
        </div>
      )}
      <br />

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
                        if (currentState === "1" && !soDetails.sold_to_party) {
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
                      isDisabled={
                        currentState === "2" || soDetails.sold_to_party
                      }
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
                        if (currentState === "1" && !soDetails.ship_to_party) {
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
                      isDisabled={
                        currentState === "2" || soDetails.ship_to_party
                      }
                      classNamePrefix="react-select"
                    />
                    {console.log(shipToPartyValue, selectedShiptoparty)}

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

                    {errors.PLANT && (
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
                      disabled={currentState === "2" || soDetails.qty}
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
                      value={selectedMaterial?.UOM || ""}
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
                    onChange={(e) =>
                      // setSelectedShippingType(e.target.value)
                      selectValue(e)
                    }
                  // defaultValue={"select"}
                  >
                    <option>Select</option>
                    {allOrderShippingTypes.map((ele, i) => (
                      <option key={i} value={ele.VSART}>
                        {ele.VSART} - {ele.BEZEI}
                      </option>
                    ))}
                  </select>
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
                  onClick={() => saveFormData()}
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
                      selectedShippingType.length !== 0 &&
                      Object.keys(value).length > 0 &&
                      Object.keys(shipToPartyValue).length > 0 &&
                      Object.keys(plantValue).length > 0 &&
                      Object.keys(materialValue).length > 0
                    )
                  }
                  className={
                    isValidDocType ||
                      !(
                        selectedShippingType.length !== 0 &&
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
            <>
              <img
                className="success-img"
                src="/images/success_tick.jpeg"
                alt="tick"
              />
              &nbsp;&nbsp;
              <span key={i} className="success-msg">
                {msg.MESSAGE}
              </span>
              <br />
              <br />
            </>
          ))
          : null}

        {(Object.keys(salesOrderStatus)?.length > 0 &&
          salesOrderStatus?.EX_MESSAGE1 !== "") ||
          salesOrderResponse.length !== 0 ? (
          <>
            {Object.keys(salesOrderStatus)?.length > 0 ? (
              <>
                <img className="success-img" src="/images/success_tick.jpeg" />
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
                <img className="success-img" src="/images/success_tick.jpeg" />
                &nbsp;&nbsp;
                <span key={"1"} className="success-msg">
                  {salesOrderStatus?.EX_MESSAGE2}
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
                      //setFinalFormData(row);
                      setPlantValue({
                        value: row?.WERKS,
                        label: row?.WERKS + "-" + row?.NAME1,
                      });
                      PlantCheck(row).catch(() => {

                        Swal.fire("Error", "Unable to validate plant", "error");
                      });

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
                          ev.stopPropagation(); // ✅ Prevent TR click firing
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
                          //setFinalFormData(row);
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

export default connect(mapStateToProps, { loading })(DealerSOCreate);
