import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import SiteChrome from "@/components/SiteChrome";
import { apiFetch } from "@/lib/api";

export default function GroupInvitationPage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  const action = searchParams.get("action");
  const [state, setState] = useState({ loading: true, error: "", status: "", group: null });

  useEffect(() => {
    if (!token || !["accept", "decline"].includes(action)) {
      setState({ loading: false, error: "This group invitation link is invalid.", status: "", group: null });
      return;
    }
    apiFetch("/api/group-invitations/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, action }),
    }).then(async (response) => {
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 409 && data.code === "ACCOUNT_REQUIRED") {
          navigate(`/register?from=${encodeURIComponent(`${location.pathname}${location.search}`)}`, { replace: true });
          return;
        }
        if (response.status === 403 && data.code === "EMAIL_NOT_VERIFIED") {
          navigate(`/verify-email?from=${encodeURIComponent(`${location.pathname}${location.search}`)}`, { replace: true });
          return;
        }
        throw new Error(data.error || "Unable to process this invitation.");
      }
      setState({ loading: false, error: "", status: data.status || (action === "accept" ? "accepted" : "declined"), group: data.group || data });
    }).catch((error) => setState({ loading: false, error: error.message, status: "", group: null }));
  }, [action, location.pathname, location.search, navigate, token]);

  const groupName = state.group?.name || "the group";
  const groupId = state.group?.id || state.group?.groupId;
  return <SiteChrome><Helmet><title>Group invitation | YKCircle</title></Helmet><section className="mx-auto max-w-[38rem] px-5 pb-24 pt-32 text-center sm:px-8 sm:pt-40"><p className="text-[0.7rem] uppercase tracking-[0.35em] text-primary">Group invitation</p>{state.loading && <h1 className="mt-4 font-display text-5xl font-black">Processing invitation…</h1>}{state.error && <><h1 className="mt-4 font-display text-5xl font-black">Invitation unavailable.</h1><p role="alert" className="mt-6 text-destructive">{state.error}</p></>}{!state.loading && !state.error && <><h1 className="mt-4 font-display text-5xl font-black">{state.status.toLowerCase() === "accepted" ? "You’re in." : "Invitation declined."}</h1><p className="mt-6 leading-relaxed text-muted-foreground">{state.status.toLowerCase() === "accepted" ? `You have joined ${groupName}.` : `You declined the invitation to ${groupName}.`}</p><Link to={groupId ? `/groups/${groupId}` : "/groups"} className="mt-8 inline-flex min-h-12 items-center bg-primary px-7 text-sm text-primary-foreground">{state.status.toLowerCase() === "accepted" ? "View group" : "Browse groups"}</Link></>}</section></SiteChrome>;
}
