import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { useNavigate, useParams } from "react-router-dom";
import SiteChrome from "@/components/SiteChrome";
import { apiFetch } from "@/lib/api";

export default function GroupSlugRedirect() {
  const { id: slug } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("authToken");
  const [error, setError] = useState("");
  useEffect(() => {
    const load = async () => {
      try {
        const response = await apiFetch("/api/groups", token ? { headers: { Authorization: `Bearer ${token}` } } : {});
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load group.");
        const groups = Array.isArray(data) ? data : data.groups || [];
        const group = groups.find((item) => item.slug === slug);
        if (!group) throw new Error("Group not found.");
        navigate(`/groups/${group.id}`, { replace: true });
      } catch (requestError) { setError(requestError.message); }
    };
    load();
  }, [navigate, slug, token]);
  return <SiteChrome><Helmet><title>Group | YKCircle</title><meta name="robots" content="noindex" /></Helmet><section className="mx-auto max-w-[56rem] px-5 pb-24 pt-32 text-center sm:px-8 sm:pt-40"><p className="text-muted-foreground">{error || "Opening group…"}</p></section></SiteChrome>;
}
