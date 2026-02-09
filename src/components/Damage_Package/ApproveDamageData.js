import moment from "moment";
import Swal from "sweetalert2";
import { loading } from "../../actions/loadingAction";
import http from "../../services/apicall";
import apis from "../../services/apis";
import store from "../../store";

const approveDamageData = (id, updatedData) => {
  let postData = {
    ...updatedData,
  };

  console.log(postData, id);

  store.dispatch(loading(true));

  let url = "update-rake-data/" + id;

  http
    .post(url, postData)
    .then((res) => {
      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Data Updated Successfully",
      }).then(() => {
        window.location.href = "/dashboard/damage-data-entry/rake-report";
      });
    })
    .catch((err) => {
      console.log("Called Again", err);
      approveDamageData(id, updatedData);
    })
    .finally(() => {
      store.dispatch(loading(false));
    });
};

const rejectDamageData = (id, updatedData) => {
  let postData = {
    ...updatedData,
  };

  console.log(postData, id);

  store.dispatch(loading(true));

  let url = "update-rake-data/" + id;

  http
    .post(url, postData)
    .then((res) => {
      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Data Updated Successfully",
      }).then(() => {
        window.location.href = "/dashboard/damage-data-entry/rake-report";
      });
    })
    .catch((err) => {
      console.log(err);
    })
    .finally(() => {
      store.dispatch(loading(false));
    });
};

function isAfterFeb1_2024(dateString) {
  const rrDate = moment(dateString, "YYYY-MM-DD");
  const referenceDate = moment("2024-02-01", "YYYY-MM-DD");
  return rrDate.isSameOrAfter(referenceDate);
}

function isBeforeOct1_2024(dateString) {
  const rrRecDate = moment(dateString, "YYYYMMDD");
  const referenceDate = moment("2024-10-01", "YYYY-MM-DD");
  return rrRecDate.isSameOrBefore(referenceDate);
}

// is before 25 nov 2024
function isBefore25Nov_2024(dateString) {
  const rrRecDate = moment(dateString, "YYYYMMDD");
  // date change to 7 Jan 2025
  const referenceDate = moment("2025-01-07", "YYYY-MM-DD");

  // const referenceDate = moment("2024-11-25", "YYYY-MM-DD");
  return rrRecDate.isSameOrBefore(referenceDate);
}

const createMigoData = async (id) => {
  try {
    store.dispatch(loading(true));

    let url = "/get-rake-data/" + id;

    const rr_res = await http.get(url);

    if (rr_res.data.code === 0) {
      if (isBefore25Nov_2024(rr_res.data.data.RR_DATE)) {
        approveDamageData(id, {
          APPROVED_SA: localStorage.getItem("user_code"),
          SA_COMMENT: "",
        });
        console.log(rr_res.data.data.RR_DATE);
        console.log(
          "CALLED Because RR Date is before 25th Nov 2024 and migo posting skipped"
        );
      } else if (isBeforeOct1_2024(rr_res.data.data.DATE_OF_RAKE_RECEIVED)) {
        approveDamageData(id, {
          APPROVED_SA: localStorage.getItem("user_code"),
          SA_COMMENT: "",
        });
        console.log(rr_res.data.data.RR_REC_DATE);
        console.log(
          "CALLED Because Rake Received Date is not before 1st oct 2024 and MIGO posting skipped"
        );
      } else {
        const postData = createMigoPostingData(rr_res.data.data);

        console.log(postData);

        if (postData.IM_DATA.length === 0) {
          console.log("Only Approve. Nothing to transfer");
          approveDamageData(id, {
            APPROVED_SA: localStorage.getItem("user_code"),
            SA_COMMENT: "NO Damage Data",
            MAT_DOC_NO: "NA",
            MIGO_POSTING_DATA: postData,
            MIGO_RETURN_DATA: "NA",
            MIGO_RETURN_COMMIT: "NA",
          });
          return;
        }

        const migo_res = await http.post(apis.COMMON_POST_WITH_FM_NAME, {
          fm_name: "ZRFC_TRANSFER_POSTING",
          params: {
            ...postData,
            IM_LOGIN_ID: localStorage.getItem("user_code").replace(/^0+/, ""),
          },
        });
        if (migo_res.data.code === 0) {
          console.log(migo_res.data.result.IT_EXPORT);
          approveDamageData(id, {
            APPROVED_SA: localStorage.getItem("user_code"),
            SA_COMMENT: "",
            MAT_DOC_NO: migo_res.data.result.IT_EXPORT.map(
              (ele) => ele.MATDOC_NO
            ).join(","),
            MIGO_POSTING_DATA: postData,
            MIGO_RETURN_DATA: migo_res.data.result.IT_EXPORT,
            MIGO_RETURN_COMMIT: migo_res.data.result.RETURN_COMMIT,
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Something Went wrong.",
          });
        }
      }
    }
  } catch (err) {
  } finally {
    store.dispatch(loading(false));
  }
};

