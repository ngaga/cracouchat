# Coding Rules

## GENERAL

### [GEN1] Consistently bad is better than inconsistently good

Favor re-using existing patterns (with broad refactors if necessary) over introducing new ones
sporadically.

Reviewer: If you detect a pattern that is not consistent with an existing approach in the codebase,
require the author to match the existing pattern (and possibly refactor everything in a subsequent
PR).

### [GEN2] Simple but good is better than perfect but complex

Favor simple and easy to understand approaches vs overly optimized but complex ones.

Reviewer: If you detect an overly optimized or complex solution that can be simplified (at the cost
of a bit of performance loss or extra code), ask the author to consider the simpler approach.

### [GEN3] Favor types over typescript enums

We do not use typescript enums, we use types instead, eg: `type Color = "red" | "blue";`.

### [GEN4] Non type-safe use of `as` is prohibited

The non type-safe uses of `as` are prohibited in the codebase. Use typeguards or other type-safe
methods instead. There are few exceptions where `as` is type-safe to use (eg, `as const`) and
therefore acceptable.

### [GEN5] No mutation of function parameters

Never mutate arrays or objects passed as parameters to functions. Create and return new instances
instead. This includes avoiding methods like `splice` that mutate arrays in place.

Reviewer: If you detect parameter mutation in the code (including array methods like `splice`),
request the author to refactor the code to create and return new instances instead.

Example:

```
// BAD
function addItem(items: string[], newItem: string) {
  items.push(newItem);
  return items;
}

// GOOD
function addItem(items: string[], newItem: string) {
  return [...items, newItem];
}
```

### [GEN6] Comments must be sentences and properly wrapped

Comments must be full sentences (generally starting with a capital letter and ending with a period)
and must be consistently wrapped (see examples below).

Example:

```
// BAD
// new function
// does something
// interesting

// GOOD
// This function is new and does something interesting.
// TODO(xxx): improve the efficiency of this.
```

### [GEN7] Avoid loops with quadratic or worse complexity

Loops with quadratic O(n²) or worse cubic O(n³) complexity can severely hurt performance as data
sizes grow. Always prefer linear O(n) or logarithmic O(n log n) solutions using data structures like
Map, Set, or sorted arrays.

### [GEN8] Do not use console.log, console.error, etc. — always use the app logger

Direct calls to `console.log`, `console.error`, `console.warn`, `console.info`, or similar console methods are prohibited in the codebase. Always use the application logger for all logging, debugging, and error reporting purposes.

## REACT

### [REACT1] Always create `interface` for components Props

Components props should always be typed using an `interface`.

Example:

```
// BAD
export function Component({ name }: { name: string }) { }

// GOOD
interface MyComponentProps {
  name: string;
}

export function Component({ name }: MyComponentProps) { }
```

