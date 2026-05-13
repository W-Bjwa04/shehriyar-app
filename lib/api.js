const API_BASE = '/api';

async function request(url, options = {}) {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw { response: { data, status: res.status } };
  return { data };
}

export const getQuarters = (groupNumber = 1, companyNumber = 1) =>
  request(`/quarters?groupNumber=${groupNumber}&companyNumber=${companyNumber}`);

export const getQuarter = (year, quarter, groupNumber = 1, companyNumber = 1) =>
  request(`/quarters/${year}/${quarter}?groupNumber=${groupNumber}&companyNumber=${companyNumber}`);

export const getLatestQuarter = (groupNumber = 1, companyNumber = 1) =>
  request(`/quarters/latest?groupNumber=${groupNumber}&companyNumber=${companyNumber}`);

export const getDefaults = (groupNumber = 1, companyNumber = 1, numProducts = 3) =>
  request(`/defaults?groupNumber=${groupNumber}&companyNumber=${companyNumber}&numProducts=${numProducts}`);

export const submitDecisions = (data) =>
  request('/submit', { method: 'POST', body: JSON.stringify(data) });

export const deleteQuarter = (year, quarter, groupNumber = 1, companyNumber = 1) =>
  request(`/quarters/${year}/${quarter}?groupNumber=${groupNumber}&companyNumber=${companyNumber}`, { method: 'DELETE' });

export const resetSimulation = (groupNumber = 1, companyNumber = 1) =>
  request(`/reset?groupNumber=${groupNumber}&companyNumber=${companyNumber}`, { method: 'POST' });

export const seedDatabase = () =>
  request('/seed', { method: 'POST' });
