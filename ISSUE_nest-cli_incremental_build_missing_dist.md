## Summary

`nest build` can exit successfully without recreating `dist/` when TypeScript incremental build metadata (`tsconfig.build.tsbuildinfo`) is still present but the output directory was deleted manually.

That leaves the project in a broken state where:

- `nest build` returns exit code `0`
- `dist/main.js` is still missing
- `nest start` fails with `Cannot find module '<project>/dist/main'`

This looks like an interaction between `nest build` and TypeScript incremental compilation state.

## Environment

- `@nestjs/cli`: `11.0.23`
- `@nestjs/core`: `11.1.27`
- `@nestjs/common`: `11.1.27`
- `@nestjs/platform-express`: `11.1.27`
- `typescript`: `5.9.3`
- `ts-loader`: `9.6.2`
- `node`: `v25.8.2`
- `npm`: `11.11.1`
- OS: macOS

## Reproduction

Using a standard Nest app with incremental compilation enabled in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "outDir": "./dist",
    "incremental": true
  }
}
```

`tsconfig.build.json`:

```json
{
  "extends": "./tsconfig.json",
  "exclude": ["node_modules", "test", "dist", "**/*spec.ts"]
}
```

Steps:

1. Run `nest build`
2. Confirm `dist/` exists
3. Delete only `dist/`, keeping `tsconfig.build.tsbuildinfo`
4. Run `nest build` again

## Expected behavior

`nest build` should recreate the missing `dist/` output, or fail explicitly if incremental state says the project is up to date while emitted files are missing.

## Actual behavior

`nest build` exits successfully, but only updates `tsconfig.build.tsbuildinfo`. No JS output is emitted into `dist/`.

After that:

```bash
nest start
```

fails with:

```text
Error: Cannot find module '/path/to/project/dist/main'
```

## Observed result in this project

After deleting `dist/` and keeping the build info file:

- `nest build` exited with code `0`
- `dist/` was still absent
- direct `tsc -p tsconfig.build.json --listEmittedFiles` only reported:

```text
TSFILE: /path/to/project/tsconfig.build.tsbuildinfo
```

## Workaround

Cleaning the incremental metadata before building avoids the issue:

```bash
rm -rf dist tsconfig.build.tsbuildinfo
nest build
```

In this project I had to change the build script to:

```json
"build": "rm -rf dist tsconfig.build.tsbuildinfo && nest build"
```

and the start script to:

```json
"start": "npm run build && node dist/main.js"
```

## Notes

I am not sure whether this should be fixed in Nest CLI itself, or if the CLI should detect this condition and surface a clearer error because TypeScript incremental state can incorrectly imply that emitted output still exists.
