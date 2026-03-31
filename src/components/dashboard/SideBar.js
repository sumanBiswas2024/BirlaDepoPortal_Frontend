import React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { toggleSidebar } from "../../actions/authAction";
import store from "../../store";
import { RAKE_USERS } from "../../data/RAKE_USER_TYPES";
import isWithinLast3DaysOfMonth from "../../Functions/IsLast3Days";
import moment from "moment";

function SideBar(props) {
  const viewLogic = (user_type = []) => {
    return user_type.includes(props.user.user_type) ? true : false;
  };

  const isLast3Days = isWithinLast3DaysOfMonth(moment());

  return (
    <>
      <div className={"sidebar " + (props.Auth.sidebarOpen ? "open" : "")}>
        <div className="sidebar-header">
          <div className="img-div desktop">
            <img
              className="img-fluid"
              src="/images/mp-birla-logo.jpeg"
              alt="logo"
            />
          </div>
          <div
            className="svg-div"
            onClick={() =>
              store.dispatch({ type: "TOGGLE_SIDEBAR", payload: false })
            }
          ></div>
        </div>
        <div className="sidebar-image">
          <div className="sidebar-body">
            <ul>
              {/* admin is 1, user is 2 and CNF is 3 */}
              {/* all */}
              <li className="sidebar-li">
                <Link
                  className={
                    "sidebar-link" +
                    (props.activeOption === "Dashboard" ? " active" : "")
                  }
                  to="/dashboard/root"
                >
                  <i className="fas fa-columns"></i>
                  Dashboard
                </Link>
              </li>
              {/* admin and user */}
              {viewLogic([1, 2]) && (
                <>
                  <li className="sidebar-li">
                    <Link
                      className={
                        props.activeOption === "Goods Receipts"
                          ? "sidebar-link active"
                          : "sidebar-link"
                      }
                      to="/dashboard/goods-receipt/create"
                    >
                      <i className="fas fa-shopping-bag"></i>
                      Goods Receipts
                    </Link>
                  </li>

                  <li className="sidebar-li">
                    <Link
                      className={
                        "sidebar-link" +
                        (props.activeOption === "Sales Order" ? " active" : "")
                      }
                      to="/dashboard/sales-order/create"
                    >
                      <i className="far fa-clipboard"></i>
                      Sales Order
                    </Link>
                  </li>
                  <li className="sidebar-li">
                    <Link
                      className={
                        "sidebar-link" +
                        (props.activeOption === "Delivery" ? " active" : "")
                      }
                      to="/dashboard/delivery/list"
                    >
                      <i className="fas fa-truck"></i>
                      Delivery
                    </Link>
                  </li>
                  <li className="sidebar-li">
                    <Link
                      className={
                        "sidebar-link" +
                        (props.activeOption === "Diversion" ? " active" : "")
                      }
                      to="/dashboard/diversion"
                    >
                      <i className="fas fa-forward"></i>
                      Diversion
                    </Link>
                  </li>
                  <li className="sidebar-li">
                    <Link
                      className={
                        "sidebar-link" +
                        (props.activeOption === "Finance" ? " active" : "")
                      }
                      to="/dashboard/finance/invoice-create"
                    >
                      <i className="fas fa-credit-card"></i>
                      Finance
                    </Link>
                  </li>
                  <li className="sidebar-li">
                    <Link
                      className={
                        "sidebar-link" +
                        (props.activeOption === "Reports" ? " active" : "")
                      }
                      to={
                        !isLast3Days
                          ? "/dashboard/reports/le-register"
                          : "/dashboard/reports/fi-daywise"
                      }
                    >
                      <i className="fas fa-chart-line"></i>
                      Reports
                    </Link>
                  </li>
                  <li className="sidebar-li">
                    <Link
                      className={
                        "sidebar-link" +
                        (props.activeOption === "DMS Order Request"
                          ? " active"
                          : "")
                      }
                      to="/dashboard/dealer-requests"
                    >
                      <i className="far fa-sticky-note"></i>
                      DMS Ord. Request
                    </Link>
                  </li>
                </>
              )}

              {/* cnf and admin */}
              {viewLogic([1, 3]) && (
                <>
                  {false && (props.CFA_AUTH?.CAP_INVT ||
                    props.CFA_AUTH?.APP_INVT ||
                    props.CFA_AUTH?.DIS_INVT) && (
                    <li className="sidebar-li">
                      <Link
                        className={
                          "sidebar-link" +
                          (props.activeOption === "Physical Inventory"
                            ? " active"
                            : "")
                        }
                        to={
                          props.CFA_AUTH?.CAP_INVT
                            ? "/dashboard/physical-inventory/create-inventory"
                            : "/dashboard/physical-inventory/display-inventory"
                        }
                      >
                        <i className="fas fa-truck"></i>
                        Physical Inventory
                      </Link>
                    </li>
                  )}

                  {(props.CFA_AUTH?.USER_CATEGORY === "CFA" ||
                    props.CFA_AUTH?.USER_CATEGORY === "REGH") && (
                    <>
                      <li className="sidebar-li">
                        <Link
                          className={
                            "sidebar-link" +
                            (props.activeOption === "Rake Arrival Report"
                              ? " active"
                              : "")
                          }
                          to={
                            props.CFA_AUTH?.USER_CATEGORY === "CFA"
                              ? "/dashboard/damage-data-entry/rake-data"
                              : "/dashboard/damage-data-entry/rake-arrival-report"
                          }
                        >
                          <i className="fas fa-truck"></i>
                          Rake Arrival Report
                        </Link>
                      </li>
                    </>
                  )}
                  {props.CFA_AUTH?.REP_INVT && (
                    <li className="sidebar-li">
                      <Link
                        className={
                          "sidebar-link" +
                          (props.activeOption === "Stock Report"
                            ? " active"
                            : "")
                        }
                        to="/dashboard/stock-report/comparative-reports"
                      >
                        <i className="fas fa-chart-line"></i>
                        Report
                      </Link>
                    </li>
                  )}
                </>
              )}

              {/* Branch Head and CS Logic */}
              {RAKE_USERS.includes(props.Auth.userdetails.user_type) && (
                <li className="sidebar-li">
                  <Link
                    className={
                      "sidebar-link" +
                      (props.activeOption === "Rake Arrival Report"
                        ? " active"
                        : "")
                    }
                    to={"/dashboard/damage-data-entry/rake-report"}
                  >
                    <i className="fas fa-truck"></i>
                    Rake Arrival Data
                  </Link>
                </li>
              )}

              <li className="sidebar-li">
                <Link
                  className={
                    "sidebar-link" +
                    (props.activeOption === "Profile" ? " active" : "")
                  }
                  to="/dashboard/profile/user-profile"
                >
                  <i className="fas fa-user-circle"></i>
                  Profile
                </Link>
              </li>

              {/* admin */}
              {viewLogic([1]) && (
                <>
                  <li className="sidebar-li">
                    <Link
                      className={
                        "sidebar-link" +
                        (props.activeOption === "User Adminstration"
                          ? " active"
                          : "")
                      }
                      to="/dashboard/user-admin/user-create"
                    >
                      <i className="fas fa-user-alt"></i>
                      User Administration
                    </Link>
                  </li>
                  <li className="sidebar-li">
                    <Link
                      className={
                        "sidebar-link" +
                        (props.activeOption === "Data Management"
                          ? " active"
                          : "")
                      }
                      to="/dashboard/data-management/shipping-type"
                    >
                      <i className="fas fa-user-alt"></i>
                      Data Management
                    </Link>
                  </li>
                </>
              )}
            </ul>

            <div className="sidebar-user">
              <div className="avatar-div"></div>
              <div className="name-div">
                <p className="user-name">{props.user.name}</p>
                <p className="user-category">Admin</p>
              </div>
            </div>
            <div className="sidebar-footer">
              <span className="birla badge">2024 Birla Corporation Ltd</span>
              <br />
              <span className="copyright">All right reserved</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

const mapStateToProps = (state) => ({
  Auth: state.Auth,
  CFA_AUTH: state.Auth.cfa,
});

export default connect(mapStateToProps, { toggleSidebar })(SideBar);
