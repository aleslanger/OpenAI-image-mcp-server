export interface ModelCaps {
  id: string;
  sizePresets: string[];
  allowsCustomSize: boolean;
  qualities: ("low" | "medium" | "high" | "auto")[];
  maxN: number;
  supportsBackground: boolean;
  supportsTransparent: boolean;
  supportsInputFidelity: boolean;
  supportsStreaming: boolean;
  flag?: "deprecated" | "removed";
}

const PRESETS = ["auto", "1024x1024", "1024x1536", "1536x1024"];

export const MODELS: Record<string, ModelCaps> = {
  "gpt-image-1": {
    id: "gpt-image-1", sizePresets: PRESETS, allowsCustomSize: false,
    qualities: ["low", "medium", "high", "auto"], maxN: 10,
    supportsBackground: true, supportsTransparent: true,
    supportsInputFidelity: true, supportsStreaming: true, flag: "deprecated",
  },
  "gpt-image-1-mini": {
    id: "gpt-image-1-mini", sizePresets: PRESETS, allowsCustomSize: false,
    qualities: ["low", "medium", "high", "auto"], maxN: 10,
    supportsBackground: true, supportsTransparent: true,
    supportsInputFidelity: true, supportsStreaming: true,
  },
  "gpt-image-2": {
    id: "gpt-image-2", sizePresets: PRESETS, allowsCustomSize: true,
    qualities: ["low", "medium", "high", "auto"], maxN: 10,
    supportsBackground: true, supportsTransparent: false,
    supportsInputFidelity: false, supportsStreaming: true,
  },
};

export function getModel(id: string): ModelCaps {
  const m = MODELS[id];
  if (!m) throw new Error(`unknown model: ${id}`);
  if (m.flag === "removed") throw new Error(`model removed from API: ${id}`);
  return m;
}
