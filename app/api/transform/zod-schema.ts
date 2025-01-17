import { z } from "zod";

export const NodeSchema = z.object({
  id: z.string(),
  type: z.string(),
  data: z.object({
    name: z.string(),
  }),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
});

export const LinkSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  markerEnd: z.object({
    type: z.string(),
    width: z.number(),
    height: z.number(),
    color: z.string(),
  }),
  style: z.object({
    strokeWidth: z.number(),
    stroke: z.string(),
  }),
  animated: z.boolean(),
  label: z.string(),
});

export const GraphStateSchema = z.object({
  nodes: z.array(NodeSchema),
  links: z.array(LinkSchema),
});
