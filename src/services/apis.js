const envoirnment = process.env.NODE_ENV;
const apis = {
  BASE_LOCAL_URL: envoirnment === "development" ? "http://localhost:3000" : "",
  // BASE:
  //   envoirnment === "development"
  //     ? "http://3.7.80.231:3000"
  //     : "http://3.7.80.231:3000",
  BASE: "https://dpportal.birlacorp.com",
  // BASE: "https://dpnapi.birlacorp.com",
  LOGIN: "/login/login",
  CREATE_USER: "/login/create",
  UPDATE_USER: "/login/update",
  UPDATE_PWD: "/login/update_pwd",
  ALLUSER: "/login/allUser",
  USER: "/login/user_data",
  FETCH_USER_DETAILS: "/login/auto_auth",
  GET_ORDER_TYPES: "/rfc/get_orders_type_dropdown",
  GET_ORDER_TYPES_FOR_DELIVERY_CREATE:
    "/rfc/get_orders_type_dropdown_for_delivery",
  GET_ORDER_SHIPPING_PLANTS: "/rfc/get_zfm_plants",
  GET_ORDER_SHIPPING_TYPE: "/rfc/get_shipping_type",
  GET_NEW_SHIPPING_TYPE: "/rfc/get-new-shipping-type",
  // GET_ORDER_MATERIAL_OF_PLANT: "/rfc/get_materials_of_plants",
  GET_ORDER_MATERIAL_OF_PLANT: "/rfc-reducer/get-plant-material",
  GET_ORDER_SHIPPING_POINT: "/rfc/get_shipping_point",
  GET_SOLD_TO_PARTY: "/rfc/get_sold_to_party",
  GET_SHIP_TO_PARTY: "/rfc/get_ship_to_party",
  GET_SALES_AREA: "/rfc/get_sales_area",
  GET_INCO_TERM: "/rfc/incoterms",
  GET_TRANS_ZONE: "/rfc/trans_zone",
  GET_SALES_PROMOTER: "/rfc/sales_promoter",
  CREATE_SALES_ORDER: "/rfc/create_sales_order",
  GET_PLANT2_VALUE: "/rfc/common_post_with_fm_name",
  COMMON_POST_WITH_FM_NAME: "/rfc/common_post_with_fm_name",
  COMMON_POST_WITH_TABLE_NAME: "/rfc/common_post_with_table_name",
  SHIPPING_TYPE_MAINTAINED_TABLE: "/rfc/get_shipping_type_from_table",

  GET_ORDER_DETAILS: "/get-order-details",
  GET_STORAGE_LOCATIONS: "/get-storage-location",
  GET_LOADING_POINTS: "/get-loading-points",
  GET_AVAILABLE_STOCK: "/get-available-stock",
  GET_TRANSPORTERS: "/get-transporter",
  GET_DELIVERY_SPECIFIC_SHIPPING_TYPE: "/get-delivery-specific-shipping-type",
  GET_VALUATION_TYPES: "/get-valuation-types",
  CREATE_DELIVERY: "/create-delivery",
  FETCH_DELIVERY: "/delivery-list",
  CREATE_PGI: "/create-pgi",

  GET_DELIVERY_DETAILS: "/get-delivery-details",
  CREATE_INVOICE: "/create-invoice",
  INVOICE_LIST: "/invoice-list",
  PRINT_INVOICE: "/print-invoice",

  SEARCH_CUSTOMER: "/search-customer",
  INITIAL_GOOD_RECEIPT_LIST: "/initial-good-receipt-list",
  FETCH_CONDITION_TYPE: "/fetch-condition-type",
  CONDITION_BASED_STORAGE_LOACTION: "/fetch-condition-based-storage-location",
  CREATE_GOODS_REPORT: "/good-receipt-create",
  FETCH_RECEIVING_PLANT_FOR_GR: "/fetch-receiving-plant-gr-listing",
  FETCH_SHIP_TYPE_FOR_GR: "/fetch-ship-type-gr-listing",
  FETCH_GR_LISTING: "/fetch-good-receipt-list",

  LE_REGISTER_FETCH_COMPANY_CODE: "/leregister-fetch-company-code",
  LE_REGISTER_FETCH_REGION: "/leregister-fetch-region",
  LE_REGISTER_FETCH_DISTRIBUTION_CHANNEL:
    "/leregister-fetch-distribution-channel",
  LE_REGION_FETCH_DIVISION: "/leregister-fetch-division",
  LE_REGISTER_FETCH_LIST: "/leregister-fetch-list",

  REPORT_FETCH_OFFICE: "/report-fetch-sales-office",
  REPORT_FETCH_SALES_GROUP: "/report-fetch-sales-group",
  REPORT_FETCH_SALES_DISTRICT: "/report-fetch-sales-district",
  FETCH_FI_DAYWISE_REPORT: "/fi-daywise-fetch-list",

  FETCH_STOCK_OVERVIEW_REPORT: "/stock-overview-report",

  FETCH_DEBIT_CREDIT_REPORT: "/debit-credit-report-report",

  FETCH_SO_DETAILS: "/fetch-so-details",
  FETCH_ALL_REASON_OF_REJECTION: "/fetch-all-reason-of-rejections",
  UPDATE_SO_DETAILS: "/update-so-details",

  FETCH_D0_DETAILS: "/get-delivery-details-for-edit",

  UPDATE_DELIVERY: "/update-delivery",

  SALES_ORDER_LOGIN_MATRIX_CHECK: "/rfc/sales-order-login-matrix-check",
  DELIVERY_LOGIN_MATRIX_CHECK: "/delivery-login-matrix-check",

  DEALER_REQUEST_LIST: "/login/openapi/get_requests",

  DEALER_REQUEST_DETAILS: "/login/openapi/status_check",

  DEALER_REQUEST_UPDATE: "/login/openapi/update_so_request",

  REQUEST_UPDATE_BY_LOGIN: "/update_so_requests_with_login_id",

  IMAGE_UPLOAD: "/upload",

  GET_IMAGE: "/image",

  app_id: "4dc71a29d661ac06bf3e5b5b725be10c",
  app_secret: "$2a$12$zxBThToaPuXoeXuj6kBYZuENeBZW4Vg9u0yBU7ghyxEnQnVx2CUte",
};

export default apis;
