

// import React, { useEffect, useState } from "react";
// import { connect } from "react-redux";
// import http from "../../services/apicall";
// import apis from "../../services/apis";
// import Swal from "sweetalert2";
// import { Modal } from "react-bootstrap";
// import { loading } from "../../actions/loadingAction";
// import store from "../../store";

// export const ValuationTypeManagement = () => {
//   const [data, setData] = useState([]);
//   const [openModal, setOpenModal] = useState(false);
//   const [postData, setPostData] = useState({});

//   const columns = [
//     { header: "Dept Code", key: "DEPT_CODE" },
//     { header: "Valuation Type", key: "VALUATION_TYPE" },
//     { header: "Delete", key: "_id" },
//   ];

//   /* Fetch */
//   const fetchData = async () => {
//     const res = await http.post(apis.GET_VALUATION_TYPES_NEW, {});
//     if (res.data.code === 0) {
//       setData(res.data.result);
//     }
//   };

//   useEffect(() => {
//     fetchData();
//   }, []);

//   /* Delete */
//   const deleteRow = (id) => {
//     Swal.fire({
//       title: "Are you sure?",
//       icon: "warning",
//       showCancelButton: true,
//       confirmButtonText: "Yes, delete it!",
//       preConfirm: () => deleteItem(id),
//     });
//   };

//   const deleteItem = async (id) => {
//     try {
//       store.dispatch(loading(true));
//       await http.post(apis.DELETE_VALUATION_TYPE, { id });
//       fetchData();
//     } finally {
//       store.dispatch(loading(false));
//     }
//   };

//   /* Add */
//   const addItem = async () => {
//     if (!postData.DEPT_CODE || !postData.VALUATION_TYPE) {
//       Swal.fire("Warning", "Fill all fields", "warning");
//       return;
//     }

//     try {
//       store.dispatch(loading(true));
//       await http.post(apis.ADD_VALUATION_TYPE, postData);
//       setPostData({});
//       setOpenModal(false);
//       fetchData();
//     } finally {
//       store.dispatch(loading(false));
//     }
//   };

//   return (
//     <div className="container" style={{ marginTop: 60 }}>
//       <div className="d-flex justify-content-between mb-3">
//         <h5>Valuation Type Management</h5>
//         <button
//           className="goods-button"
//           style={{ background: "green" }}
//           onClick={() => setOpenModal(true)}
//         >
//           Add
//         </button>
//       </div>

//       <table className="table">
//         <thead>
//           <tr>
//             {columns.map(c => (
//               <th key={c.key}>{c.header}</th>
//             ))}
//           </tr>
//         </thead>
//         <tbody>
//           {data.map(row => (
//             <tr key={row._id}>
//               <td>{row.DEPT_CODE}</td>
//               <td>{row.VALUATION_TYPE}</td>
//               <td>
//                 <img
//                   src="/images/delete.png"
//                   alt="delete"
//                   style={{ width: 25, cursor: "pointer" }}
//                   onClick={() => deleteRow(row._id)}
//                 />
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </table>

//       <Modal show={openModal} onHide={() => setOpenModal(false)} centered>
//         <Modal.Header closeButton>
//           <Modal.Title>Add Valuation Type</Modal.Title>
//         </Modal.Header>
//         <Modal.Body>
//           <input
//             className="form-control mb-2"
//             placeholder="Dept Code"
//             value={postData.DEPT_CODE || ""}
//             onChange={e =>
//               setPostData({ ...postData, DEPT_CODE: e.target.value })
//             }
//           />
//           <input
//             className="form-control"
//             placeholder="Valuation Type"
//             value={postData.VALUATION_TYPE || ""}
//             onChange={e =>
//               setPostData({ ...postData, VALUATION_TYPE: e.target.value })
//             }
//           />
//         </Modal.Body>
//         <Modal.Footer>
//           <button
//             className="goods-button"
//             style={{ background: "green" }}
//             onClick={addItem}
//           >
//             Add
//           </button>
//         </Modal.Footer>
//       </Modal>
//     </div>
//   );
// };

