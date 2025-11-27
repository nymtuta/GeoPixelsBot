# GeoPixelsBot
A bot for automatic ghost placement on the website https://geopixels.net

## installation
1. install [Violentmonkey](https://violentmonkey.github.io/) ([![Firefox Addons](https://www.readmecodegen.com/api/social-icon?name=firefoxbrowser&size=16)](https://addons.mozilla.org/en-US/firefox/addon/violentmonkey/)/[![Chrome webstore](https://www.readmecodegen.com/api/social-icon?name=chromewebstore&size=16)](https://chromewebstore.google.com/detail/jinjaccalgkegednnccohejagnlnfdag)) or [Tampermonkey](https://www.tampermonkey.net/) ([![Firefox Addons](https://www.readmecodegen.com/api/social-icon?name=firefoxbrowser&size=16)](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)/[![Chrome webstore](https://www.readmecodegen.com/api/social-icon?name=chromewebstore&size=16)](https://chromewebstore.google.com/detail/dhdgffkkebhmkfjojejmpbldmpobfkfo))
2. [click here](https://github.com/nymtuta/GeoPixelsBot/raw/refs/heads/main/ghostBot.user.js)

## Usage
- Commands: 
  - `ghostBot.start()` : start the bot
  - `ghostBot.stop()` : stop the bot
  - `ghostBot.reload()` : reloads ghost data (needed after any configuration change or after buying a new color)
  - `ghostBot.ignoreColors()` : add colors to the ignored list (input can be an array or a string with colors separated by `,` or by the second argument specified)
- Settings *(has to be set after each page reload)*: 
  - `ghostBot.placeTransparentGhostPixels` *`[boolean]`* : place transparent pixels *(default: false)*
  - `ghostBot.placeFreeColors` *`[boolean]`* : place free colors *(default: true)*

## Upcoming changes
See [CHANGELOG.md#unreleased-todo](CHANGELOG.md#unreleased-todo)

## Change log
See [CHANGELOG.md](CHANGELOG.md)

## License
This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE.md) file for details.