import React, { useEffect, useState } from "react";
import { Switch, Route, useLocation } from "react-router-dom";
import http from "../../services/apicall";
import apis from "../../services/apis";
import { connect } from "react-redux";
import moment from "moment";
import { decideMainRoute } from "../../services/decideRoute";
import SideBar from "./SideBar";
import Navbar from "./Navbar";
import { setUserDetails, logout } from "../../actions/authAction";
import { loading } from "../../actions/loadingAction";
import { cfaAuth } from "../../actions/authAction";
import Swal from "sweetalert2";
import removeLocalItem from "../../services/removeLocalStorage";
import store from "../../store";
// import SQLData from "../SQL_Data_Maintain/SQLData";
import salesHead from "../Inventory_Package/salesHead";
import DataManagement from "../SQL_Data_Maintain/DataManagement";

import ProtectedRoute from "../Protector/ProtectedRoute";

// import Root from "../root/Root";
// import SalesOrderPackage from "../Sales_Order_Package/SalesOrderPackage";
// import DeliveryPackage from "../Delivery_Package/DeliveryPackage";
// import GoodReceiptPackage from "../GoodReceipt_Package/GoodReceiptPackage";
// import FinancePackage from "../Finance_Package/FinancePackage";
// import UserAdminPackage from "../User_Admin_Package/UserAdminPackage";
// import ProfilePackage from "../Profile_Package/ProfilePackage";
// import ReportPackage from "../Report/ReportPackage";
// import Diversion from "../Diversion/Diversion";
// import { DealerRequestList } from "../Dealer_Request/DealerRequestList";
// import DealerSOCreate from "../Dealer_Request/DealerSOCreate";
// import InventoryPackage from "../Inventory_Package/InventoryPackage";
// import InventoryReportPackage from "../Inventory_Package/InventoryReportPackage";
// import DamagePackage from "../Damage_Package/DamagePackage";

const Root = React.lazy(() => import("../root/Root"));
const SalesOrderPackage = React.lazy(() =>
  import("../Sales_Order_Package/SalesOrderPackage")
);
const DeliveryPackage = React.lazy(() =>
  import("../Delivery_Package/DeliveryPackage")
);
const GoodReceiptPackage = React.lazy(() =>
  import("../GoodReceipt_Package/GoodReceiptPackage")
);
const FinancePackage = React.lazy(() =>
  import("../Finance_Package/FinancePackage")
);
const UserAdminPackage = React.lazy(() =>
  import("../User_Admin_Package/UserAdminPackage")
);
const ProfilePackage = React.lazy(() =>
  import("../Profile_Package/ProfilePackage")
);
const ReportPackage = React.lazy(() => import("../Report/ReportPackage"));
const Diversion = React.lazy(() => import("../Diversion/Diversion"));
const DealerRequestList = React.lazy(() =>
  import("../Dealer_Request/DealerRequestList")
);
const DealerSOCreate = React.lazy(() =>
  import("../Dealer_Request/DealerSOCreate")
);
const InventoryPackage = React.lazy(() =>
  import("../Inventory_Package/InventoryPackage")
);
const InventoryReportPackage = React.lazy(() =>
  import("../Inventory_Package/InventoryReportPackage")
);
const DamagePackage = React.lazy(() =>
  import("../Damage_Package/DamagePackage")
);

let now = moment();

