import http from "../../services/apicall";
import apis from "../../services/apis";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ⏳ Total wait time: 25 seconds
const MAX_POLLS = 5;
const POLL_INTERVAL_MS = 5000;  // 5 seconds


// MAIN RFC CALL
const SONewRFC = async (body) => {
  try {
    const res = await http.post(apis.COMMON_POST_WITH_FM_NAME, {
      fm_name: "ZSALES_ORDER_CREATE_N",
      params: body,
    });

    console.log("[RFC_RAW_RESPONSE]", res.data.result);

    // Always poll status (SAP async behavior)
    return await fetchStatus();

  } catch (err) {
    console.log("[RFC_EXCEPTION] – fallback to poll");
    return await fetchStatus();
  }
};

// STATUS POLLING (Improved — returns last SAP error instead of generic message)
let lastMeaningfulSAPMessage = null;

let fetchStatus = async () => {
  try {
    let pollCount = 0;
    const guid = localStorage.getItem("salesOrderUUID");

    if (!guid) {
      return makeFinalResponseError("Missing GUID. Order creation aborted.");
    }

    while (pollCount < MAX_POLLS) {
      const data = await http.post(apis.COMMON_POST_WITH_FM_NAME, {
        fm_name: "ZSALES_ORDER_STATUS",
        params: { IM_GUID: guid },
      });

      const resData = data?.data?.result || {};
      const status = resData.EX_STATUS || "";
      const vbeln = resData.EX_VBELN || "";

      console.log("[STATUS_POLL]", pollCount + 1, "/", MAX_POLLS, resData);

      // ✅ Store only meaningful SAP messages
      const msg = resData.EX_MESSAGE1 || resData.EX_MESSAGE2 || resData.EX_MESSAGE3;

      if (msg && msg.trim() !== "" && msg.toLowerCase() !== "pending") {
        lastMeaningfulSAPMessage = msg;   // Only store real errors, ignore pending
      }

      // SUCCESS
      if (status === "S" || vbeln !== "") {
        return makeFinalResponse(resData);
      }

      // ERROR
      if (status === "E") {
        return makeFinalResponse(resData);
      }

      // Continue polling for blank/pending
      pollCount++;
      await sleep(POLL_INTERVAL_MS);
    }

    // ❌ TIMEOUT → Show meaningful SAP message if captured
    return makeFinalResponseError(
      lastMeaningfulSAPMessage ||
      "SAP did not return any final response. Please try again."
    )

  } catch (error) {
    console.log("[STATUS_POLL_ERROR] Retrying…");

    // ❌ Network failure → also show last real message if exists
    return makeFinalResponseError(
      lastMeaningfulSAPMessage ||
      "Network or SAP timeout occurred. Please try again."
    );
  }
};



// FORMAT FINAL RESPONSE
const makeFinalResponse = (data) => {
  let list = [];

  Object.entries(data).forEach(([key, value]) => {
    if (key.includes("MESSAGE") && value) {
      list.push({
        TYPE: data.EX_STATUS || "E",
        MESSAGE: value,
      });
    }
  });

  if (!list.length && !data.EX_VBELN) {
    list.push({
      TYPE: "E",
      MESSAGE: "Order creation failed. No response received.",
    });
  }

  return {
    SO_NUMBER: data.EX_VBELN || "",
    DATA: list,
  };
};

// FORMAT ERROR RESPONSE
const makeFinalResponseError = (msg) => {
  return {
    SO_NUMBER: "",
    DATA: [
      {
        TYPE: "E",
        MESSAGE: msg,
      },
    ],
  };
};

export default SONewRFC;
