import { AlertCircle, CheckCircle2, Circle, ExternalLink, History, Rocket } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getProject } from "../../../../lib/api";
import { useProjectDeployments } from "../../../../hooks/useProjectDeployments";
import type { DeploymentStatusResponse, DeploymentStreamEvent, Project } from "../../../../lib/types";
import DeploymentStatusBadge from "./DeploymentStatusBadge";

const steps = [["QUEUED","Queued"],["BUILDING","Building"],["BUILD_SUCCEEDED","Build succeeded"],["ORCHESTRATING","Deploying"],["DEPLOYED","Deployed"],["RUNNING","Running"]] as const;
const rank = (status?: string | null) => status === "BUILD_RETRYING" ? 1 : status === "DEPLOY_RETRYING" ? 3 : steps.findIndex(([value]) => value === status);
const formatTimestamp = (value?: string | null) => value ? new Date(value).toLocaleString(undefined,{timeZone:"Africa/Harare"}) : "Waiting";

function DeploymentDetail({deployment,timeline}:{deployment:DeploymentStatusResponse;timeline:DeploymentStreamEvent[]}) {
  const failed=deployment.status?.includes("FAILED"); const currentRank=rank(deployment.status);
  const ingressHost=typeof deployment.metadata.ingressHost === "string" ? deployment.metadata.ingressHost : null;
  const tls=deployment.metadata.tlsEnabled === true;
  const error=typeof deployment.metadata.errorMessage === "string" ? deployment.metadata.errorMessage : typeof deployment.metadata.message === "string" ? deployment.metadata.message : null;
  return <section className="app-card space-y-5">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-semibold">{deployment.serviceName||"Deployment"}</h2><p className="app-muted mt-1 break-all font-mono text-xs">{deployment.deploymentId}</p></div><DeploymentStatusBadge status={deployment.status}/></div>
    <ol className="grid gap-2 sm:grid-cols-3 xl:grid-cols-6">{steps.map(([value,label],index)=>{const complete=!failed&&index<=currentRank;const Icon=complete?CheckCircle2:Circle;return <li key={value} className={`rounded-xl border p-3 text-xs font-semibold ${complete?"border-emerald-500/30 text-emerald-600":"border-[var(--app-border)] app-muted"}`}><Icon size={16} className="mb-2"/>{label}</li>;})}</ol>
    {failed&&error?<div className="app-danger-panel text-sm">{error}</div>:null}
    {deployment.status==="RUNNING"&&ingressHost?<a className="app-button-primary w-fit" href={`${tls?"https":"http"}://${ingressHost}`} target="_blank" rel="noreferrer">Open application <ExternalLink size={15}/></a>:null}
    <div><h3 className="font-semibold">Timeline</h3><ol className="mt-3 space-y-3">{timeline.length?timeline.map(event=><li key={event.id} className="border-l-2 border-[var(--app-border)] pl-4"><div className="flex flex-wrap justify-between gap-2"><span className="text-sm font-medium">{event.message}</span><time className="app-muted text-xs">{formatTimestamp(event.timestamp)}</time></div><p className="app-muted mt-1 text-xs">{event.stage} · {event.status}</p></li>):<li className="app-muted text-sm">The current snapshot is available; earlier events will appear as they are replayed.</li>}</ol></div>
  </section>;
}

export default function Deployments(){
  const [params]=useSearchParams(); const projectId=params.get("projectId")?.trim();
  const [project,setProject]=useState<Project|null>(null); const [selected,setSelected]=useState<string|null>(null);
  const live=useProjectDeployments(projectId);
  useEffect(()=>{if(projectId)void getProject(projectId).then(setProject).catch(()=>setProject(null));},[projectId]);
  const current=useMemo(()=>live.deployments.find(item=>item.deploymentId===selected)||live.deployments[0],[live.deployments,selected]);
  if(!projectId)return <div className="app-empty-state min-h-[24rem]"><div className="app-empty-state-card"><History size={32}/><h1 className="text-2xl font-semibold">Choose a project</h1><Link className="app-button-primary mt-5" to="/dashboard/projects">View projects</Link></div></div>;
  if(live.isLoading)return <div className="app-loading-state">Loading deployments...</div>;
  if(live.error&&!live.deployments.length)return <div className="app-danger-panel flex gap-3"><AlertCircle size={20}/>{live.error}</div>;
  return <div className="space-y-5"><header className="flex items-center gap-3"><Rocket size={26}/><div><h1 className="app-page-title">Deployments{project?` for ${project.name}`:""}</h1><p className="app-page-subtitle">Live build and rollout activity.</p></div></header>
    {!live.deployments.length?<div className="app-empty-state min-h-[20rem]"><div className="app-empty-state-card"><History size={32}/><h2 className="text-2xl font-semibold">No deployments yet</h2></div></div>:
    <div className="grid gap-5 lg:grid-cols-[20rem_1fr]"><aside className="space-y-2">{live.deployments.map(item=><button key={item.deploymentId} type="button" onClick={()=>setSelected(item.deploymentId)} className={`app-card w-full text-left ${current?.deploymentId===item.deploymentId?"border-[var(--app-accent)]":""}`}><div className="flex justify-between gap-2"><span className="truncate font-semibold">{item.serviceName||"Deployment"}</span><DeploymentStatusBadge status={item.status}/></div><p className="app-muted mt-2 text-xs">{formatTimestamp(item.timestamp)}</p></button>)}</aside>{current?<DeploymentDetail deployment={current} timeline={live.timelines[current.deploymentId]||[]}/>:null}</div>}
  </div>;
}
