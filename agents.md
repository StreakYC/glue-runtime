### Writing a runtime.ts file for an event source

- as muchg as possible we want our event handlers passed in to be typed with types from the client
  library
- we want type narrowing to work if they are able to register multiple events at the same time
- try to keep the typing as readable and understandable as possible
- too many narrow types is hard to reason about, consider inlining
