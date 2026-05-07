import axios from "axios";

const BASE = "https://taxvision-backend.onrender.com/api";  // your actual IP here

export const auditApi = {
  getZones:        ()          => axios.get(`${BASE}/audit/zones`),
  getWards:        (zone_no)   => axios.get(`${BASE}/audit/zones/${zone_no}/wards`),
  getLocalities:   (ward_no)   => axios.get(`${BASE}/audit/wards/${ward_no}/localities`),
  getSummary:      (ward_no)   => axios.get(`${BASE}/audit/summary/${ward_no}`),
  getAllBuildings:  (ward_no)   => axios.get(`${BASE}/audit/all/${ward_no}`),
  getFlagged:      (ward_no)   => axios.get(`${BASE}/audit/flagged/${ward_no}`),
  getTaxRisk:      (ward_no)   => axios.get(`${BASE}/risk/${ward_no}`),
  getFraud:        (ward_no)   => axios.get(`${BASE}/fraud/${ward_no}`),
  getGreenReward:  (ward_no)   => axios.get(`${BASE}/green/${ward_no}`),
  getRiskSummary:  (ward_no)   => axios.get(`${BASE}/risk/summary/${ward_no}`),
  getGreenSummary: (ward_no)   => axios.get(`${BASE}/green/summary/${ward_no}`),
  searchByUpin: (upin) => axios.get(`${BASE}/audit/search/${upin}`),
  getTaxBreakdown: (upin, params = {}) => axios.get(
  `${BASE}/audit/tax-breakdown/${upin}`, { params }
),
};