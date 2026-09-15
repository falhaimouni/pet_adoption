import { useCallback, useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { API_BASE_URL } from "../lib/api";

type Status = "operational" | "degraded" | "unavailable" | "unknown" | "checking";

interface SystemStatusPageProps {
  onNavigate: (page: string, params?: Record<string, unknown>) => void;
}

interface ServiceStatus {
  frontend: Status;
  backend: Status;
  database: Status;
}

function statusStyle(status: Status) {
  switch (status) {
    case "operational":
      return {
        text: "Operational",
        icon: "✅",
        classes: "bg-green-50 text-green-700 border-green-200",
      };

    case "degraded":
      return {
        text: "Degraded",
        icon: "⚠️",
        classes: "bg-yellow-50 text-yellow-700 border-yellow-200",
      };

    case "unavailable":
      return {
        text: "Unavailable",
        icon: "❌",
        classes: "bg-red-50 text-red-700 border-red-200",
      };

    case "unknown":
      return {
        text: "Unknown",
        icon: "❔",
        classes: "bg-gray-50 text-gray-600 border-gray-200",
      };

    default:
      return {
        text: "Checking...",
        icon: "⏳",
        classes: "bg-blue-50 text-blue-700 border-blue-200",
      };
  }
}

export default function SystemStatusPage({
  onNavigate,
}: SystemStatusPageProps) {
  const [services, setServices] = useState<ServiceStatus>({
    frontend: "operational",
    backend: "checking",
    database: "checking",
  });

  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [checking, setChecking] = useState(false);

  const checkStatus = useCallback(async () => {
    setChecking(true);

    let backend: Status = "unavailable";
    let database: Status = "unknown";

    try {
      const healthResponse = await fetch(`${API_BASE_URL}/health`);
      const healthData = await healthResponse.json().catch(() => null);

      const backendAlive =
        healthResponse.ok &&
        healthData?.status === "alive";

      if (backendAlive) {
        backend = "operational";

        try {
          const readyResponse = await fetch(`${API_BASE_URL}/ready`);
          const readyData = await readyResponse.json().catch(() => null);

          if (
            readyData?.status === "ready" &&
            readyData?.db?.ok === true
          ) {
            database = "operational";
          } else {
            database = "unavailable";
            backend = "degraded";
          }
        } catch {
          database = "unknown";
          backend = "degraded";
        }
      }
    } catch {
      backend = "unavailable";
      database = "unknown";
    }

    setServices({
      frontend: "operational",
      backend,
      database,
    });

    setLastChecked(new Date());
    setChecking(false);
  }, []);

  useEffect(() => {
    void checkStatus();

    const timer = window.setInterval(() => {
      void checkStatus();
    }, 15000);

    return () => window.clearInterval(timer);
  }, [checkStatus]);

  const serviceRows = [
    {
      name: "Frontend",
      description: "Web interface and Nginx",
      status: services.frontend,
    },
    {
      name: "Backend",
      description: "NestJS application API",
      status: services.backend,
    },
    {
      name: "Database",
      description: "PostgreSQL database",
      status: services.database,
    },
  ];

  const systemOperational =
    services.frontend === "operational" &&
    services.backend === "operational" &&
    services.database === "operational";

  return (<div className="min-h-screen bg-[#f0f8f7]">
      <Navbar activePage="status" onNavigate={onNavigate} />

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            System Status
          </h1>

          <p className="text-gray-600 mt-2">
            Current availability of Petopia services.
          </p>
        </div>

        <div
          className={`rounded-xl border p-5 mb-8 ${
            systemOperational
              ? "bg-green-50 border-green-200"
              : "bg-yellow-50 border-yellow-200"
          }`}
        >
          <h2 className="text-xl font-semibold">
            {systemOperational
              ? "✅ All systems operational"
              : "⚠️ Some services are experiencing problems"}
          </h2>
        </div>

        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          {serviceRows.map((service) => {
            const style = statusStyle(service.status);

            return (
              <div
                key={service.name}
                className="flex items-center justify-between p-5 border-b last:border-b-0"
              >
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {service.name}
                  </h3>

                  <p className="text-sm text-gray-500">
                    {service.description}
                  </p>
                </div>

                <span
                  className={`px-3 py-1 rounded-full border text-sm font-medium ${style.classes}`}
                >
                  {style.icon} {style.text}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <p className="text-sm text-gray-500">
            Last checked:{" "}
            {lastChecked
              ? lastChecked.toLocaleTimeString()
              : "Not checked yet"}
          </p>

          <button
            onClick={() => void checkStatus()}
            disabled={checking}
            className="px-4 py-2 rounded-lg bg-[#089D97] text-white disabled:opacity-50"
          >
            {checking ? "Checking..." : "Check again"}
          </button>
        </div>

        <p className="text-xs text-gray-400 mt-4">
          Status automatically refreshes every 15 seconds.
        </p>
      </main>
    </div>
  );
}