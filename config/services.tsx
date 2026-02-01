import {
  BedDouble,
  Droplets,
  FilterX,
  Home,
  Layers,
  PaintRoller,
  Scale,
  Settings2,
  Shirt,
  Sofa,
  Sparkles,
  Split,
  Trash2,
  Wrench,
  Zap,
} from 'lucide-react';
import React from 'react';

const iconProps = { size: 40, strokeWidth: 1.5, className: 'w-10 h-10' };

export interface Service {
  id: number;
  name: string;
  price: string;
  icon: string;
  duration_hour: string;
  duration_minute: string;
  unit_price: string;
  is_guarantee: boolean;
  service_category: number;
  category: string;
}

export interface ServiceCategory {
  id: number;
  name: string;
}

export const serviceIcons: { [key: string]: React.ReactNode } = {
  Wrench: <Wrench {...iconProps} />,
  Sparkles: <Sparkles {...iconProps} />,
  Settings2: <Settings2 {...iconProps} />,
  Droplets: <Droplets {...iconProps} />,
  Split: <Split {...iconProps} />,
  FilterX: <FilterX {...iconProps} />,
  PaintRoller: <PaintRoller {...iconProps} />,
  Zap: <Zap {...iconProps} />,
  Home: <Home {...iconProps} />,
  Layers: <Layers {...iconProps} />,
  Trash2: <Trash2 {...iconProps} />,
  Scale: <Scale {...iconProps} />,
  BedDouble: <BedDouble {...iconProps} />,
  Sofa: <Sofa {...iconProps} />,
  Shirt: <Shirt {...iconProps} />,
};