// const createMigoPostingData = (data) => {
//   let damageData = data.DAMAGE_DATA;
//   let rakeDetails = data;

//   console.log(damageData);

//   let dataForPost = damageData.map((item) => {
//     return {
//       COMBINED_MATERIAL: item.COMBINED_MATERIAL,
//       CUT_TORN: item.CUT_TORN,
//       WATER_DMG: item.WATER_DMG,
//       HANDING_DMG: item.HANDING_DMG,
//       BRUST_BAG: item.BRUST_BAG,
//       NEW_BRUST: item.NEW_BURST,
//     };
//   });

//   const postDataKeys = [
//     "CUT_TORN",
//     "WATER_DMG",
//     "HANDING_DMG",
//     "BRUST_BAG",
//     "NEW_BRUST",
//   ];

//   let IM_DATA = [];

//   const STRG_LOC_DATA = {
//     CUT_TORN: "DMG",
//     NEW_BRUST: "DMG",
//     BRUST_BAG: "DMG",
//     WATER_DMG: "G001",
//     HANDING_DMG: "DMG",
//   };

//   console.log(dataForPost);

//   dataForPost.forEach((data) => {
//     data.COMBINED_MATERIAL.forEach((mat) => {
//       postDataKeys.forEach((item) => {
//         if (Number(data[item]) > 0) {
//           IM_DATA.push({
//             DEPOT: mat.DEPOT,
//             DOC_DATE: mat.GRN_DATE,
//             PSTNG_DATE: mat.DESPATCH_DATE,
//             MATERIAL: mat.MATERIAL,
//             STORAGE_LOC: "RAIL",
//             QUANTITY: +data[item] || 0,
//             ITEM_TEXT: mat.MATERIAL_DESC,
//             DELIVERY_NO: mat.DELIVERY_NO,
//             MOVE_TYPE: "311",
//             RAKE_NO: rakeDetails.RAKE_NO,
//             RR_NO: rakeDetails.RR_NO,
//             STORAGE_LOC_REC: STRG_LOC_DATA[item],
//           });
//         }
//       });
//     });
//   });

//   return {
//     IM_DATA: IM_DATA,
//   };
// };

const createMigoPostingData = (data) => {
  let damageData = data.DAMAGE_DATA;
  let rakeDetails = data;

  let dataForPost = damageData.map((item) => {
    return {
      COMBINED_MATERIAL: item.COMBINED_MATERIAL,
      CUT_TORN: item.CUT_TORN,
      WATER_DMG: item.WATER_DMG,
      HANDING_DMG: item.HANDING_DMG,
      BRUST_BAG: item.BRUST_BAG,
      NEW_BRUST: item.NEW_BURST,
    };
  });

  const postDataKeys = [
    "CUT_TORN",
    "WATER_DMG",
    "HANDING_DMG",
    "BRUST_BAG",
    "NEW_BRUST",
  ];

  let IM_DATA = [];

  const STRG_LOC_DATA = {
    CUT_TORN: "DMG",
    NEW_BRUST: "DMG",
    BRUST_BAG: "DMG",
    WATER_DMG: "G001",
    HANDING_DMG: "DMG",
  };

  dataForPost.forEach((data) => {
    postDataKeys.forEach((damageType) => {
      if (Number(data[damageType]) > 0) {
        const highestGRDelivery = data.COMBINED_MATERIAL.reduce(
          (prev, current) => {
            const prevQty = parseFloat(prev.GR_QTY || "0.00");
            const currentQty = parseFloat(current.GR_QTY || "0.00");
            return prevQty > currentQty ? prev : current;
          }
        );

        data.COMBINED_MATERIAL.forEach((material) => {
          const quantity =
            material.DELIVERY_NO === highestGRDelivery.DELIVERY_NO
              ? +data[damageType]
              : 0;

          IM_DATA.push({
            DEPOT: material.DEPOT,
            DOC_DATE: material.GRN_DATE,
            PSTNG_DATE: material.DESPATCH_DATE,
            MATERIAL: material.MATERIAL,
            STORAGE_LOC: "RAIL",
            QUANTITY: quantity,
            ITEM_TEXT: material.MATERIAL_DESC,
            DELIVERY_NO: material.DELIVERY_NO,
            MOVE_TYPE: "311",
            RAKE_NO: rakeDetails.RAKE_NO,
            RR_NO: rakeDetails.RR_NO,
            RR_DATE: moment(rakeDetails.RR_DATE, "YYYY-MM-DD").format("YYYYMMDD"),   // Add RR_DATE in Transfer Posting
            STORAGE_LOC_REC: STRG_LOC_DATA[damageType],
          });
        });
      }
    });
  });

  return {
    IM_DATA: IM_DATA,
  };
};

export { approveDamageData, createMigoData, rejectDamageData };
