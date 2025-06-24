# glue-runtime

This package is currently undocumented as it's part of a project still early in active development.

### Adding an eventSource

1. Create a folder named after the eventSource type inside of integrations/eventSources
2. Create a runtime.ts file inside
3. Implement the file by exporting some trigger options and exporting a class for the source
4. Update mod.ts to make the types public
5. Update internalTypes.ts to include exported configs
