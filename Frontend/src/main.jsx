import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Routes, Route } from 'react-router-dom';
import './styles.css';
import ResetPasswordPage from './ResetPasswordPage';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

const DASHBOARD_ENDPOINTS = {
  ADMIN: '/dashboard/admin',
  MANAGER: '/dashboard/manager',
};

const DEFAULT_ROLE = 'ADMIN';

function App() {
  const [role, setRole] = useState(getStoredRole);
  const [token, setToken] = useState(
    () => localStorage.getItem('accessToken') ?? '',
  );
  const [dashboard, setDashboard] = useState(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  const endpoint = DASHBOARD_ENDPOINTS[role];
  const canAccessDashboard = Boolean(endpoint);

  useEffect(() => {
    localStorage.setItem('dashboardRole', role);
  }, [role]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('accessToken', token);
    } else {
      localStorage.removeItem('accessToken');
    }
  }, [token]);

  useEffect(() => {
    if (!canAccessDashboard || !token) {
      setDashboard(null);
      setStatus('idle');
      setError('');
      return;
    }

    const controller = new AbortController();

    async function loadDashboard() {
      setStatus('loading');
      setError('');

      try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Dashboard request failed with ${response.status}`);
        }

        setDashboard(await response.json());
        setStatus('success');
      } catch (err) {
        if (err.name === 'AbortError') return;
        setDashboard(null);
        setError(err.message);
        setStatus('error');
      }
    }

    loadDashboard();

    return () => controller.abort();
  }, [canAccessDashboard, endpoint, token]);

  const title = useMemo(
    () => (role === 'ADMIN' ? 'Admin Dashboard' : 'Manager Dashboard'),
    [role],
  );

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Pet Adoption System</p>
          <h1>{title}</h1>
        </div>
        <div className="toolbar">
          <select
            aria-label="Dashboard role"
            value={role}
            onChange={(event) => setRole(event.target.value)}
          >
            <option value="ADMIN">Admin</option>
            <option value="MANAGER">Manager</option>
            <option value="EMPLOYEE">Employee</option>
            <option value="VET">Vet</option>
            <option value="ADOPTER">Adopter</option>
          </select>
          <input
            aria-label="Access token"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            placeholder="Bearer token"
            type="password"
          />
        </div>
      </header>

      {!canAccessDashboard ? (
        <section className="locked-panel">
          <h2>Dashboard access unavailable</h2>
          <p>{role} accounts do not have admin dashboard access.</p>
        </section>
      ) : !token ? (
        <section className="locked-panel">
          <h2>Authentication required</h2>
          <p>Paste a valid access token to load this dashboard.</p>
        </section>
      ) : status === 'loading' ? (
        <section className="locked-panel">
          <h2>Loading dashboard</h2>
          <p>Collecting current operational metrics.</p>
        </section>
      ) : status === 'error' ? (
        <section className="locked-panel error">
          <h2>Unable to load dashboard</h2>
          <p>{error}</p>
        </section>
      ) : dashboard ? (
        <Dashboard role={role} data={dashboard} />
      ) : null}
    </main>
  );
}

function Dashboard({ role, data }) {
  return (
    <div className="dashboard-grid">
      <Section title="Users">
        <MetricGrid
          metrics={[
            ['Total users', data.users?.total],
            ['Admins', data.users?.admin],
            ['Managers', data.users?.manager],
            ['Employees', data.users?.employee],
            ['Vets', data.users?.vet],
            ['Adopters', data.users?.adopter],
            ['Active', data.users?.active],
            ['Inactive', data.users?.inactive],
          ]}
        />
      </Section>

      <Section title="Pets">
        <MetricGrid
          metrics={[
            ['Total pets', data.pets?.total],
            ['Available', data.pets?.available],
            ['Adopted', data.pets?.adopted],
            ['Pending', data.pets?.pendingAdoption],
            ['Added recently', data.pets?.addedRecently],
          ]}
        />
      </Section>

      <Section title="Adoption Requests">
        <MetricGrid
          metrics={[
            ['Total requests', data.adoptions?.totalRequests],
            ['Pending', data.adoptions?.pending],
            ['Approved', data.adoptions?.approved],
            ['Rejected/canceled', data.adoptions?.rejectedOrCanceled],
          ]}
        />
      </Section>

      <Section title="Medical">
        <MetricGrid
          metrics={[
            ['Medical records', data.medical?.totalMedicalRecords],
            ['Vaccinations', data.medical?.totalVaccinations],
            ['Need attention', data.medical?.petsNeedingMedicalAttention],
          ]}
        />
      </Section>

      <Section title="Supplies">
        <MetricGrid
          metrics={[
            ['Total supplies', data.supplies?.totalSupplies],
            ['Available supplies', data.supplies?.availableSupplies],
            ['Low stock', data.supplies?.lowStockSupplies],
            ['Suppliers', data.supplies?.totalSuppliers],
          ]}
        />
      </Section>

      {role === 'ADMIN' && (
        <Section title="Communication">
          <MetricGrid
            metrics={[
              ['Conversations', data.communication?.totalConversations],
              ['Messages', data.communication?.totalMessages],
            ]}
          />
        </Section>
      )}

      <Section title="Recent Pets" wide>
        <SimpleList
          items={data.activity?.recentPetsAdded}
          renderItem={(pet) => (
            <>
              <strong>{pet.petName}</strong>
              <span>{pet.species}</span>
              <span>{pet.adoptionStatus}</span>
            </>
          )}
        />
      </Section>

      <Section title="Recent Requests" wide>
        <SimpleList
          items={data.activity?.recentAdoptionRequests}
          renderItem={(request) => (
            <>
              <strong>{request.pet?.petName ?? request.requestId}</strong>
              <span>{request.status}</span>
              <span>{request.requestDate}</span>
            </>
          )}
        />
      </Section>

      {role === 'ADMIN' && (
        <Section title="Monthly Requests" wide>
          <TrendList items={data.analytics?.monthlyRequestCounts} />
        </Section>
      )}
    </div>
  );
}

function Section({ title, children, wide = false }) {
  return (
    <section className={wide ? 'panel wide' : 'panel'}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function MetricGrid({ metrics }) {
  return (
    <div className="metric-grid">
      {metrics
        .filter(([, value]) => value !== undefined)
        .map(([label, value]) => (
          <div className="metric" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
    </div>
  );
}

function SimpleList({ items = [], renderItem }) {
  if (!items.length) return <p className="empty">No recent data.</p>;

  return (
    <ul className="simple-list">
      {items.map((item, index) => (
        <li key={item.id ?? item.petId ?? item.requestId ?? index}>
          {renderItem(item)}
        </li>
      ))}
    </ul>
  );
}

function TrendList({ items = [] }) {
  if (!items.length) return <p className="empty">No trend data.</p>;

  const max = Math.max(...items.map((item) => item.count), 1);

  return (
    <div className="trend-list">
      {items.map((item) => (
        <div className="trend-row" key={item.month}>
          <span>{item.month}</span>
          <div className="bar-track">
            <div
              className="bar-fill"
              style={{ width: `${(item.count / max) * 100}%` }}
            />
          </div>
          <strong>{item.count}</strong>
        </div>
      ))}
    </div>
  );
}

function getStoredRole() {
  return localStorage.getItem('dashboardRole') ?? DEFAULT_ROLE;
}

createRoot(document.getElementById('root')).render(
  <HashRouter>
    <Routes>
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/" element={<App />} />
      <Route path="*" element={<App />} />
    </Routes>
  </HashRouter>,
);
