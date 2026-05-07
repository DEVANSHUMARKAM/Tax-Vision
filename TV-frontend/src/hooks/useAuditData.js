import { useState, useCallback } from "react";
import { auditApi } from "../api/auditApi";

export function useAuditData() {
  const [summary,      setSummary]      = useState(null);
  const [allBuildings, setAllBuildings] = useState(null);
  const [riskSummary,  setRiskSummary]  = useState(null);
  const [greenSummary, setGreenSummary] = useState(null);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState(null);

  const loadWardData = useCallback(async (ward_no) => {
    setLoading(true);
    setError(null);
    try {
      const [summary, buildings, riskSum, greenSum] = await Promise.all([
        auditApi.getSummary(ward_no),
        auditApi.getAllBuildings(ward_no),
        auditApi.getRiskSummary(ward_no),
        auditApi.getGreenSummary(ward_no),
      ]);
      setSummary(summary.data);
      setAllBuildings(buildings.data);
      setRiskSummary(riskSum.data);
      setGreenSummary(greenSum.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    summary, allBuildings, riskSummary,
    greenSummary, loading, error, loadWardData
  };
}