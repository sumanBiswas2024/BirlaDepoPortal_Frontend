import React, { useEffect, useState, useRef } from "react";
import { useHistory } from "react-router-dom";
import { loading } from "../../actions/loadingAction";
import apis from "../../services/apis";
import { connect } from "react-redux";
import { useForm } from "react-hook-form";
import http from "../../services/apicall";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Swal from "sweetalert2";
import ReactExport from "react-export-excel";
import { getUserType } from "../../data/RAKE_USER_TYPES";
import ReactPaginate from "react-paginate";

const ExcelFile = ReactExport.ExcelFile;
const ExcelSheet = ReactExport.ExcelFile.ExcelSheet;
const ExcelColumn = ReactExport.ExcelFile.ExcelColumn;

function UserEditList(props) {
  const { register, handleSubmit, reset, errors } = useForm({
    mode: "onSubmit",
    reValidateMode: "onChange",
  });
  const [paginatedSalesOrders, setPaginatedSalesOrders] = useState([]);
  const [fetchUsers, setFetchUsers] = useState([]);
  const [perPage, setPerpage] = useState(50);
  const [pageCount, setPageCount] = useState(20);
  const [page, setPage] = useState(0);
  const [isUserModalVisible, setIsUserModalVisible] = useState(false);
  const [newUserId, setUserId] = useState([{ id: parseInt() }]);
  const [newName, setnewName] = useState([{ name: "" }]);
  const [newUserCode, setnewUserCode] = useState([{ user_code: "" }]);
  const [newEmail, setnewEmail] = useState([{ email: "" }]);
  const [newMobile, setnewMobile] = useState([{ mobile: "" }]);
  const [newUserType, setnewUserType] = useState([{ user_type: parseInt() }]);
  const [newPassword, setnewPassword] = useState("");
  const [newStatus, setnewStatus] = useState([{ status: parseInt() }]);
  const [isReset, setIsReset] = useState(false);
  const [isRFCReset, setIsRFCReset] = useState(false);
  const [newRFCPassword, setNewRFCPassword] = useState("");

  const [allUsersExcel, setAllUsersExcel] = useState([]);
  const tableRef = useRef(null);

  let users = null;
  const [search, setSearch] = useState("");

  useEffect(() => {
    getUserDeatils();
  }, []);

  var getUserDeatils = () => {
    // props.loading(true);
    // http.get(apis.ALLUSER).then((res) => {
    //   users = res.data.result;
    //   if (users?.length > 0) {
    //     setFetchUsers(users);
    //     setPageCount(users?.length / users.length);
    //   }
    // });
    props.loading(true);

    // pagination data
    http.get(`${apis.ALLUSER}?page=${page + 1}&limit=${perPage}`)   // // Portal Security Assessment_Pagination
      .then((res) => {

        let users = res.data.result;

        if (users?.length > 0) {
          setFetchUsers(users);
          setPageCount(Math.ceil(res.data.total / perPage));
        }

        props.loading(false);

      });

    // full user list (only once)
    if (allUsersExcel.length === 0) {

      http.get(`${apis.ALLUSER}`)
        .then((res) => {
          setAllUsersExcel(res.data.result);
        });
    }
  };

  let headers = [
    { label: "Name", key: "name" },
    { label: "User Code", key: "user_code" },
    { label: "Email", key: "email" },
    { label: "Mobile", key: "mobile" },
    { label: "Status(1 is Lock and 0,2 is Unlock)", key: "status" },
  ];

  let history = useHistory();

  const generateRow = (
    row,
    key,
    name,
    user_code,
    email,
    user_type,
    mobile,
    status,
  ) => {
    return (
      <tr key={key}>
        <td>{name}</td>
        <td>{user_code}</td>
        <td>{email}</td>
        <td>
          <p className={getUserType(user_type)?.class}>
            {getUserType(user_type)?.name}
          </p>
        </td>
        <td>{mobile}</td>
        <td>
          {status === "1" ? (
            <p className="disable-test" style={{ color: "red" }}>
              <i className="fas fa-lock"></i>
            </p>
          ) : (
            <p className="enable-text">
              <i className="fas fa-unlock"></i>
            </p>
          )}
        </td>
        <td>
          <button
            className="edit-button"
            onClick={() => {
              // console.log(row.status);
              setIsUserModalVisible(true);

              setUserId({
                id: row.id,
              });
              setnewName({
                name: name,
              });
              setnewUserCode({
                user_code: user_code,
              });
              setnewEmail({
                email: email,
              });
              setnewMobile({
                mobile: mobile,
              });
              setnewUserType({
                user_type: user_type,
              });
              setnewStatus({
                status: row.status,
              });
            }}
          >
            Edit
          </button>
        </td>
        <td>
          <button
            className="edit-button"
            style={{ backgroundColor: "green" }}
            onClick={(e) => {
              history.push(
                "/dashboard/user-admin/user-create?user_id=" + row.id,
              );
            }}
          >
            Copy
          </button>
        </td>
      </tr>
    );
  };

  // var pageChange = ({ selected }) => {
  //   setPaginatedSalesOrders(
  //     fetchUsers.slice(selected * perPage, perPage * (selected + 1)),
  //   );
  //   setPage(selected * perPage);
  // };
  
  var pageChange = ({ selected }) => {    // Portal Security Assessment_Pagination

    setPage(selected);

    props.loading(true);

    http.get(`${apis.ALLUSER}?page=${selected + 1}&limit=${perPage}`)
      .then((res) => {

        setFetchUsers(res.data.result);
        setPageCount(Math.ceil(res.data.total / perPage));

        props.loading(false);

        if (tableRef.current) {
          tableRef.current.scrollTop = 0;
        }

      });

  };

  // useEffect(() => {
  //   pageChange({ selected: 0 });
  // }, [perPage, fetchUsers]);

  useEffect(() => {
    pageChange({ selected: 0 });    // Portal Security Assessment_Pagination
  }, [perPage]);

  let saveFormData = (data) => {
    if (data.password == undefined) {
      data.password = "";
    }
    // console.log(data);
    http
      .post(apis.UPDATE_USER, data)
      .then((res) => {
        Swal.fire({
          text: res.data.message,

          confirmButtonText: "Ok",
        }).then(function () {
          // history.push("/dashboard/root/");
          window.location.reload();
        });
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const onSubmit = (data) => {
    setIsUserModalVisible(false);
    let userData = {
      id: newUserId.id,
      name: newName.name,
      user_code: newUserCode.user_code,
      email: newEmail.email,
      mobile: newMobile.mobile,
      user_type: newUserType.user_type,
      password: newPassword,
      rfc_password: newRFCPassword,
      status: newStatus.status,
    };

    setUserId({
      id: parseInt(),
    });
    setnewName({
      name: "",
    });
    setnewUserCode({
      user_code: "",
    });
    setnewEmail({
      email: "",
    });
    setnewMobile({
      mobile: "",
    });
    setnewUserType({
      user_type: parseInt(),
    });
    setnewPassword({
      password: "",
    });
    setnewStatus({
      status: parseInt(),
    });

    saveFormData(userData);
  };

  // const filteredUsers = () => {
  // const filteredUser = fetchUsers.filter((user) => {
  //   return user.user_code.toLowerCase().includes(search.toLowerCase());
  // });
  const filteredUsers = search
    ? (allUsersExcel || []).filter((user) =>
      (user?.user_code || "")
        .toLowerCase()
        .includes(search.toLowerCase())
    )
    : fetchUsers;

  //   setFilteredUser(filteredUser);
  // };
  // useEffect(() => {
  //   filteredUsers();
  // }, [search]);

  return (
    <div className="row input-area user-edit" style={{ marginTop: "40px" }}>
      <div style={{ display: "flex" }}>
        <input
          type="text"
          placeholder="Search User Code"
          onChange={(e) => {
            setSearch(e.target.value);
          }}
        ></input>
        {paginatedSalesOrders ? (
          <ExcelFile
            filename={`Download User`}
            element={
              <button
                className="goods-button float-right"
                style={{
                  backgroundColor: "#0F6FA2",
                  width: "200px",
                  margin: "0px 10px",
                }}
              >
                Export to Excel
              </button>
            }
          >
            {/* <ExcelSheet data={fetchUsers} name="FI Register Report"> */}
            <ExcelSheet data={allUsersExcel} name="FI Register Report">
              {headers?.map((value, i) => (
                <ExcelColumn
                  key={value}
                  label={value.label}
                  value={value.key}
                />
              ))}
            </ExcelSheet>
          </ExcelFile>
        ) : null}
      </div>
      {/* <div className="table-div" style={{ height: "550px" }}> */}
      <div
        className="table-div"
        style={{ height: "550px", overflowY: "auto" }}
        ref={tableRef}
      >
        <div className="">
          <table className="table" style={{ marginLeft: "0px" }}>
            <thead>
              <tr>
                <th
                  style={{
                    position: "sticky",
                    top: "0px",
                    background: "white",
                    minWidth: "70px",
                    maxWidth: "70px",
                  }}
                  scope="col"
                >
                  Name
                </th>
                <th
                  style={{
                    position: "sticky",
                    top: "0px",
                    background: "white",
                    minWidth: "130px",
                  }}
                  scope="col"
                >
                  User Code
                </th>
                <th
                  style={{
                    position: "sticky",
                    top: "0px",
                    background: "white",
                    minWidth: "145px",
                  }}
                  scope="col"
                >
                  Email
                </th>
                <th
                  style={{
                    position: "sticky",
                    top: "0px",
                    background: "white",
                    minWidth: "127px",
                  }}
                  scope="col"
                >
                  User Type
                </th>
                <th
                  style={{
                    position: "sticky",
                    top: "0px",
                    background: "white",
                    minWidth: "70px",
                  }}
                  scope="col"
                >
                  Mobile
                </th>
                <th
                  style={{
                    position: "sticky",
                    top: "0px",
                    background: "white",
                    minWidth: "70px",
                  }}
                  scope="col"
                >
                  Account Access
                </th>
                <th
                  style={{
                    position: "sticky",
                    top: "0px",
                    background: "white",
                    minWidth: "70px",
                  }}
                  scope="col"
                >
                  Edit
                </th>
                <th
                  style={{
                    position: "sticky",
                    top: "0px",
                    background: "white",
                    minWidth: "70px",
                  }}
                  scope="col"
                >
                  Copy
                </th>
              </tr>
            </thead>
            <tbody style={{ height: "auto", textAlign: "center" }}>
              {filteredUsers?.map((row, key) => {
                // props.loading(false);
                return generateRow(
                  row,
                  key,
                  row.name,
                  row.user_code,
                  row.email,
                  row.user_type,
                  row.mobile,
                  row.status,
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <br />
      {!search && (
        <div className="row">
          <ReactPaginate
            previousLabel={"prev"}
            nextLabel={"next"}
            breakLabel={"..."}
            breakClassName={"break-me"}

            pageCount={pageCount}

            marginPagesDisplayed={2}
            pageRangeDisplayed={5}

            onPageChange={pageChange}

            containerClassName={"pagination"}
            activeClassName={"active"}

            pageClassName={"page-item"}
            pageLinkClassName={"page-link"}

            previousClassName={"page-item"}
            previousLinkClassName={"page-link"}

            nextClassName={"page-item"}
            nextLinkClassName={"page-link"}

            breakLinkClassName={"page-link"}
          />{" "}
          <div className="col-3">
            <label className="float-right" style={{ lineHeight: "35px" }}>
              Visible Rows:
            </label>
          </div>
          &emsp;
          <div className="col-1">
            <select
              onChange={(e) => {
                // setPerpage(e.target.value);
                setPerpage(parseInt(e.target.value));
              }}
              style={{ width: "50px" }}
            >
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="150">150</option>
              <option value="200">200</option>
            </select>
          </div>
        </div>
      )}

      {/* User Edit modal */}
      <Modal
        show={isUserModalVisible}
        size="lg"
        centered
        className="modal"
        onHide={() => {
          setIsUserModalVisible(false);
        }}
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <Modal.Header closeButton>
            <Modal.Title>User Update</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="modal-div">
              <div className="col">
                <div className="user_code">
                  <label htmlFor="user_code">User Code</label>
                  <input
                    type="text"
                    className=""
                    placeholder="User Code"
                    name="user_code"
                    value={newUserCode.user_code}
                    onChange={(e) => {
                      setnewUserCode({ user_code: e.target.value });
                    }}
                    ref={register({
                      required: "Required",
                    })}
                  ></input>
                  {errors.userCode && <p>{errors.userCode.message}</p>}
                </div>
                <div className="userName">
                  <label htmlFor="name">Name</label>
                  <input
                    type="text"
                    className=""
                    placeholder="Name"
                    name="name"
                    value={newName.name}
                    onChange={(e) => {
                      setnewName({ name: e.target.value });
                    }}
                    ref={register({
                      required: "Required",
                    })}
                  ></input>
                  {errors.name && <p>{errors.name.message}</p>}
                </div>
                <div className="email">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    className=""
                    placeholder="Email"
                    name="email"
                    value={newEmail.email}
                    onChange={(e) => {
                      setnewEmail({ email: e.target.value });
                    }}
                    ref={register({
                      // required: "Required",
                    })}
                  ></input>
                  {errors.email && <p>{errors.email.message}</p>}
                </div>
                <div className="">
                  <label htmlFor="mobile">Mobile</label>
                  <input
                    type="text"
                    className=""
                    placeholder="Mobile"
                    name="mobile"
                    value={newMobile.mobile}
                    onChange={(e) => {
                      setnewMobile({ mobile: e.target.value });
                    }}
                    ref={register({
                      required: "Required",
                      maxLength: {
                        value: 10,
                        message: "Require 10 Digits",
                      },
                    })}
                  ></input>
                  {errors.mobile && <p>{errors.mobile.message}</p>}
                </div>
                <div className="user_type">
                  <label htmlFor="user_type">User Type</label>
                  <select
                    name="user_type"
                    value={newUserType.user_type}
                    onChange={(e) => {
                      setnewUserType({ user_type: +e.target.value });
                    }}
                  >
                    <option value="1">Admin</option>
                    <option value="2">User</option>
                    <option value="3">CFA</option>
                    <option value="4">Branch Head</option>
                    <option value="5">CS Officer</option>
                    <option value="6">Logistics Head</option>
                    <option value="7">Logistics Head (Read)</option>
                    <option value="9">Sales Account Manager</option>
                    <option value="8">Secondary Distribution Manager</option>
                  </select>
                </div>
                <div className="password">
                  <label htmlFor="password">Reset Password</label>
                  <br />
                  <button
                    type="button"
                    style={{
                      margin: "10px 0 0 0",
                    }}
                    onClick={() => {
                      // setnewPassword({ password: "12345678" });
                      setIsReset(true);
                    }}
                  >
                    Reset
                  </button>
                  {isReset ? (
                    <input
                      type="text"
                      onChange={(e) => setnewPassword(e.target.value)}
                    />
                  ) : null}
                </div>
                <div className="password">
                  <label htmlFor="password">Reset RFC Password</label>
                  <br />
                  <button
                    type="button"
                    style={{
                      margin: "10px 0 0 0",
                    }}
                    onClick={() => {
                      // setnewPassword({ password: "12345678" });
                      setIsRFCReset(true);
                    }}
                  >
                    Reset
                  </button>
                  {isRFCReset ? (
                    <input
                      type="text"
                      onChange={(e) => setNewRFCPassword(e.target.value)}
                    />
                  ) : null}
                </div>
                <div className="status">
                  <label htmlFor="status">Account Access</label>
                  <select
                    name="status"
                    value={newStatus.status}
                    onChange={(e) => {
                      setnewStatus({ status: +e.target.value });
                    }}
                  >
                    <option value="1">Lock</option>
                    <option value="2">Unlock</option>
                  </select>
                </div>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer className="modal-footer">
            <Button className="button modal-button" type="submit">
              Update
            </Button>
          </Modal.Footer>
        </form>
      </Modal>
      {/* User Edit modal close*/}
    </div>
  );
}

const mapStateToProps = (state) => ({
  Auth: state.Auth,
});

export default connect(mapStateToProps, { loading })(UserEditList);
