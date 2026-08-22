# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.0.0]

A major bump: two exported functions were renamed, so 1.0.0 code that imports them
will not compile against this release.

### Changed — BREAKING

- **`createFactory` is now `createPatternFactory`.**
- **`createAdapter` is now `createPatternAdapter`.**

  Both names collided with functions of the same name in sibling packages —
  `@simpill/factories.utils#createFactory` and `@simpill/adapters.utils#createAdapter`.
  A project depending on more than one of them could not import both without aliasing
  at every call site, and the collision made it ambiguous which package a given
  `createFactory` came from.

  Migration is a rename:

  ```diff
  - import { createFactory, createAdapter } from "@simpill/patterns.utils";
  + import { createPatternFactory, createPatternAdapter } from "@simpill/patterns.utils";
  ```

  Signatures and behaviour are unchanged.

### Added

- Twenty further exports across the shared surface since 1.0.0.
