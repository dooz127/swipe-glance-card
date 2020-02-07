# :point_up_2: Swipe Glance Card

Add a :point_up_2:Swipe Glance Card to your [Home Assistant](https://www.home-assistant.io/) set-up. It may be useful for you if want glance and swipe on your mobile device.

## Install

Install `swipe-glance-card.js` as a `module`

```yaml
resources:
  - url: /local/swipe-glance-card.js
    type: module
```

For more information, see Thomas Loven's [Lovelace-Plugins](https://github.com/thomasloven/hass-config/wiki/Lovelace-Plugins) guide.

## Swipe Glance Card Configuration

The :point_up_2:Swipe Glance Card has the same configuration variables as the default [Lovelace Glance Card](https://www.home-assistant.io/lovelace/glance#configuration-variables). I highly recommend using Thomas Loven's [auto-entities plugin](https://github.com/thomasloven/lovelace-auto-entities) to auto-populate and sort the entities and his [card-mod plug-in](https://github.com/thomasloven/lovelace-card-mod) for styling (not all styling options are supported at this time).

### Example simple configuration

```yaml
entities:
  - entity: sun.sun
  - entity: sun.sun
  - entity: sun.sun
  - entity: sun.sun
  - entity: sun.sun
  - entity: sun.sun
title: Vanilla Swipe Glance Card
type: 'custom:swipe-glance-card'
```

### Example configuration with card-mod plugin, no title, no state

```yaml
entities:
  - entity: sun.sun
  - entity: sun.sun
  - entity: sun.sun
  - entity: sun.sun
  - entity: sun.sun
  - entity: sun.sun
style: |
  ha-card {
    font-variant: small-caps;
  }
  .card-header {
    font-size: 16px;
  }
show_state: false
type: 'custom:swipe-glance-card'
```

### Example configuration with auto-entities plugin

```yaml
card:
  title: Swipe Glance Card with Auto-Entities
  type: 'custom:swipe-glance-card'
filter:
  template: |
    {{ states|map(attribute='entity_id')|join('\n') }}
type: 'custom:auto-entities'
```

### Example configuration to toggle on a hold action

```yaml
card:
  show_state: false
  title: Lights
  type: 'custom:swipe-glance-card'
filter:
  include:
    - domain: light
      options:
        hold_action:
          action: toggle
type: 'custom:auto-entities'
```

### Example configuration with navigation arrows

```yaml
card:
  swiper_parameters:
    navigation:
      nextEl: '.swiper-button-next'
      prevEl: '.swiper-button-prev'
  title: Swipe Glance Card with Navigation
  type: 'custom:swipe-glance-card'
filter:
  template: |
    {{ states|map(attribute='entity_id')|join('\n') }}
type: 'custom:auto-entities'
```

### Example configuration with pagination bullets

```yaml
card:
  swiper_parameters:
    pagination:
      el: '.swiper-pagination'
  title: Swipe Glance Card with Pagination
  type: 'custom:swipe-glance-card'
filter:
  include:
    - domain: binary_sensor
    - domain: climate
    - domain: cover
sort:
  method: name
type: 'custom:auto-entities'
```

### Example configuration with progression bar

```yaml
card:
  swiper_parameters:
    scrollbar:
      el: '.swiper-scrollbar'
      dynamicBullets: true
  title: Swipe Glance Card with Scrollbar
  type: 'custom:swipe-glance-card'
filter:
  include:
    - domain: binary_sensor
    - domain: climate
    - domain: cover
sort:
  method: name
type: 'custom:auto-entities'
```

## Known Issues

- Breaks lovelace edit mode.
- Does not currently support card-mod ShadowDom styling (i.e., :host styles).

## Author

- [Duy Nguyen](https://www.github.com/dooz127)

## Acknowledgments

This card integrates the excellent [SwiperJS](https://swiperjs.com/) plugin, and supports many of the options of the [API](https://swiperjs.com/api/).

I cribbed a lot of these persons' repositories (especially Bram's [swipe-card plugin](https://github.com/bramkragten/custom-ui/tree/master/swipe-card)) for ideas and best practices:

- [Bram Kragten](https://github.com/bramkragten)
- [Thomas Loven](https://github.com/thomasloven/)
- [Ian T. Rich](https://github.com/iantrich)

## License

This project is licensed under the MIT License - see [LICENSE.md](LICENSE.md) for more information.
