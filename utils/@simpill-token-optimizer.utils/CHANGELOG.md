# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.0.0]

A major bump: fourteen constants that 1.0.0 exported are gone.

### Removed — BREAKING

- **`VALUE_0`, `VALUE_1`, `VALUE_2`, `VALUE_3`, `VALUE_4`, `VALUE_5`, `VALUE_6`,
  `VALUE_16`, `VALUE_20`, `VALUE_30`, `VALUE_42`, `VALUE_60`, `VALUE_80`, `VALUE_999`.**

  These were numeric aliases — `VALUE_42 = 42` — that existed to route magic numbers
  past a lint rule rather than to name anything. They were removed across the monorepo
  as dead weight; in this package, unlike the others, `shared/index.ts` re-exported
  `./constants`, so they were reachable from the package entry point and from
  `@simpill/token-optimizer.utils/shared`. That makes their removal breaking here even
  though it was not elsewhere.

  Migration is to use the literal:

  ```diff
  - import { VALUE_42 } from "@simpill/token-optimizer.utils";
  - const limit = VALUE_42;
  + const limit = 42;
  ```

  No behaviour depended on them.
