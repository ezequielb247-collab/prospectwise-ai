import assert from "node:assert/strict";
import test from "node:test";
import {MOCK_LEADS} from "../lib/mock-leads";
import {campaignSnapshot,leadTimeline,MOCK_CAMPAIGNS,MOCK_EVENTS,MOCK_MESSAGES} from "../lib/mock-campaigns";

test("every company belongs to an existing campaign",()=>{const campaignIds=new Set(MOCK_CAMPAIGNS.map(campaign=>campaign.id));for(const lead of MOCK_LEADS)assert.ok(campaignIds.has(lead.campaignId),`${lead.id} has no campaign`)});
test("every message belongs to matching company and campaign",()=>{for(const message of MOCK_MESSAGES){const lead=MOCK_LEADS.find(item=>item.id===message.leadId);assert.ok(lead);assert.equal(message.campaignId,lead.campaignId)}});
test("campaign snapshots isolate metrics and related records",()=>{for(const campaign of MOCK_CAMPAIGNS){const snapshot=campaignSnapshot(campaign.id);assert.ok(snapshot);assert.ok(snapshot.leads.every(lead=>lead.campaignId===campaign.id));assert.ok(snapshot.messages.every(message=>message.campaignId===campaign.id));assert.equal(snapshot.metrics.companies,snapshot.leads.length);assert.equal(snapshot.metrics.messages,snapshot.messages.length)}});
test("campaign and company timelines are reverse chronological",()=>{for(const campaign of MOCK_CAMPAIGNS){const events=MOCK_EVENTS.filter(event=>event.campaignId===campaign.id);const snapshot=campaignSnapshot(campaign.id)!;assert.deepEqual(snapshot.events.map(event=>event.id),[...events].sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).map(event=>event.id))}for(const lead of MOCK_LEADS){const timeline=leadTimeline(lead.id);assert.ok(timeline.every(event=>event.leadId===lead.id))}});
