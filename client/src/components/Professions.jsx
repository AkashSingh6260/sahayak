import React from "react";
import { Brush, Droplet, Hammer, Snowflake, ZapIcon } from "lucide-react";

export const professions = [
  {
    id: "electrician",
    label: "Electrician",
    icon: ZapIcon  ,
    description: "Wiring, repairs, electrical installations",
  },
  {
    id: "plumber",
    label: "Plumber",
    icon: Droplet ,
    description: "Pipes, fittings, leak repairs",
  },
  {
    id: "carpenter",
    label: "Carpenter",
    icon: Hammer ,
    description: "Furniture, woodwork, repairs",
  },
  {
    id: "ac_technician",
    label: "AC Technician",
    icon: Snowflake ,
    description: "AC installation and servicing",
  },
  {
    id: "painter",
    label: "Painter",
    icon: Brush ,
    description: "Interior & exterior painting",
  },
];
