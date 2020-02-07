import { ActionConfig, HomeAssistant, LovelaceCardConfig } from 'custom-card-helpers';

export interface SwipeGlanceCardConfig extends LovelaceCardConfig {
  columns?: number;
  entities: SwipeGlanceElementConfig[];
  show_icon?: boolean;
  show_name?: boolean;
  show_state?: boolean;
  swiper_parameters?: SwiperParametersConfig;
  theme?: string;
  title?: string;
}
export interface SwipeGlanceElementConfig extends LovelaceElementConfig {
  double_tap_action?: ActionConfig;
  entity: string;
  hold_action?: ActionConfig;
  icon?: string;
  image?: string;
  name?: string;
  show_last_changed?: boolean;
  show_state?: boolean;
  start_entity?: number;
  tap_action?: ActionConfig;
}
export interface SwiperParametersConfig extends LovelaceElementConfig {
  freeModeSticky?: boolean;
  navigation?: { prevEl?: object; nextEl?: object };
  pagination?: { el?: object };
  scrollbar?: { el?: object };
  setWrapperSize?: boolean;
  slidesPerView?: number;
  watchOverflow?: boolean;
}
// TODO: add LovelaceElement to custom-card-helpers
export interface LovelaceElement extends HTMLElement {
  hass?: HomeAssistant;
  setConfig(config: LovelaceElementConfig): void;
}
// TODO: add LovelaceElement to custom-card-helpers
export interface LovelaceElementConfig {
  type?: string;
  style?: object;
}
