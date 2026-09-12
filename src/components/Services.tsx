import { useEffect, useState } from "react";
import { loadTools, type Tool } from "../api";
import { Icon } from "./Icon";

function ToolCard({ tool }: { tool: Tool }) {
  return (
    <article className="service-card">
      <Icon name="layers" />
      <h3>{tool.title}</h3>
      <p>{tool.description}</p>
    </article>
  );
}

export function Services() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function refreshTools() {
    setLoading(true);
    setError("");
    try {
      setTools(await loadTools());
    } catch {
      setError("Could not load tools. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    loadTools()
      .then((items) => {
        if (!cancelled) setTools(items);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load tools. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section id="services" className="section services">
      <div className="container">
        <div className="section-heading">
          <p className="section-label">OUR TOOLS</p>
          <h2>Simple tools for everyday organisation.</h2>
        </div>
        {loading && <p role="status">Loading tools…</p>}
        {error && (
          <div role="alert">
            <p>{error}</p>
            <button className="button" onClick={refreshTools}>
              Try again
            </button>
          </div>
        )}
        {!loading && !error && tools.length === 0 && (
          <p>We’re working on our tools. Check back soon.</p>
        )}
        {!loading && !error && (
          <div className="services-grid">
            {tools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