// export default connect(null, { loading })(ValuationTypeManagement);


import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import http from "../../services/apicall";
import apis from "../../services/apis";
import Swal from "sweetalert2";
import { Modal } from "react-bootstrap";
import { loading } from "../../actions/loadingAction";
import store from "../../store";

export const ValuationTypeManagement = () => {
  const [allData, setAllData] = useState([]);
  const [openmodal, setOpenmodal] = useState(false);
  const [postData, setPostData] = useState({});

  const columns = [
    { header: "Depo Code", key: "DEPT_CODE" },
    { header: "Valuation Type", key: "VALUATION_TYPE" },
    { header: "Delete", key: "_id" },
  ];

  /* ---------------- Fetch ---------------- */
  const fetchData = async () => {
    const res = await http.post(apis.GET_VALUATION_TYPES_NEW, {});
    if (res.data.code === 0) {
      setAllData(res.data.result);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* ---------------- Delete ---------------- */
  const deleteRow = (id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      preConfirm: () => deleteItem(id),
    });
  };

  const deleteItem = async (id) => {
    try {
      store.dispatch(loading(true));
      await http.post(apis.DELETE_VALUATION_TYPE, { id });
      fetchData();
    } finally {
      store.dispatch(loading(false));
    }
  };

  /* ---------------- Add ---------------- */
  const addItem = async () => {
    if (!postData.DEPT_CODE || !postData.VALUATION_TYPE) {
      Swal.fire("Please fill all the fields", "", "warning");
      return;
    }

    try {
      store.dispatch(loading(true));
      await http.post(apis.ADD_VALUATION_TYPE, postData);
      setPostData({});
      setOpenmodal(false);
      fetchData();
    } finally {
      store.dispatch(loading(false));
    }
  };

  return (
    <div
      className="container row data-management user-edit"
      style={{ margin: "60px auto" }}
    >
      {/* ---------- Header ---------- */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "20px",
        }}
      >
        <div style={{ marginLeft: "10px" }}>
          Valuation Type
        </div>

        <button
          className="goods-button"
          style={{ background: "green" }}
          onClick={() => setOpenmodal(true)}
        >
          Add
        </button>
      </div>

      {/* ---------- Table ---------- */}
      <div
        style={{ height: 700, overflow: "auto", width: "100%" }}
        className="table-div"
      >
        <table
          className="table"
          style={{
            width: "100%",
            maxHeight: 700,
            margin: "0px",
          }}
        >
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  style={{
                    position: "sticky",
                    top: "0px",
                    background: "white",
                    minWidth: "120px",
                  }}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {allData.map((row) => (
              <tr key={row._id}>
                <td>{row.DEPT_CODE}</td>
                <td>{row.VALUATION_TYPE}</td>
                <td>
                  <img
                    src="/images/delete.png"
                    alt="delete"
                    style={{ width: "30px", cursor: "pointer" }}
                    onClick={() => deleteRow(row._id)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ---------- Modal ---------- */}
      <Modal show={openmodal} onHide={() => setOpenmodal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Add Valuation Type</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <div className="row">
            <div className="col-md-12 mb-3">
              <div className="form-group">
                <label>
                  Depo Code<span>*</span>
                </label>
                <input
                  className="form-control"
                  value={postData.DEPT_CODE || ""}
                  onChange={(e) =>
                    setPostData({ ...postData, DEPT_CODE: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="col-md-12">
              <div className="form-group">
                <label>
                  Valuation Type<span>*</span>
                </label>
                <input
                  className="form-control"
                  value={postData.VALUATION_TYPE || ""}
                  onChange={(e) =>
                    setPostData({
                      ...postData,
                      VALUATION_TYPE: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <button
            className="goods-button"
            style={{ background: "green" }}
            onClick={addItem}
          >
            Add Valuation Type
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default connect(null, { loading })(ValuationTypeManagement);
