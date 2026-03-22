# Changelog

## [0.1.0-beta.7](https://github.com/mxvsh/livedot/compare/v0.1.0-beta.6...v0.1.0-beta.7) (2026-03-22)

* Setup analytics ([](https://github.com/mxvsh/livedot/commit/d4cae5bcf9732bbc314c2172f1aa3f6d65c10adc))

## [0.1.0-beta.6](https://github.com/mxvsh/livedot/compare/v0.1.0-beta.5...v0.1.0-beta.6) (2026-03-22)

* Fix max user sign up check ([](https://github.com/mxvsh/livedot/commit/549317062a547da3c0a4a674186d6ddbcbd224f6))

## [0.1.0-beta.5](https://github.com/mxvsh/livedot/compare/v0.1.0-beta.4...v0.1.0-beta.5) (2026-03-22)

* Fix duplicate "v" ([](https://github.com/mxvsh/livedot/commit/7762f5c136d9773a08f714acb6569067bcfc6b44))

## [0.1.0-beta.4](https://github.com/mxvsh/livedot/compare/v0.1.0-beta.3...v0.1.0-beta.4) (2026-03-22)

* Fix migration path ([](https://github.com/mxvsh/livedot/commit/5aa2bb0834e263ebd99f603f1955b56049dc3845))
* Optimize docker build ([](https://github.com/mxvsh/livedot/commit/5802f1b4f2b290659d5d567e32b87648d9324e17))

## [0.1.0-beta.3](https://github.com/mxvsh/livedot/compare/v0.1.0-beta.2...v0.1.0-beta.3) (2026-03-22)

* Reset migrations ([](https://github.com/mxvsh/livedot/commit/b666a255ed7512859d88492ded6f37afc1590d16))
* Setup limits and configurations ([](https://github.com/mxvsh/livedot/commit/2d69254f3d3d52f8afe4a0928b4ebc5266dff2aa))

## [0.1.0-beta.2](https://github.com/mxvsh/livedot/compare/v0.1.0-beta.1...v0.1.0-beta.2) (2026-03-22)

* Add conventional-changelog-conventionalcommits ([](https://github.com/mxvsh/livedot/commit/f4f33b9c4e767cf7737d2f36e09cc158e27cb461))
* Migrate to CJS ([](https://github.com/mxvsh/livedot/commit/b460cd9480fd11249359b10865a99d4713f46f95))
* Setup conventional commit ([](https://github.com/mxvsh/livedot/commit/c2343c277091c9bea9b89ce12a04a5cb449a1dfd))
* Fix invalid cred ([](https://github.com/mxvsh/livedot/commit/c9c4f313a84e458494fbdd1e770612833b8068f2))
* Setup GeoDB support ([](https://github.com/mxvsh/livedot/commit/6230abb2e327eec4401e1d7e9139b03d52a0b3fa))
* Setup password reset from profile ([](https://github.com/mxvsh/livedot/commit/009b301823db7e010b02365e3acfa00d60afc615))
* Add error handling to CreateWebsiteModal ([](https://github.com/mxvsh/livedot/commit/b10834d067be1717fd5973c12338bde1f80e23a3))
* Show livedot version ([](https://github.com/mxvsh/livedot/commit/31a04eb205843dca94217cf4128f41d80ea3a2e8))
* Setup OAuth and checks ([](https://github.com/mxvsh/livedot/commit/0e47dd9944fa042f94376c6636c32ab6c44812d5))
* Reduce image size ([](https://github.com/mxvsh/livedot/commit/d74abb5b430511e1f7f42d576f925c8e7f550cf0))
* Add image and features section to README ([](https://github.com/mxvsh/livedot/commit/93f36a64a1398b978ddb536484a20c198cd85a43))
* Setup release-it ([](https://github.com/mxvsh/livedot/commit/c928c7dcb52ef45c2d45316fb69bbb18ad1ed4b3))

## 0.1.0-beta.1

Initial beta release of Livedot — self-hosted, real-time website visitor tracker.

- Real-time visitor tracking with glowing dots on a dark world map
- WebSocket-based live dashboard with animated visitor count
- Website management with create, edit, delete, and tracking snippet
- Auth with Argon2id password hashing and session cookies
- Spam protection: origin validation, rate limiting, bot filtering
- Docker image with Caddy + Bun (multi-arch)
- Drizzle ORM with auto-migrations on startup
