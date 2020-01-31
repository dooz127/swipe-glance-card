import { ActionConfig, LovelaceCardConfig } from 'custom-card-helpers';

export interface SwipeGlanceCardConfig extends LovelaceCardConfig {
  entities: SwipeGlanceElementConfig[];
  title?: string;
  show_name?: boolean;
  show_icon?: boolean;
  show_state?: boolean;
  theme?: string;
  columns?: number;
  parameters?: {
    navigation?: { prevEl?: object; nextEl?: object };
    pagination?: { el?: object };
    scrollbar?: { el?: object };
  };
}
export interface SwipeGlanceElementConfig {
  entity: string;
  type?: string;
  name?: string;
  icon?: string;
  image?: string;
  show_last_changed?: boolean;
  show_state?: boolean;
  start_entity?: number;
  tap_action?: ActionConfig;
  hold_action?: ActionConfig;
  double_tap_action?: ActionConfig;
}
