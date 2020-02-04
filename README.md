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
title: Swipe Glance Card 1
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
  title: Swipe Glance Card 3
  type: 'custom:swipe-glance-card'
filter:
  template: |
    {{ states|map(attribute='entity_id')|join('\n') }}
type: 'custom:auto-entities'
```

## Author

- [Duy Nguyen](https://www.github.com/dooz127)

## Acknowledgments

This card integrates the excellent [SwiperJS](https://swiperjs.com/) plugin. Future versions of this card will support more of the [API](https://swiperjs.com/api/).
configuration options.

I cribbed a lot of these persons' repositories (especially Bram's [swipe-card plugin](https://github.com/bramkragten/custom-ui/tree/master/swipe-card)) for ideas and best practices:

- [Bram Kragten](https://github.com/bramkragten)
- [Thomas Loven](https://github.com/thomasloven/)
- [Ian T. Rich](https://github.com/iantrich)

## License

This project is licensed under the MIT License - see [LICENSE.md](LICENSE.md) for more information.
