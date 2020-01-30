import { ActionConfig } from 'custom-card-helpers';

export interface SwipeGlanceCardConfig {
  type: string;
  entities: SwipeGlanceElementConfig[];
  title?: string;
  show_name?: boolean;
  show_icon?: boolean;
  show_state?: boolean;
  theme?: string;
  columns?: number;
}
export interface SwipeGlanceElementConfig {
  entity: string;
  name?: string;
  icon?: string;
  image?: string;
  show_last_changed?: boolean;
  show_state?: boolean;
  tap_action?: ActionConfig;
  hold_action?: ActionConfig;
  double_tap_action?: ActionConfig;
}
