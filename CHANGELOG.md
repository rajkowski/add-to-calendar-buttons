# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

- Added for new features.
- Changed for changes in existing functionality.
- Deprecated for soon-to-be removed features.
- Removed for now removed features.
- Fixed for any bug fixes.
- Security in case of vulnerabilities.

## Notes

- Minify JS https://javascript-minifier.com/
- Minify CSS https://cssminifier.com/

## 0.1.1 - 2020-03-11

- Support for events spanning multiple days in iCal/Outlook and Yahoo (unsupported et value)
- Drop-down re-positions itself on-screen if it would have appeared off-screen
- Removed div 'title' which could appear over the drop-down menu
- Updated CSS to allow for button to be used inline with Foundation

## 0.1.0 - 2020-01-24

### Added 

- Outlook.com icon
- Support for line break in iCal download 
- `body` parameter length limiter for Outlook/Office 365 URL compliance
- Click away to close event

### Changed

- Button Labels
- Styling of Button / Dropout
- Replaced icons with larger, newer format

### Removed

- Checkbox approach to the toggle (IE support)

### Fixed

- IE 9+ support