function Wrapper(props) {
  let location = useLocation();
  let [activeOption, setactiveOption] = useState();
  const [isOpen, setIsOpen] = useState(true);

  //set the header text
  useEffect(() => {
    store.dispatch({ type: "TOGGLE_SIDEBAR", payload: false });
    setactiveOption(decideMainRoute(location.pathname));
  }, [location.pathname]);

  //fetch user details
  useEffect(() => {
    http
      .get(apis.FETCH_USER_DETAILS)
      .then((res) => {
        if (res.data.status) {
          props.setUserDetails(res.data.result[0]);

          if (res.data.result[0].user_type === 3) getMappedCFA();

          if (res.data.result[0].status === "1") {
            console.log("Hello");
            Swal.fire({
              title: "You are locked",
              icon: "error",
            }).then(() => OverallLogout());
          }
        } else {
          OverallLogout();
        }
      })
      .catch((err) => {
        OverallLogout();
      });
  }, []);

  let OverallLogout = () => {
    localStorage.removeItem("Token");
    localStorage.removeItem("user_code");
    removeLocalItem();
    props.logout();
  };

  const getAuthrights = () => {
    props.loading(true);
    // http
    //   .post(apis.COMMON_POST_WITH_FM_NAME, {
    //     fm_name: "ZRFC_GET_USER_AUTH",
    //     params: {
    //       IM_USERID: localStorage.getItem("user_code"),
    //     },
    //   })
    // .then((res) => {
    //   if (res.data.status) {
    //     store.dispatch({
    //       type: "CFA_AUTH",
    //       payload: res.data.result.EX_USER,
    //     });
    //   }
    // })
    http
      .post("/rfc-reducer/get-user", {
        IM_USERID: localStorage.getItem("user_code"),
      })
      .then((res) => {
        if (res.data.status) {
          store.dispatch({
            type: "CFA_AUTH",
            payload: res.data.data,
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

  useEffect(() => {
    getAuthrights();
  }, []);

  const getMappedCFA = () => {
    props.loading(true);
    http
      .post(apis.COMMON_POST_WITH_FM_NAME, {
        fm_name: "ZRFC_GET_REGHEAD_CFA",
        params: {
          USERID: localStorage.getItem("user_code"),
          IM_FLAG: salesHead.includes(localStorage.getItem("user_code"))
            ? "X"
            : "",
        },
      })
      .then((res) => {
        if (res.data.status) {
          store.dispatch({
            type: "MAPPED_CFA",
            payload: res.data.result.IT_CFA,
          });
        }
      })
      .catch((err) => {
        console.log(err);
        getMappedCFA();
      })
      .finally(() => {
        props.loading(false);
      });
  };

  return (
    <div className="container-fluid">
      <Navbar
        title={activeOption}
        date={now.format("DD MMM YYYY dddd")}
        logout={OverallLogout}
        sidebarToggle={() => {
          setIsOpen(!isOpen);
        }}
      />
      <div className="row">
        <div className="col-sm-3 col-md-2 col-lg-2 col-xl-2">
          <SideBar
            activeOption={activeOption}
            user={props.Auth.userdetails}
            isOpen={isOpen}
          />
        </div>
        <div
          className={
            "col-12 col-sm-9 col-md-10 col-lg-10 col-xl-10" +
            (activeOption === "Dashboard"
              ? " work-section-wo-image"
              : " work-section-wo-image")
          }
        >
          <div className="mask-gradient">
            <Switch>
              <Route path="/dashboard/root">
                <Root />
              </Route>

              {/* <Route path="/dashboard/goods-receipt">
                <GoodReceiptPackage />
              </Route>
              <Route path="/dashboard/sales-order">
                <SalesOrderPackage />
              </Route>
              <Route path="/dashboard/delivery">
                <DeliveryPackage />
              </Route>
              <Route path="/dashboard/diversion">
                <Diversion />
              </Route>
              <Route path="/dashboard/finance">
                <FinancePackage />
              </Route>
              <Route path="/dashboard/reports">
                <ReportPackage />
              </Route>
              <Route path="/dashboard/dealer-requests">
                <DealerRequestList />
              </Route> */}

              <ProtectedRoute
                path="/dashboard/goods-receipt"
                component={GoodReceiptPackage}
                user={props.Auth.userdetails}
                allowedRoles={[1, 2]}
              />

              <ProtectedRoute
                path="/dashboard/sales-order"
                component={SalesOrderPackage}
                user={props.Auth.userdetails}
                allowedRoles={[1, 2]}
              />

              <ProtectedRoute
                path="/dashboard/delivery"
                component={DeliveryPackage}
                user={props.Auth.userdetails}
                allowedRoles={[1, 2]}
              />

              <ProtectedRoute
                path="/dashboard/diversion"
                component={Diversion}
                user={props.Auth.userdetails}
                allowedRoles={[1, 2]}
              />

              <ProtectedRoute
                path="/dashboard/finance"
                component={FinancePackage}
                user={props.Auth.userdetails}
                allowedRoles={[1, 2]}
              />

              <ProtectedRoute
                path="/dashboard/reports"
                component={ReportPackage}
                user={props.Auth.userdetails}
                allowedRoles={[1, 2]}
              />

              <ProtectedRoute
                path="/dashboard/dealer-requests"
                component={DealerRequestList}
                user={props.Auth.userdetails}
                allowedRoles={[1, 2]}
              />


              <Route path="/dashboard/profile">
                <ProfilePackage />
              </Route>

              {/* <Route path="/dashboard/user-admin">
                <UserAdminPackage />
              </Route> */}

              <ProtectedRoute
                path="/dashboard/user-admin"
                component={UserAdminPackage}
                user={props.Auth.userdetails}
                allowedRoles={[1]}
              />

              {/* data management */}
              {/* <Route path="/dashboard/data-management">
                <DataManagement />
              </Route> */}

              <ProtectedRoute
                path="/dashboard/data-management"
                component={DataManagement}
                user={props.Auth.userdetails}
                allowedRoles={[1]}
              />


              <Route path="/dashboard/dealer-sales-order/:id">
                <DealerSOCreate />
              </Route>

              {/* CNF Routes */}
              {/* <Route path="/dashboard/physical-inventory">
                <InventoryPackage />
              </Route>
              <Route path="/dashboard/stock-report">
                <InventoryReportPackage />
              </Route>
              <Route path="/dashboard/damage-data-entry">
                <DamagePackage />
              </Route> */}

              <ProtectedRoute
                path="/dashboard/physical-inventory"
                component={InventoryPackage}
                user={props.Auth.userdetails}
                allowedRoles={[1, 3]}
              />

              <ProtectedRoute
                path="/dashboard/stock-report"
                component={InventoryReportPackage}
                user={props.Auth.userdetails}
                allowedRoles={[1, 3]}
              />

              <ProtectedRoute
                path="/dashboard/damage-data-entry"
                component={DamagePackage}
                user={props.Auth.userdetails}
                allowedRoles={[1, 3, 4, 5, 6, 7, 9]}
              />


            </Switch>
          </div>
        </div>
      </div>
    </div>
  );
}

const mapStateToProps = (state) => ({
  Auth: state.Auth,
});

export default connect(mapStateToProps, {
  setUserDetails,
  logout,
  loading,
  cfaAuth,
})(Wrapper);
