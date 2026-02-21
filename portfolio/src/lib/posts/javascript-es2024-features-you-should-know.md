---
title: "JavaScript ES2024 Features You Should Know"
slug: "javascript-es2024-features-you-should-know"
description: "Explore the most impactful ES2024 features including Array grouping, Promise.withResolvers, well-formed Unicode strings, and the RegExp v flag with practical examples."
publishDate: "2025-03-15"
author: "Umesh Malik"
category: "JavaScript"
tags: ["JavaScript", "ES2024", "ECMAScript", "Frontend"]
keywords: "ES2024 features, JavaScript 2024, Array grouping, Promise.withResolvers, RegExp v flag, modern JavaScript, ECMAScript 2024"
image: "/blog/javascript-es2024-cover.svg"
imageAlt: "JavaScript ES2024 features overview showing Object.groupBy, Promise.withResolvers, Unicode strings, and RegExp v flag"
featured: true
published: true
readingTime: "10 min read"
---

JavaScript keeps evolving, and ES2024 (ECMAScript 2024) brings several features that solve real problems I encounter in day-to-day frontend development. Here's a practical look at the ones worth adopting now.

## Object.groupBy and Map.groupBy

Grouping arrays by a property has been a common utility function in every project I've worked on. ES2024 makes it native.

### Object.groupBy

```javascript
const products = [
  { name: 'Laptop', category: 'electronics', price: 999 },
  { name: 'Shirt', category: 'clothing', price: 29 },
  { name: 'Phone', category: 'electronics', price: 699 },
  { name: 'Jeans', category: 'clothing', price: 59 },
  { name: 'Tablet', category: 'electronics', price: 449 },
];

const grouped = Object.groupBy(products, (product) => product.category);

// Result:
// {
//   electronics: [{ name: 'Laptop', ... }, { name: 'Phone', ... }, { name: 'Tablet', ... }],
//   clothing: [{ name: 'Shirt', ... }, { name: 'Jeans', ... }]
// }
```

This replaces the `reduce` boilerplate we've all written dozens of times. At Expedia, we had a utility called `groupBy` that did exactly this — now it's built in.

### Map.groupBy

When you need non-string keys, use `Map.groupBy`:

```javascript
const grouped = Map.groupBy(products, (product) =>
  product.price > 500 ? 'premium' : 'budget'
);

grouped.get('premium'); // [Laptop, Phone]
grouped.get('budget');  // [Shirt, Jeans, Tablet]
```

## Promise.withResolvers

This is one of those features that eliminates an awkward pattern. Previously, to get external access to `resolve` and `reject`, you had to do this:

```javascript
// Before ES2024
let resolve, reject;
const promise = new Promise((res, rej) => {
  resolve = res;
  reject = rej;
});
```

Now it's clean:

```javascript
// ES2024
const { promise, resolve, reject } = Promise.withResolvers();

// Use it in event-driven code
button.addEventListener('click', () => resolve('clicked'), { once: true });
const result = await promise;
```

This is particularly useful for wrapping callback-based APIs or building custom async coordination patterns.

### Real-World Example: Timeout Wrapper

```javascript
function withTimeout(asyncFn, ms) {
  const { promise: timeoutPromise, reject } = Promise.withResolvers();
  const timer = setTimeout(() => reject(new Error('Timeout')), ms);

  return Promise.race([
    asyncFn().finally(() => clearTimeout(timer)),
    timeoutPromise,
  ]);
}

// Usage
const data = await withTimeout(() => fetch('/api/data'), 5000);
```

## Well-Formed Unicode Strings

`String.prototype.isWellFormed()` and `String.prototype.toWellFormed()` help you deal with lone surrogates — characters that can cause issues in `encodeURIComponent` and other APIs.

```javascript
const problematic = 'Hello \uD800 World';

problematic.isWellFormed();  // false
problematic.toWellFormed();  // 'Hello � World' (lone surrogate replaced)

// Safe encoding
const safeStr = input.isWellFormed() ? input : input.toWellFormed();
const encoded = encodeURIComponent(safeStr); // No more URIError
```

At Tekion, we dealt with user-generated content from dealership forms in multiple languages. Malformed Unicode caused silent failures in our search indexing pipeline. These methods would have caught those issues early.

## RegExp v Flag (Unicode Sets)

The new `v` flag replaces the `u` flag with extended capabilities for matching Unicode characters and set operations.

```javascript
// Match any emoji
const emojiRegex = /\p{Emoji}/v;
emojiRegex.test('👋'); // true

// Set subtraction: match Greek letters except specific ones
const regex = /[\p{Script=Greek}--[αβγ]]/v;
regex.test('δ'); // true
regex.test('α'); // false

// Set intersection: match characters that are both ASCII and digits
const asciiDigits = /[\p{ASCII}&&\p{Number}]/v;
asciiDigits.test('5'); // true
asciiDigits.test('٥'); // false (Arabic-Indic digit)
```

## ArrayBuffer Transfer

`ArrayBuffer.prototype.transfer()` lets you efficiently move ownership of a buffer's memory, similar to Rust's ownership model.

```javascript
const buffer = new ArrayBuffer(1024);
const transferred = buffer.transfer();

buffer.byteLength;      // 0 (original is now detached)
transferred.byteLength; // 1024

// Resize during transfer
const resized = buffer.transfer(2048);
```

This is useful in performance-critical scenarios like WebGL, audio processing, or working with large binary data in Web Workers.

## Atomics.waitAsync

`Atomics.waitAsync()` provides non-blocking waiting on shared memory, enabling better coordination between the main thread and Web Workers.

```javascript
const sharedBuffer = new SharedArrayBuffer(4);
const sharedArray = new Int32Array(sharedBuffer);

// Non-blocking wait on main thread
const result = Atomics.waitAsync(sharedArray, 0, 0);
result.value.then(() => {
  console.log('Worker signaled completion');
});

// In worker: Atomics.notify(sharedArray, 0);
```

## Adoption Strategy

These features have strong browser support as of early 2025. Here is my recommendation for adopting them:

- **Use now**: `Object.groupBy`, `Promise.withResolvers`, `String.isWellFormed()` — well-supported, immediate productivity gains
- **Use with caution**: RegExp `v` flag — check your browser support matrix
- **Use in Node.js/Workers**: `ArrayBuffer.transfer`, `Atomics.waitAsync` — more relevant for backend/worker contexts

## Key Takeaways

- `Object.groupBy` eliminates one of the most common utility functions in JavaScript projects
- `Promise.withResolvers` cleans up the deferred promise pattern
- Well-formed Unicode methods prevent silent encoding failures
- The RegExp `v` flag enables powerful Unicode-aware pattern matching
- These features are production-ready in modern browsers and Node.js 22+
