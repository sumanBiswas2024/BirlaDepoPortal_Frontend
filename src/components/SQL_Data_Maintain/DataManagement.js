import React, { useEffect, useState } from "react";
import {
  Route,
  Switch,
  useLocation,
} from "react-router-dom/cjs/react-router-dom.min";
import { decideSubRoute } from "../../services/decideRoute";
import { Link } from "react-router-dom";
import SQLData from "./SQLData";
import { PlantManagement } from "./PlantManagement";
import { MaterialManagement } from "./MaterialMangement";
import CFAManagement from "./CFAManagement";
import { IncotermsManagement } from "./IncotermManagement";
import { GRMaterialManagement } from "./GRMaterialMangement";
import { ValuationTypeManagement } from "./ValuationTypeManagement";  // Date: 15/01/2025 Valuation Type New Tab Requirement

export default function DataManagement() {
  let location = useLocation();

  let [activeOption, setactiveOption] = useState();

  useEffect(() => {
    console.log(location.pathname);
    console.log(decideSubRoute(location.pathname));
    setactiveOption(decideSubRoute(location.pathname));
  }, [location.pathname]);

  return (
    <div>
      <div className="row" style={{ backgroundColor: "#0F6FA2" }}>
        <div className="col-12">
          <div className="tab-div">
            <Link
              className={
                "tab-button" +
                (activeOption === "Shipping Type" ? " tab-active" : "")
              }
              to="/dashboard/data-management/shipping-type"
            >
              Shipping Type
            </Link>
            <Link
              className={
                "tab-button" +
                (activeOption === "Incoterm Management" ? " tab-active" : "")
              }
              to="/dashboard/data-management/incoterm-management"
            >
              Incoterm Management
            </Link>
            {/* // Date: 15/01/2025 Valuation Type New Tab Requirement */}
            <Link
              className={
                "tab-button" +
                (activeOption === "Valuation Type" ? " tab-active" : "")
              }
              to="/dashboard/data-management/valuation-type-management"
            >
              Valuation Type Management
            </Link>
            <Link
              className={
                "tab-button" +
                (activeOption === "GR Material Management" ? " tab-active" : "")
              }
              to="/dashboard/data-management/gr-material-management"
            >
              GR Material Management
            </Link>
            <Link
              className={
                "tab-button" +
                (activeOption === "Plants Management" ? " tab-active" : "")
              }
              to="/dashboard/data-management/plants-management"
            >
              Plants Management
            </Link>
            <Link
              className={
                "tab-button" +
                (activeOption === "Materials Management" ? " tab-active" : "")
              }
              to="/dashboard/data-management/materials-management"
            >
              Materials Management
            </Link>
            <Link
              className={
                "tab-button" +
                (activeOption === "CFA Management" ? " tab-active" : "")
              }
              to="/dashboard/data-management/cfa-management"
            >
              CFA Management
            </Link>
          </div>
        </div>
      </div>
      <Switch>
        <Route path="/dashboard/data-management/shipping-type">
          <SQLData />
        </Route>
        <Route path="/dashboard/data-management/incoterm-management">
          <IncotermsManagement />
        </Route>
        {/* // Date: 15/01/2025 Valuation Type New Tab Requirement */}
        <Route path="/dashboard/data-management/valuation-type-management">
          <ValuationTypeManagement />
        </Route>
        <Route path="/dashboard/data-management/gr-material-management">
          <GRMaterialManagement />
        </Route>
        <Route path="/dashboard/data-management/plants-management">
          <PlantManagement />
        </Route>
        <Route path="/dashboard/data-management/materials-management">
          <MaterialManagement />
        </Route>
        <Route path="/dashboard/data-management/cfa-management">
          <CFAManagement />
        </Route>
      </Switch>
    </div>
  );
}
