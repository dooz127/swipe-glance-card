# :point_up_2: Swipe Glance Card

Add a :point_up_2:Swipe Glance Card to your [Home Assistant](https://www.home-assistant.io/) set-up. It's mostly an exercise for me to learn development for this platform but hopefully it can useful for you if want glance and swipe on your mobile device.

## Install

Install `swipe-glance-card.js` as a `module`

```yaml
resources:
  - url: /local/swipe-glance-card.js
    type: module
```

For more information, see Thomas Loven's [Lovelace-Plugins](https://github.com/thomasloven/hass-config/wiki/Lovelace-Plugins) guide.

## Swipe Glance Card Configuration

The :point_up_2:Swipe Glance Card has the same configuration variables as the default [Lovelace Glance Card](https://www.home-assistant.io/lovelace/glance/#configuration-variables).

### Options for Entities

Entities have the same options as the default [Lovelace Glance Card](https://www.home-assistant.io/lovelace/glance/#options-for-entities). For different styling options, I highly recommend Thomas Loven's [card-mod plug-in](https://github.com/thomasloven/lovelace-card-mod).

### Options for Swiper

This card integrates the excellent [SwiperJS](https://swiperjs.com/) plugin. You can see the [API](https://swiperjs.com/api/) for additional configuration options.

## Author

- [Duy Nguyen](https://www.github.com/dooz127)

## Acknowledgments

I cribbed a lot of these persons' repositories for ideas and best practices:
- [Bram Kragten](https://github.com/bramkragten)
- [Thomas Loven](https://github.com/thomasloven/)
- [Ian T. Rich](https://github.com/iantrich)

## License

This project is licensed under the MIT License - see [LICENSE.md](LICENSE.md) for more information.
