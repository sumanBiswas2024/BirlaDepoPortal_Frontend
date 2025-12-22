import moment from "moment";
import React, { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import { loading } from "../../actions/loadingAction";
import http from "../../services/apicall";
import apis from "../../services/apis";
import store from "../../store";

// let today = moment();
// let twodaysback = moment().subtract(30, "day");

let today = moment();
let twodaysback = moment().subtract(2, "day");    // Date: 22/12/2025 Issue: Date Validation in DealerSOList


export const DealerRequestList = (props) => {
  const checkedDMS = React.useRef([]);
  const { register, handleSubmit, watch, errors } = useForm({
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      start_date: twodaysback.format("YYYY-MM-DD"),
      end_date: today.format("YYYY-MM-DD"),
      pgi: "before",
    },
  });

  const watchAllFields = watch();

  const [paginatedRequestData, setPaginatedRequestData] = useState([]);
  const [perPage, setPerPage] = useState(10);
  const [dealerRequestData, setDealerRequestData] = useState([]);
  const [formData, setFormData] = useState({});

  const [offset, setOffset] = useState(0);

  const fetchDealerRequestList = async (data, loader = true) => {
    store.dispatch(loading(true));  //START loader    //Date: 22/12/2025 Issue: Loading Issue in DealerSOList
    try {
      // store.dispatch(loading(true));
      let fetchedData = await http.post(apis.DEALER_REQUEST_LIST, data);
      if (fetchedData.data.code === 0) {
        setDealerRequestData(fetchedData.data.result);
        setPaginatedRequestData(fetchedData.data.result.slice(0, perPage));
      } else {
        Swal.fire("Error", fetchedData.data.message, "error");
      }
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Failed to load data", "error");
    }
    finally {
      store.dispatch(loading(false)); // STOP loader    //Date: 22/12/2025 Issue: Loading Issue in DealerSOList
    }
  };



  useEffect(() => {
    if (Object.keys(formData).length > 2) {
      fetchDealerRequestList({
        ...formData,
        offset,
        limit: perPage,
      });
    }
  }, [formData, offset, perPage]);


  useEffect(() => {
    let timer;

    const pollUpdateByLoginId = async () => {
      try {
        await http.post(apis.REQUEST_UPDATE_BY_LOGIN);
      } catch (e) { }

      timer = setTimeout(pollUpdateByLoginId, 10000);
    };

    pollUpdateByLoginId();

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);


  const onSubmit = (data) => {

    // Date: 22/12/2025 Issue: Date Validation in DealerSOList
    const start = moment(data.start_date);
    const end = moment(data.end_date);

    const diffInDays = end.diff(start, "days");

    // Max 31 days validation
    if (diffInDays > 31) {
      Swal.fire({
        title: "Error",
        text: "Date should be within 31 days",
        icon: "error",
      });
      return; // STOP submission
    }

    data.login_id = localStorage.getItem("user_code");
    data.limit = Number(perPage);
    data.offset = offset;

    setFormData(data);
    // fetchDealerRequestList(data);
  };

  const pageChange = ({ selected }) => {
    setPaginatedRequestData(
      dealerRequestData.slice(selected * perPage, perPage * (selected + 1))
    );
  };

  let data = [
    {
      key: "status",
      minWidth: "",
      header: "Status",
      render: (key) => getStatus(key),
    },
    {
      key: "sold_to_party",
      minWidth: "220px",
      header: "Sold to Party",
    },
    {
      key: "sold_to_party_name",
      minWidth: "220px",
      header: "Sold to Party Details",
    },
    {
      key: "ship_to_party",
      minWidth: "220px",
      header: "Ship to Party",
    },

    {
      key: "ship_to_party_name",
      minWidth: "320px",
      header: "Ship to Party Details",
    },
    {
      key: "dms_req_no",
      minWidth: "220px",
      header: "DMS Request Number",
    },
    {
      key: "material",
      minWidth: "200px",
      header: "Material Name",
    },
    {
      key: "qty",
      minWidth: "",
      header: "Quantity",
    },
    {
      key: " qty_unit",
      minWidth: "",
      header: "Quantity Unit",
    },
    {
      key: "ship_to_party_add",
      minWidth: "520px",
      header: "Ship to Party Address",
    },
    {
      key: "so_creation_message",
      minWidth: "320px",
      header: "Creation Message",
    },
    {
      key: "so_number",
      minWidth: "220px",
      header: "SO Number",
    },
    {
      key: "notified_to_dms",
      minWidth: "200px",
      header: "Notified To DMS",
    },
    {
      key: "ship_point",
      minWidth: "200px",
      header: "Ship Point",
    },

    {
      key: "plant",
      minWidth: "",
      header: "Plant",
    },
    {
      key: "sales_org",
      minWidth: "",
      header: "Sales Organization",
    },
    {
      key: "ship_type",
      minWidth: "",
      header: "Shipping Type",
    },
    {
      key: "requested_at",
      minWidth: "220px",
      header: "Requested At",
      render: (key) => moment(key).format("DD MM YY HH:mm"),
    },
    {
      key: "so_created_at",
      minWidth: "220px",
      header: "SO Created At",
    },

    {
      key: "dms_req_no",
      minWidth: "",
      header: "",
    },
    {
      key: "dms_req_no",
      minWidth: "",
      header: "",
    },
  ];

  const getStatus = (value) => {
    let status = ["Pending", "Created", "Rejected", "Creation Error"];
    let color = ["#FFC107", "#4CAF50", "#F44336", "#F44336"];
    return (
      <p style={{ color: color[Number(value)] }}>{status[Number(value)]}</p>
    );
  };

  const rejectDealerSO = (data) => {
    Swal.fire({
      title: "Warning",
      text: "Do you want to reject the request?",
      icon: "info",
      input: "text",
      inputAttributes: {
        autocapitalize: "off",
        placeholder: "Reason",
      },
      confirmButtonText: "Yes",
      showCancelButton: true,
      preConfirm: (login) => {
        if (login === "") {
          Swal.showValidationMessage(
            "Please enter reason for rejecting the request"
          );
          return;
        } else {
          updateSO(login, data);
        }
      },
    });
  };

  const updateSO = async (login, data) => {
    let postData = {
      id: data.id,
      login_id: localStorage.getItem("user_code"),
      data: {
        status: 2,
        so_creation_message: login,
        so_number: "",
        so_created_at: moment().format("YYYY-MM-DD hh:mm:ss"),
        actual_depot_user: localStorage.getItem("user_code"),
      },
    };

    console.log(postData);
    try {
      store.dispatch(loading(true));
      let updateStatus = await http.post(apis.DEALER_REQUEST_UPDATE, postData);

      if (updateStatus.data.code === 0) {
        Swal.fire("Success", "SO status successfully updated", "success");
      } else {
        Swal.fire("Error", "Something went wrong", "error");
      }
    } catch (error) {
    } finally {
      fetchDealerRequestList({
        ...formData,
        offset,
        limit: perPage,
      });
      store.dispatch(loading(false));
    }

  };

  // get dms data from sap
  const fetchDMSfromSAP = async (data) => {
    let fm_name = "ZRFC_FETCH_SO_FROM_DMS";

    let pendingPromise = data
      .filter(
        d =>
          d.status === 0 &&
          !checkedDMS.current.includes(d.dms_req_no)
      )
      .map(d => {
        checkedDMS.current.push(d.dms_req_no); // remember it
        return http.post(apis.COMMON_POST_WITH_FM_NAME, {
          fm_name,
          params: { IM_DMS_REQID: d.dms_req_no },
        });
      });

    if (pendingPromise.length === 0) return;

    let res = await Promise.all(pendingPromise);

    let updateSOs = res
      .map((ele) => {
        // ❌ Skip failed / unauth SAP responses
        if (!ele?.data?.status) {
          console.warn(
            "SAP RFC failed:",
            ele?.data?.message || "Unknown error"
          );
          return null;
        }

        const soDetails = ele?.data?.result?.IT_SO_DETAILS;

        // ❌ Skip empty or invalid responses
        if (!Array.isArray(soDetails) || soDetails.length === 0) {
          return null;
        }

        let details = soDetails[0];

        let postData = {
          id: getId(details.SO_DMS_REQID, data),
          login_id: localStorage.getItem("user_code"),
          data: {
            status: 1,
            so_number: details.ORDER_NO,
            so_created_at: moment().format("YYYY-MM-DD hh:mm:ss"),
            so_creation_message: `Depot:OR:Trade Sale ${details.ORDER_NO} has been saved`,
            actual_depot_user: localStorage.getItem("user_code"),
          },
        };

        return http.post(apis.DEALER_REQUEST_UPDATE, postData);
      })
      .filter(Boolean); // ✅ remove nulls safely

    if (updateSOs.length > 0) {
      await Promise.all(updateSOs);

      const refreshedData = {
        ...formData,
        offset,
        limit: perPage,
      };

      if (Object.keys(refreshedData).length > 2) {
        fetchDealerRequestList(refreshedData);
      }
    }
  };


  const getId = (id, data) => {
    let findId = data.find((ele) => ele.dms_req_no === id);
    return findId.id;
  };

  useEffect(() => {
    if (paginatedRequestData.length > 0 && formData.status == 0) {
      fetchDMSfromSAP(paginatedRequestData);
    }
  }, [paginatedRequestData, formData]);

  return (
    <div>
      <div>
        {/* Filter Section Open */}

        <form className="filter-section" onSubmit={handleSubmit(onSubmit)}>
          <div className="row">
            <div className="col">
              <div className="row">
                <div className="col-3">
                  <label>DMS Request No</label>
                </div>
                <div className="col-8">
                  <input
                    type="text"
                    placeholder="DMS Request No"
                    ref={register()}
                    name="dms_req_no"
                    style={{ textTransform: "uppercase" }}
                  />
                </div>
              </div>
            </div>
            <div className="col">
              <div className="row">
                <div className="col-3">
                  <label className="float-right">
                    Start Date<span>*</span>
                  </label>
                </div>
                <div className="col-3">
                  <input
                    type="date"
                    placeholder="From"
                    name="start_date"
                    ref={register({
                      validate: (value) => {
                        let ans = false;
                        if (watchAllFields.end_date) {
                          if (
                            moment(watchAllFields.start_date).isBefore(
                              moment(watchAllFields.end_date)
                            ) ||
                            moment(watchAllFields.start_date).isSame(
                              moment(watchAllFields.end_date)
                            )
                          ) {
                            ans = true;
                          }
                        } else {
                          ans = true;
                        }
                        return ans;
                      },
                    })}
                  />
                  {errors.start_date && (
                    <p className="form-error">Please put a valid value</p>
                  )}
                </div>
                <div className="col-3">
                  <label className="float-right">
                    End Date<span>*</span>
                  </label>
                </div>
                <div className="col-3">
                  <input
                    type="date"
                    name="end_date"
                    ref={register({
                      validate: (value) => {
                        let ans = false;
                        if (watchAllFields.start_date) {
                          if (
                            moment(watchAllFields.start_date).isBefore(
                              moment(watchAllFields.end_date)
                            ) ||
                            moment(watchAllFields.start_date).isSame(
                              moment(watchAllFields.end_date)
                            )
                          ) {
                            ans = true;
                          }
                        } else {
                          ans = true;
                        }
                        return ans;
                      },
                    })}
                  />
                  {errors.end_date && (
                    <p className="form-error">Please put a valid value</p>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col">
              <div className="row">
                <div className="col-2">
                  <label>
                    Status<span></span>
                  </label>
                </div>
                <div className="col-5">
                  <select name="status" ref={register}>
                    <option value={0}>Pending</option>
                    <option value={1}>Created</option>
                    <option value={2}>Rejected</option>
                    <option value={3}>Creation Error</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="col">
              <div className="row">
                <div className="col-6">
                  <button type="submit" className="search-button float-right">
                    <i className="fas fa-search icons-button"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Filter Section Close */}

        {/* Table Filter Open */}

        <div className="background">
          <div className="table-filter">
            {Object.keys(formData).length > 2 && (
              <div className="row">
                <div className="col-2 offset-10">
                  <button
                    className="search-button float-right"
                    style={{ color: "#fff" }}
                    onClick={() => {
                      fetchDealerRequestList({
                        ...formData,
                        offset,
                        limit: perPage,
                      });
                    }}

                  >
                    Refresh
                  </button>
                </div>
              </div>
            )}
            <div className="filter-div">
              <div className="row">
                <div className="col">
                  <div className="row">
                    <div className="col"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Table Div Open */}

            <div className="table-div" style={{ height: "500px" }}>
              <div className="row">
                <table className="table">
                  <thead>
                    <tr
                      style={{ position: "sticky", top: 0, background: "#fff" }}
                    >
                      {data.map((ele, i) => (
                        <th style={{ minWidth: ele.minWidth }} key={i}>
                          {ele.header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRequestData.map((ele, i) => (
                      <tr key={`Row-${i}`}>
                        <td>{getStatus(ele.status)}</td>
                        <td>{ele.sold_to_party}</td>
                        <td>{ele.sold_to_party_name}</td>
                        <td>{ele.ship_to_party}</td>
                        <td>{ele.ship_to_party_name}</td>
                        <td>{ele.dms_req_no}</td>
                        <td>{ele.material.replace(/^0+/, "")}</td>
                        <td>{ele.qty}</td>
                        <td>{ele.qty_unit}</td>
                        <td>{ele.ship_to_party_add}</td>
                        <td>{ele.so_creation_message}</td>
                        <td>{ele.so_number}</td>
                        <td>{ele.notified_to_dms}</td>
                        <td>{ele.ship_point}</td>
                        <td>{ele.plant}</td>
                        <td>{ele.sales_org}</td>
                        <td>{ele.ship_type}</td>
                        <td>
                          {moment(ele.requested_at).format("DD/MM/YY hh:mm a")}
                        </td>
                        <td>
                          {ele.so_created_at
                            ? moment(ele.so_created_at).format(
                              "DD/MM/YY hh:mm a"
                            )
                            : "NA"}
                        </td>
                        {Number(ele.status) === 0 ? (
                          <>
                            <td>
                              <Link
                                className="btn btn-success"
                                to={`/dashboard/dealer-sales-order/${ele.dms_req_no}`}
                                style={{ margin: "0px" }}
                              >
                                Create
                              </Link>
                            </td>
                            <td>
                              <button
                                className="btn btn-danger"
                                onClick={() =>
                                  rejectDealerSO({
                                    dms: ele.dms_req_no,
                                    id: ele.id,
                                  })
                                }
                              >
                                Reject
                              </button>
                            </td>
                          </>
                        ) : (
                          <td></td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="row">
          <div style={{ margin: "10px 30px" }}>
            <button disabled={!offset} onClick={() => setOffset(offset - 1)}>
              Prev
            </button>
            <button onClick={() => setOffset(offset + 1)}>Next</button>
          </div>

          <div className="col-1">
            <label className="float-left" style={{ paddingTop: "12px" }}>
              Visible Rows
            </label>
          </div>
          <div className="col-1">
            <select
              onChange={(e) => {
                setPerPage(Number(e.target.value));
              }}
              style={{ width: "50px" }}
            >
              <option>10</option>
              <option>20</option>
              <option>50</option>
              <option>100</option>
            </select>
          </div>
        </div>

        <div
          className="agregatePageTable"
          style={{
            marginLeft: "30px",
          }}
        ></div>
      </div>
    </div>
  );
};

const mapStateToProps = (state) => ({});

const mapDispatchToProps = {
  loading,
};

export default connect(mapStateToProps, mapDispatchToProps)(DealerRequestList);
