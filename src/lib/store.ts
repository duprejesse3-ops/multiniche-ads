import { create } from "zustand";
import { persist } from "zustand/middleware";
import { loadDesk, pumpVisitorsFn, saveCampaignFn } from "./desk";
import type {
  AdCreative,
  AuctionEvent,
  Campaign,
  CampaignStatus,
  DeskBrief,
  LibraryItem,
  OpenSite,
} from "./types";

type ServePatch = {
  event: AuctionEvent;
  campaign: Campaign | null;
};

type DeskState = {
  campaigns: Campaign[];
  library: LibraryItem[];
  brief: DeskBrief | null;
  tape: AuctionEvent[];
  sites: OpenSite[];
  exchangeOpen: boolean;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  upsertCampaign: (c: Campaign) => void;
  setStatus: (id: string, status: CampaignStatus) => void;
  setBid: (id: string, cpcBid: number) => void;
  attachCreative: (campaignId: string, creative: AdCreative) => void;
  setCreativeImage: (campaignId: string, creativeId: string, imageUrl: string) => void;
  addAudiences: (campaignId: string, audiences: Campaign["audiences"]) => void;
  saveToLibrary: (item: LibraryItem) => void;
  setBrief: (brief: DeskBrief) => void;
  setExchangeOpen: (open: boolean) => void;
  applyServe: (patch: ServePatch) => void;
  pump: (n: number) => Promise<void>;
};

const TAPE_CAP = 140;

function bumpTape(tape: AuctionEvent[], event: AuctionEvent) {
  return [event, ...tape.filter((e) => e.id !== event.id)].slice(0, TAPE_CAP);
}

function persistCampaign(get: () => DeskState, id: string) {
  const c = get().campaigns.find((x) => x.id === id);
  if (c) void saveCampaignFn({ data: c });
}

export const useDesk = create<DeskState>()(
  persist(
    (set, get) => ({
      campaigns: [],
      library: [],
      brief: null,
      tape: [],
      sites: [],
      exchangeOpen: false,
      hydrated: false,
      hydrate: async () => {
        const book = await loadDesk();
        set({
          campaigns: book.campaigns,
          tape: book.tape,
          sites: book.sites,
          hydrated: true,
        });
      },
      upsertCampaign: (c) => {
        set((s) => {
          const i = s.campaigns.findIndex((x) => x.id === c.id);
          if (i === -1) return { campaigns: [c, ...s.campaigns] };
          const next = s.campaigns.slice();
          next[i] = c;
          return { campaigns: next };
        });
        void saveCampaignFn({ data: c });
      },
      setStatus: (id, status) => {
        set((s) => ({
          campaigns: s.campaigns.map((c) => (c.id === id ? { ...c, status } : c)),
        }));
        persistCampaign(get, id);
      },
      setBid: (id, cpcBid) => {
        set((s) => ({
          campaigns: s.campaigns.map((c) =>
            c.id === id ? { ...c, cpcBid: Math.round(Math.max(0.05, cpcBid) * 100) / 100 } : c,
          ),
        }));
        persistCampaign(get, id);
      },
      attachCreative: (campaignId, creative) => {
        set((s) => ({
          campaigns: s.campaigns.map((c) =>
            c.id === campaignId
              ? { ...c, creatives: [creative, ...c.creatives.filter((x) => x.id !== creative.id)] }
              : c,
          ),
        }));
        persistCampaign(get, campaignId);
      },
      setCreativeImage: (campaignId, creativeId, imageUrl) => {
        set((s) => ({
          campaigns: s.campaigns.map((c) =>
            c.id === campaignId
              ? {
                  ...c,
                  creatives: c.creatives.map((cr) =>
                    cr.id === creativeId ? { ...cr, imageUrl } : cr,
                  ),
                }
              : c,
          ),
        }));
        persistCampaign(get, campaignId);
      },
      addAudiences: (campaignId, audiences) => {
        set((s) => ({
          campaigns: s.campaigns.map((c) =>
            c.id === campaignId
              ? {
                  ...c,
                  audiences: [
                    ...audiences.filter((a) => !c.audiences.some((x) => x.name === a.name)),
                    ...c.audiences,
                  ],
                }
              : c,
          ),
        }));
        persistCampaign(get, campaignId);
      },
      saveToLibrary: (item) =>
        set((s) => ({
          library: [item, ...s.library.filter((x) => x.id !== item.id)].slice(0, 40),
        })),
      setBrief: (brief) => set({ brief }),
      setExchangeOpen: (open) => set({ exchangeOpen: open }),
      applyServe: ({ event, campaign }) =>
        set((s) => ({
          tape: bumpTape(s.tape, event),
          campaigns: campaign
            ? s.campaigns.map((c) => (c.id === campaign.id ? campaign : c))
            : s.campaigns,
        })),
      pump: async (n) => {
        const origin = typeof window !== "undefined" ? window.location.origin : "http://127.0.0.1:8080";
        const book = await pumpVisitorsFn({ data: { n, origin } });
        set({ campaigns: book.campaigns, tape: book.tape, sites: book.sites, hydrated: true });
      },
    }),
    {
      name: "multiniche-ads-v2",
      partialize: (s) => ({
        exchangeOpen: s.exchangeOpen,
        library: s.library,
        brief: s.brief,
      }),
    },
  ),
);
