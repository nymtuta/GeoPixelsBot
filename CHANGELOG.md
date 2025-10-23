# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] (todo)
- UI
- use own calls to the backend to not relly on global variables that may change
- multi account support
- multiple pixel ordering strategies
- auto buy locked colors
- auto buy upgrades
- farm mode

## [0.3.2] - 2025-10-23
### Added
- error handling
### Changed
- `ignoredColors` is now a `Set`
### Fixed
- fix the bot not starting when `ignoredColors` was undefined

## [0.3.1] - 2025-10-23
### Added
- Ability to not place specified colors thourgh `ghostBot.ignoreColors()`
### Changed
- if there are less pixels left to place than the mex energy, don't wait until energy is filled but until there's just enough for next batch

## [0.3.0] - 2025-10-23
## Changed
- the settings are now accessible
- the functions and settings are now in an object named `ghostBot`
### Added
- Ability to not place free colors (`ghostBot.placeFreeColors`)
- `ghostBot.reload()` : reloads ghost data

## [0.2.1] - 2025-10-22
### Changed
- stop the bot if logged out and relog fails
- don't wait for next full recharge to stop the bot when all pixels are placed

## [0.2.0] - 2025-10-22
### Changed
- don't "fetch" the whole ghostimage each time we place pixels
### Added
- Automatic relogging

## [0.1.0] - 2025-10-06
### Added
- paint color by color (least frequent first)
- log function
### Changed
- make `stopGhostBot()` actually stop the bot lol
- refactor Color Utils to use a class

## [0.0.1] - 2025-10-04
- make this a userscript

## [0.0.0] - 2025-10-03
- initial release
